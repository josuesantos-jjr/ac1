import { google } from 'googleapis';
import { GoogleSheetsAuth } from './googleSheetsAuth';
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { createLogger } from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

export interface BackupConfig {
  googleFolderId: string;
  schedule: 'daily' | 'weekly' | 'manual';
  retentionDays: number;
  compressionLevel: number;
  enabled: boolean;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  fileName: string;
  fileSize: number;
  googleFileId?: string;
  downloadUrl?: string;
  error?: string;
}

/**
 * Serviço de Backup para Google Drive
 * - Backup completo da pasta clientes/
 * - Upload direto para Google Drive
 * - Gerenciamento de retenção automática
 * - Sem armazenamento local de arquivos
 */
export class GoogleDriveBackupService {
  private logger = createLogger({
    categoria: 'google-drive-backup',
    fonte: 'src/backend/service/googleDriveBackupService.ts'
  });

  private googleSheetsAuth: GoogleSheetsAuth;

  constructor() {
    this.googleSheetsAuth = new GoogleSheetsAuth();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.googleSheetsAuth.isAuthenticated();
  }

  /**
   * Compacta pasta em memória e faz upload para Google Drive
   */
  async executarBackupCompleto(backupConfig: BackupConfig): Promise<BackupResult> {
    const inicio = Date.now();
    const backupId = this.gerarBackupId();

    try {
      this.logger.info('Iniciando backup completo para Google Drive', { backupId, config: backupConfig });

      // Verificar autenticação
      if (!this.isAuthenticated()) {
        throw new Error('Usuário não autenticado no Google Drive');
      }

      // Verificar se já foi feito backup hoje (se agendado)
      if (backupConfig.schedule !== 'manual' && this.verificarBackupHoje()) {
        return {
          success: false,
          backupId,
          fileName: '',
          fileSize: 0,
          error: 'Backup já realizado hoje'
        };
      }

      // Compactar pasta clientes em memória
      const pastaClientes = path.join(process.cwd(), 'clientes');
      const { buffer, tamanho } = await this.compactarPastaEmMemoria(pastaClientes);

      // Gerar nome do arquivo
      const hoje = new Date();
      const fileName = `backup_${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}_${String(hoje.getHours()).padStart(2, '0')}-${String(hoje.getMinutes()).padStart(2, '0')}.zip`;

      // Upload para Google Drive
      const uploadResult = await this.uploadParaGoogleDrive(
        buffer,
        fileName,
        backupConfig.googleFolderId
      );

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      const clientId = path.basename(process.cwd());
      try {
        await syncManager.saveClientData(clientId, {
          backupLog: {
            backupId,
            dataExecucao: new Date().toISOString(),
            tipo: 'backup_completo_google_drive',
            arquivo: {
              nome: fileName,
              tamanho,
              googleFileId: uploadResult.googleFileId,
              downloadUrl: `https://drive.google.com/file/d/${uploadResult.googleFileId}/view`
            },
            sistema: {
              duracaoSegundos: Math.round((Date.now() - inicio) / 1000),
              memoriaUsadaMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              status: 'success'
            }
          }
        });
        console.log(`[Google Drive Backup] Backup registrado no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[Google Drive Backup] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      // Registrar backup
      const registro = this.criarRegistroBackup(backupId, fileName, tamanho, uploadResult.googleFileId, inicio);
      this.salvarRegistroBackup(registro);

      // Limpar backups antigos se necessário
      if (backupConfig.retentionDays > 0) {
        await this.limparBackupsAntigos(backupConfig.googleFolderId, backupConfig.retentionDays);
      }

      this.logger.info('Backup completo realizado com sucesso', {
        backupId,
        fileName,
        tamanhoOriginal: tamanho,
        tempoTotal: Math.round((Date.now() - inicio) / 1000)
      });

      return {
        success: true,
        backupId,
        fileName,
        fileSize: tamanho,
        googleFileId: uploadResult.googleFileId,
        downloadUrl: uploadResult.downloadUrl
      };

    } catch (error) {
      this.logger.error('Erro durante backup completo', {
        backupId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        backupId,
        fileName: '',
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido no backup'
      };
    }
  }

  /**
   * Compacta pasta inteira em memória
   */
  private async compactarPastaEmMemoria(caminhoOrigem: string): Promise<{ buffer: Buffer; tamanho: number }> {
    return new Promise((resolve, reject) => {
      // Verificar se a pasta existe
      if (!fs.existsSync(caminhoOrigem)) {
        reject(new Error(`Pasta de origem não encontrada: ${caminhoOrigem}`));
        return;
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;

      const archive = archiver('zip', {
        zlib: { level: 9 } // Melhor compressão
      });

      archive.on('error', (error) => {
        this.logger.error('Erro no arquivador', { error: error.message });
        reject(error);
      });

      archive.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        this.logger.info('Compactação concluída', { tamanhoFinal: totalSize });
        resolve({ buffer, tamanho: totalSize });
      });

      // Adicionar pasta inteira
      archive.directory(caminhoOrigem, false);
      archive.finalize();
    });
  }

  /**
   * Upload de arquivo para Google Drive
   */
  private async uploadParaGoogleDrive(
    buffer: Buffer,
    fileName: string,
    folderId: string
  ): Promise<{ googleFileId: string; downloadUrl: string }> {
    const drive = await this.googleSheetsAuth.getDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/zip',
      body: buffer
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,size,createdTime'
    });

    return {
      googleFileId: response.data.id!,
      downloadUrl: `https://drive.google.com/file/d/${response.data.id}/view`
    };
  }

  /**
   * Gera ID único para backup
   */
  private gerarBackupId(): string {
    const agora = new Date();
    return `backup-${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}-${String(agora.getHours()).padStart(2, '0')}${String(agora.getMinutes()).padStart(2, '0')}${String(agora.getSeconds()).padStart(2, '0')}`;
  }

  /**
   * Verifica se já foi feito backup hoje
   */
  private verificarBackupHoje(): boolean {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const backupLogPath = path.join(process.cwd(), 'backup-log.json');

      if (!fs.existsSync(backupLogPath)) {
        return false;
      }

      const logsContent = fs.readFileSync(backupLogPath, 'utf-8');
      const logs = JSON.parse(logsContent);

      const ultimoBackupHoje = logs.backups?.some((backup: any) =>
        backup.dataExecucao?.includes(hoje) && backup.success
      );

      return ultimoBackupHoje || false;
    } catch (error) {
      this.logger.warn('Erro ao verificar backup do dia', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Cria registro detalhado do backup
   */
  private criarRegistroBackup(
    backupId: string,
    fileName: string,
    fileSize: number,
    googleFileId: string,
    inicio: number
  ): any {
    const agora = new Date();

    return {
      backupId,
      dataExecucao: agora.toISOString(),
      tipo: 'backup_completo_google_drive',
      arquivo: {
        nome: fileName,
        tamanho: fileSize,
        googleFileId,
        downloadUrl: `https://drive.google.com/file/d/${googleFileId}/view`
      },
      sistema: {
        duracaoSegundos: Math.round((Date.now() - inicio) / 1000),
        memoriaUsadaMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        status: 'success'
      },
      configuracao: {
        destino: 'google_drive',
        retencao: 'gerenciada_automaticamente'
      }
    };
  }

  /**
   * Salva registro do backup
   */
  private salvarRegistroBackup(registro: any): void {
    try {
      const backupLogPath = path.join(process.cwd(), 'backup-log.json');

      let logs: { backups: any[], lastUpdated: string } = { backups: [], lastUpdated: new Date().toISOString() };

      if (fs.existsSync(backupLogPath)) {
        logs = JSON.parse(fs.readFileSync(backupLogPath, 'utf-8'));
      }

      if (!logs.backups) logs.backups = [];
      logs.backups.push(registro);
      logs.lastUpdated = new Date().toISOString();

      // Manter apenas os últimos 50 backups
      if (logs.backups.length > 50) {
        logs.backups = logs.backups.slice(-50);
      }

      fs.writeFileSync(backupLogPath, JSON.stringify(logs, null, 2), 'utf-8');

      this.logger.debug('Registro de backup salvo', { backupId: registro.backupId });
    } catch (error) {
      this.logger.error('Erro ao salvar registro de backup', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Limpa backups antigos do Google Drive
   */
  private async limparBackupsAntigos(folderId: string, retentionDays: number): Promise<void> {
    try {
      const drive = await this.googleSheetsAuth.getDriveClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Buscar arquivos de backup antigos
      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'backup_' and mimeType = 'application/zip'`,
        fields: 'files(id,name,createdTime)',
        orderBy: 'createdTime asc'
      });

      const files = response.data.files || [];
      const filesToDelete = files.filter(file => {
        const fileDate = new Date(file.createdTime!);
        return fileDate < cutoffDate;
      });

      for (const file of filesToDelete) {
        try {
          await drive.files.delete({ fileId: file.id! });
          this.logger.info('Backup antigo removido', { fileName: file.name, fileId: file.id });
        } catch (error) {
          this.logger.warn('Erro ao remover backup antigo', { fileName: file.name, error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (filesToDelete.length > 0) {
        this.logger.info('Limpeza de backups antigos concluída', { removidos: filesToDelete.length });
      }

    } catch (error) {
      this.logger.error('Erro ao limpar backups antigos', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Lista backups existentes no Google Drive
   */
  async listarBackups(folderId: string): Promise<any[]> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }

      const drive = await this.googleSheetsAuth.getDriveClient();

      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'backup_' and mimeType = 'application/zip'`,
        fields: 'files(id,name,size,createdTime,modifiedTime)',
        orderBy: 'createdTime desc',
        pageSize: 20
      });

      return response.data.files?.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        downloadUrl: `https://drive.google.com/file/d/${file.id}/view`
      })) || [];

    } catch (error) {
      this.logger.error('Erro ao listar backups', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }
}

// Instância singleton
export const googleDriveBackupService = new GoogleDriveBackupService();
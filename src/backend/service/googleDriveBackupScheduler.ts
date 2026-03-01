import { google } from 'googleapis';
import { GoogleSheetsAuth } from './googleSheetsAuth';
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { createLogger } from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

/**
 * Serviço Independente de Backup Automático para Google Drive
 * - Executa backup diário das pastas clientes/ e dados/
 * - Serviço PM2 independente (não interfere no sistema principal)
 * - Backup automático às 00:05 todos os dias
 * - Gerenciamento automático de retenção
 */
export class GoogleDriveBackupScheduler {
  private logger = createLogger({
    categoria: 'google-drive-backup-scheduler',
    fonte: 'src/backend/service/googleDriveBackupScheduler.ts'
  });

  private googleSheetsAuth: GoogleSheetsAuth;
  private configPath: string;
  private backupConfig: BackupSchedulerConfig | null = null;

  constructor() {
    this.googleSheetsAuth = new GoogleSheetsAuth();
    this.configPath = path.join(process.cwd(), 'backup-scheduler-config.json');
    this.carregarConfiguracao();
  }

  /**
   * Loop principal do scheduler
   */
  async iniciarScheduler(): Promise<void> {
    this.logger.info('🚀 Iniciando Google Drive Backup Scheduler');

    // Loop infinito com verificação a cada minuto
    while (true) {
      try {
        await this.verificarBackupDiario();
      } catch (error) {
        this.logger.error('Erro no scheduler', { error: error instanceof Error ? error.message : String(error) });
      }

      // Aguarda 1 minuto antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  /**
   * Verifica se deve executar backup diário (00:05)
   */
  private async verificarBackupDiario(): Promise<void> {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();

    // Executa às 00:05 (para evitar conflito com 00:00 exato)
    if (hora === 0 && minuto >= 5 && minuto <= 10) {
      this.logger.info('⏰ Horário de backup detectado, verificando se já foi executado hoje');

      if (!this.verificarBackupExecutadoHoje()) {
        await this.executarBackupDiario();
      } else {
        this.logger.debug('Backup já executado hoje, pulando');
      }
    }
  }

  /**
   * Executa backup completo das pastas clientes/ e dados/
   */
  private async executarBackupDiario(): Promise<void> {
    const inicio = Date.now();

    try {
      this.logger.info('🔄 Iniciando backup diário para Google Drive');

      // Verificar configuração
      if (!this.backupConfig || !this.backupConfig.googleFolderId) {
        this.logger.warn('Configuração de backup não encontrada ou incompleta');
        return;
      }

      // Verificar autenticação
      if (!this.googleSheetsAuth.isAuthenticated()) {
        this.logger.error('Usuário não autenticado no Google Drive');
        return;
      }

      // Compactar pastas
      const { buffer, tamanho, metadados } = await this.compactarPastas();

      // Gerar nome do arquivo
      const hoje = new Date();
      const fileName = `backup_full_${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}_${String(hoje.getHours()).padStart(2, '0')}-${String(hoje.getMinutes()).padStart(2, '0')}.zip`;

      // Upload para Google Drive
      const uploadResult = await this.uploadParaGoogleDrive(buffer, fileName, this.backupConfig.googleFolderId);

      // Registrar backup
      await this.registrarBackup(fileName, tamanho, metadados, uploadResult, inicio);

      // Limpar backups antigos se necessário
      if (this.backupConfig.retentionDays > 0) {
        await this.limparBackupsAntigos(this.backupConfig.googleFolderId, this.backupConfig.retentionDays);
      }

      this.logger.info('✅ Backup diário concluído com sucesso', {
        fileName,
        tamanhoMB: Math.round(tamanho / 1024 / 1024),
        tempoTotal: Math.round((Date.now() - inicio) / 1000)
      });

    } catch (error) {
      this.logger.error('❌ Erro durante backup diário', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Compacta as pastas clientes/ e dados/ em memória
   */
  private async compactarPastas(): Promise<{ buffer: Buffer; tamanho: number; metadados: BackupMetadata }> {
    return new Promise((resolve, reject) => {
      const pastas = ['clientes', 'dados'];
      const chunks: Buffer[] = [];
      let totalSize = 0;
      const metadados: BackupMetadata = {
        pastas: {},
        totalArquivos: 0,
        timestamp: new Date().toISOString()
      };

      const archive = archiver('zip', { zlib: { level: 9 } });

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
        resolve({ buffer, tamanho: totalSize, metadados });
      });

      // Processar cada pasta
      for (const pastaNome of pastas) {
        const pastaPath = path.join(process.cwd(), pastaNome);

        if (fs.existsSync(pastaPath)) {
          // Contar arquivos e calcular tamanho
          const stats = this.calcularEstatisticasPasta(pastaPath);
          metadados.pastas[pastaNome] = stats;
          metadados.totalArquivos += stats.totalArquivos;

          // Adicionar pasta ao ZIP
          archive.directory(pastaPath, pastaNome);
          this.logger.debug(`Pasta adicionada ao backup: ${pastaNome}`, stats);
        } else {
          this.logger.warn(`Pasta não encontrada: ${pastaPath}`);
        }
      }

      archive.finalize();
    });
  }

  /**
   * Calcula estatísticas de uma pasta
   */
  private calcularEstatisticasPasta(pastaPath: string): PastaStats {
    let totalArquivos = 0;
    let tamanhoTotal = 0;

    const calcularRecursivo = (dirPath: string) => {
      try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            calcularRecursivo(fullPath);
          } else {
            totalArquivos++;
            tamanhoTotal += stats.size;
          }
        }
      } catch (error) {
        this.logger.warn(`Erro ao calcular estatísticas da pasta ${dirPath}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    calcularRecursivo(pastaPath);

    return {
      totalArquivos,
      tamanhoTotal,
      tamanhoMB: Math.round(tamanhoTotal / 1024 / 1024)
    };
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
   * Registra backup concluído
   */
  private async registrarBackup(
    fileName: string,
    tamanho: number,
    metadados: BackupMetadata,
    uploadResult: { googleFileId: string; downloadUrl: string },
    inicio: number
  ): Promise<void> {
    const registro = {
      backupId: `backup-${Date.now()}`,
      dataExecucao: new Date().toISOString(),
      tipo: 'backup_completo_google_drive_scheduler',
      arquivo: {
        nome: fileName,
        tamanho,
        googleFileId: uploadResult.googleFileId,
        downloadUrl: uploadResult.downloadUrl
      },
      metadados,
      sistema: {
        duracaoSegundos: Math.round((Date.now() - inicio) / 1000),
        memoriaUsadaMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        status: 'success'
      },
      configuracao: {
        destino: 'google_drive',
        retencao: this.backupConfig?.retentionDays || 30
      }
    };

    try {
      // Salvar no JSON
      const backupLogPath = path.join(process.cwd(), 'backup-scheduler-log.json');
      let logs: { backups: any[] } = { backups: [] };

      if (fs.existsSync(backupLogPath)) {
        logs = JSON.parse(fs.readFileSync(backupLogPath, 'utf-8'));
      }

      logs.backups.push(registro);

      // Manter apenas os últimos 30 backups
      if (logs.backups.length > 30) {
        logs.backups = logs.backups.slice(-30);
      }

      fs.writeFileSync(backupLogPath, JSON.stringify(logs, null, 2), 'utf-8');

      // Salvar no SQLite (opcional, para compatibilidade)
      try {
        await syncManager.saveClientData('backup-scheduler', {
          ultimoBackup: registro
        });
      } catch (sqliteError) {
        // Não crítico, continua sem SQLite
      }

      this.logger.debug('Registro de backup salvo', { backupId: registro.backupId });
    } catch (error) {
      this.logger.error('Erro ao salvar registro de backup', {
        error: error instanceof Error ? error.message : String(error)
      });
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

      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'backup_full_' and mimeType = 'application/zip'`,
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
          this.logger.warn('Erro ao remover backup antigo', {
            fileName: file.name,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      if (filesToDelete.length > 0) {
        this.logger.info('Limpeza de backups antigos concluída', { removidos: filesToDelete.length });
      }

    } catch (error) {
      this.logger.error('Erro ao limpar backups antigos', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Verifica se backup já foi executado hoje
   */
  private verificarBackupExecutadoHoje(): boolean {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const backupLogPath = path.join(process.cwd(), 'backup-scheduler-log.json');

      if (!fs.existsSync(backupLogPath)) {
        return false;
      }

      const logs = JSON.parse(fs.readFileSync(backupLogPath, 'utf-8'));
      const ultimoBackupHoje = logs.backups?.some((backup: any) =>
        backup.dataExecucao?.includes(hoje) && backup.sistema?.status === 'success'
      );

      return ultimoBackupHoje || false;
    } catch (error) {
      this.logger.warn('Erro ao verificar backup do dia', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Carrega configuração do scheduler
   */
  private carregarConfiguracao(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        this.backupConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.logger.info('Configuração do scheduler carregada', { config: this.backupConfig });
      } else {
        this.logger.warn('Arquivo de configuração do scheduler não encontrado');
      }
    } catch (error) {
      this.logger.error('Erro ao carregar configuração do scheduler', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Salva configuração do scheduler
   */
  salvarConfiguracao(config: BackupSchedulerConfig): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      this.backupConfig = config;
      this.logger.info('Configuração do scheduler salva', { config });
    } catch (error) {
      this.logger.error('Erro ao salvar configuração do scheduler', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Obtém configuração atual
   */
  obterConfiguracao(): BackupSchedulerConfig | null {
    return this.backupConfig;
  }
}

// Interfaces
interface BackupSchedulerConfig {
  googleFolderId: string;
  retentionDays: number;
  enabled: boolean;
}

interface PastaStats {
  totalArquivos: number;
  tamanhoTotal: number;
  tamanhoMB: number;
}

interface BackupMetadata {
  pastas: { [nome: string]: PastaStats };
  totalArquivos: number;
  timestamp: string;
}

// Função principal para execução PM2
async function main() {
  const scheduler = new GoogleDriveBackupScheduler();
  await scheduler.iniciarScheduler();
}

// Executa se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export const googleDriveBackupScheduler = new GoogleDriveBackupScheduler();
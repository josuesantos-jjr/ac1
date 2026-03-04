import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import archiver from 'archiver';
import { createLogger } from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

/**
 * Serviço de Backup Ultra-Otimizado para pasta clientes inteira
 * - Backup completo da pasta clientes/
 * - Não armazena arquivos localmente
 * - Apenas registra informações detalhadas
 * - Envio direto por WhatsApp
 */
export class BackupServiceOtimizado {
  private logger = createLogger({
    categoria: 'backup-service-otimizado',
    fonte: 'src/backend/service/backupServiceOtimizado.ts'
  });

  /**
   * Compacta pasta inteira em memória (sem salvar arquivo)
   */
  public async compactarPastaEmMemoria(caminhoOrigem: string): Promise<{ buffer: Buffer; tamanho: number; hash: string }> {
    return new Promise((resolve, reject) => {
      this.logger.info('Iniciando compactação em memória', { caminhoOrigem });

      // Verifica se a pasta de origem existe
      if (!fs.existsSync(caminhoOrigem)) {
        const erro = `Pasta de origem não encontrada: ${caminhoOrigem}`;
        this.logger.error(erro);
        return reject(new Error(erro));
      }

      // Arrays para coletar dados
      const chunks: Buffer[] = [];
      let totalSize = 0;

      // Cria o arquivo ZIP em memória
      const archive = archiver('zip', {
        zlib: { level: 9 } // Melhor compressão
      });

      archive.on('error', (erro) => {
        this.logger.error('Erro no arquivador', { erro: erro.message });
        reject(erro);
      });

      archive.on('warning', (erro) => {
        if (erro.code === 'ENOENT') {
          this.logger.warn('Arquivo não encontrado durante compactação', { erro: erro.message });
        } else {
          this.logger.warn('Aviso durante compactação', { erro: erro.message });
        }
      });

      // Coleta dados em memória
      archive.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const hash = this.gerarHashSimples(buffer);

        this.logger.info('Compactação em memória concluída', {
          tamanhoOriginal: this.calcularTamanhoPasta(caminhoOrigem),
          tamanhoCompactado: totalSize,
          hash
        });

        resolve({
          buffer,
          tamanho: totalSize,
          hash
        });
      });

      archive.directory(caminhoOrigem, false);
      archive.finalize();
    });
  }

  /**
   * Calcula tamanho total da pasta
   */
  private calcularTamanhoPasta(caminho: string): number {
    try {
      let totalSize = 0;

      const calcularRecursivo = (dirPath: string) => {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            calcularRecursivo(fullPath);
          } else {
            totalSize += stats.size;
          }
        }
      };

      calcularRecursivo(caminho);
      return totalSize;
    } catch (erro) {
      this.logger.error('Erro ao calcular tamanho da pasta', { erro: erro instanceof Error ? erro.message : String(erro) });
      return 0;
    }
  }

  /**
   * Gera hash simples do buffer
   */
  private gerarHashSimples(buffer: Buffer): string {
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verifica se é hora de fazer backup (00:05)
   */
  verificarHorarioBackup(): boolean {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();

    // Executa às 00:05 (para evitar conflito com 00:00 exato)
    const executar = hora === 0 && minuto <= 10;

    this.logger.debug('Verificação de horário de backup', {
      hora,
      minuto,
      executar,
      timestamp: agora.toISOString()
    });

    return executar;
  }

  /**
   * Verifica se já foi feito backup hoje
   */
  verificarBackupHoje(): boolean {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const backupLogPath = path.join(process.cwd(), 'backup-log.json');

      if (!fs.existsSync(backupLogPath)) {
        this.logger.debug('Log de backup não encontrado, primeiro backup do dia');
        return false;
      }

      const logsContent = fs.readFileSync(backupLogPath, 'utf-8');
      const logs = JSON.parse(logsContent);
      const ultimoBackupHoje = logs.backups?.some((backup: any) =>
        backup.dataExecucao?.includes(hoje)
      );

      if (ultimoBackupHoje) {
        this.logger.debug('Backup já realizado hoje, pulando');
        return true;
      }

      this.logger.debug('Último backup não é de hoje, fazendo novo backup');
      return false;
    } catch (erro) {
      this.logger.error('Erro ao verificar status do backup', { erro: erro instanceof Error ? erro.message : String(erro) });
      return false;
    }
  }

  /**
   * Coleta métricas detalhadas da pasta clientes
   */
  async coletarMetricas(): Promise<any> {
    const pastaClientes = path.join(process.cwd(), 'clientes');
    const infoPath = path.join(process.cwd(), 'config', 'infoCliente.json');
    let infoCliente: any = {};

    // Carrega infoCliente.json
    if (fs.existsSync(infoPath)) {
      try {
        const infoContent = fs.readFileSync(infoPath, 'utf-8');
        infoCliente = JSON.parse(infoContent);
      } catch (erro) {
        this.logger.error('Erro ao ler infoCliente.json', { erro: erro instanceof Error ? erro.message : String(erro) });
      }
    }


    try {
      const clientesAtivos = infoCliente.STATUS || 'ativo';

      let totalClientes = 0;
      let totalConversas = 0;
      let tamanhoTotal = 0;

      for (const categoria of clientesAtivos) {
        const categoriaPath = path.join(pastaClientes, categoria);

        if (fs.existsSync(categoriaPath)) {
          const clientes = fs.readdirSync(categoriaPath)
            .filter(item => fs.statSync(path.join(categoriaPath, item)).isDirectory());

          totalClientes += clientes.length;

          for (const cliente of clientes) {
            const clientePath = path.join(categoriaPath, cliente, 'Chats', 'Historico');

            if (fs.existsSync(clientePath)) {
              const conversas = fs.readdirSync(clientePath)
                .filter(item => fs.statSync(path.join(clientePath, item)).isDirectory());

              totalConversas += conversas.length;

              // Calcula tamanho aproximado
              try {
                const arquivos = fs.readdirSync(clientePath, { recursive: true });
                for (const arquivo of arquivos as string[]) {
                  const arquivoPath = path.join(clientePath, arquivo);
                  if (fs.statSync(arquivoPath).isFile()) {
                    tamanhoTotal += fs.statSync(arquivoPath).size;
                  }
                }
              } catch (erro) {
                // Ignora erros de cálculo de tamanho
              }
            }
          }
        }
      }

      return {
        totalClientes,
        totalConversas,
        tamanhoTotal,
        categorias: clientesAtivos,
        timestamp: new Date().toISOString()
      };
    } catch (erro) {
      this.logger.error('Erro ao coletar métricas', { erro: erro instanceof Error ? erro.message : String(erro) });
      return {
        totalClientes: 0,
        totalConversas: 0,
        tamanhoTotal: 0,
        categorias: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
    * Salva registro detalhado do backup
    */
   async salvarRegistroBackup(registro: any): Promise<void> {
    try {
      const backupLogPath = path.join(process.cwd(), 'backup-log.json');

      // Carrega logs existentes ou cria estrutura inicial
      let logs: { backups: any[], lastUpdated: string } = { backups: [], lastUpdated: new Date().toISOString() };
      if (fs.existsSync(backupLogPath)) {
        logs = JSON.parse(fs.readFileSync(backupLogPath, 'utf-8'));
      }

      // Adiciona novo registro
      if (!logs.backups) logs.backups = [];
      logs.backups.push(registro as any);
      logs.lastUpdated = new Date().toISOString();

      // Mantém apenas os últimos 30 backups
      if (logs.backups.length > 30) {
        logs.backups = logs.backups.slice(-30);
      }

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      const clientId = path.basename(process.cwd());
      try {
        await syncManager.saveClientData(clientId, {
          backupLog: registro
        });
        console.log(`[Backup Service Otimizado] Backup registrado no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[Backup Service Otimizado] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      const logsJson = JSON.stringify(logs, null, 2);
      fs.writeFileSync(backupLogPath, logsJson, 'utf-8');

      this.logger.info('Registro de backup salvo', {
        backupId: registro.backupId,
        tamanhoRegistro: logsJson.length
      });
    } catch (erro) {
      this.logger.error('Erro ao salvar registro de backup', { erro: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  /**
   * Obtém o chat ID de backup do cliente
   */
  obterChatIdBackup(caminhoClientes: string): string | null {
    try {
      const infoPath = path.join(caminhoClientes, 'config', 'infoCliente.json');

      if (!fs.existsSync(infoPath)) {
        this.logger.error('Arquivo infoCliente.json não encontrado', { caminho: infoPath });
        return null;
      }

      const infoCliente = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      const chatId = infoCliente.BK_CHATID;

      if (!chatId) {
        this.logger.error('BK_CHATID não configurado no infoCliente.json');
        return null;
      }

      this.logger.debug('Chat ID de backup obtido', { chatId });
      return chatId;

    } catch (erro) {
      this.logger.error('Erro ao obter chat ID de backup', { erro: erro instanceof Error ? erro.message : String(erro) });
      return null;
    }
  }

  /**
   * Executa backup completo da pasta clientes (otimizado)
   */
  async executarBackup(caminhoClientes: string): Promise<{ buffer: Buffer; registro: any } | null> {
    const inicio = Date.now();

    try {
      this.logger.info('Iniciando processo de backup ultra-otimizado');

      // Verifica se já foi feito backup hoje
      if (this.verificarBackupHoje()) {
        return null;
      }

      // Coleta métricas antes do backup
      const metricas = await this.coletarMetricas();
      this.logger.info('Métricas coletadas', { metricas });

      // Compacta em memória
      const pastaClientes = path.join(process.cwd(), 'clientes');
      this.logger.info('Compactando pasta clientes inteira', { pasta: pastaClientes });

      const { buffer, tamanho, hash } = await this.compactarPastaEmMemoria(pastaClientes);

      // Prepara registro detalhado
      const agora = new Date();
      const backupId = `backup-full-${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}-${String(agora.getHours()).padStart(2, '0')}-${String(agora.getMinutes()).padStart(2, '0')}-${String(agora.getSeconds()).padStart(2, '0')}`;

      const registro = {
        backupId,
        dataExecucao: agora.toISOString(),
        tipo: 'backup_completo',
        metricas: {
          pastaClientesMB: Math.round(metricas.tamanhoTotal / 1024 / 1024),
          backupCompactadoMB: Math.round(tamanho / 1024 / 1024),
          taxaCompressao: metricas.tamanhoTotal > 0 ?
            Math.round((1 - (tamanho / metricas.tamanhoTotal)) * 100) + '%' : '0%',
          totalClientes: metricas.totalClientes,
          totalConversas: metricas.totalConversas,
          diretoriosProcessados: metricas.categorias.length
        },
        sistema: {
          duracaoSegundos: Math.round((Date.now() - inicio) / 1000),
          cpuUsoPercent: 0, // Será calculado posteriormente
          memoriaUsadaMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          status: 'preparado_para_envio'
        },
        configuracao: {
          fonte: 'pasta_clientes_inteira',
          destino: 'whatsapp_pessoal',
          retencao: 'nenhum_arquivo_local'
        }
      };

      this.logger.info('Backup compactado com sucesso', {
        backupId,
        tamanhoOriginal: metricas.tamanhoTotal,
        tamanhoCompactado: tamanho,
        taxaCompressao: registro.metricas.taxaCompressao
      });

      return { buffer, registro };

    } catch (erro) {
      this.logger.error('Erro durante execução do backup', { erro: erro instanceof Error ? erro.message : String(erro) });
      throw erro;
    }
  }

  /**
   * Finaliza backup com envio por WhatsApp
   */
  async finalizarBackupComWhatsApp(client: any, chatId: string, buffer: Buffer, registro: any): Promise<void> {
    try {
      // Atualiza status do registro
      registro.whatsapp = {
        enviado: true,
        chatId: chatId,
        dataEnvio: new Date().toISOString(),
        tamanhoEnviadoMB: Math.round(buffer.length / 1024 / 1024),
        status: 'success'
      };

      // Salva registro final
      this.salvarRegistroBackup(registro);

      this.logger.info('Backup finalizado e enviado com sucesso', {
        backupId: registro.backupId,
        tamanhoEnviado: buffer.length
      });

    } catch (erro) {
      this.logger.error('Erro ao finalizar backup com WhatsApp', { erro: erro instanceof Error ? erro.message : String(erro) });

      // Salva registro com erro
      registro.whatsapp = {
        enviado: false,
        chatId: chatId,
        dataEnvio: new Date().toISOString(),
        erro: erro instanceof Error ? erro.message : String(erro),
        status: 'error'
      };

      this.salvarRegistroBackup(registro);
      throw erro;
    }
  }
}

// Exporta instância singleton
export const backupServiceOtimizado = new BackupServiceOtimizado();
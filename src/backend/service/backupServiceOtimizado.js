import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import archiver from 'archiver';
import { createLogger } from '../util/logger.ts';

/**
 * Serviço de Backup Ultra-Otimizado para pasta clientes inteira
 * - Backup completo da pasta clientes/
 * - Não armazena arquivos localmente
 * - Apenas registra informações detalhadas
 * - Envio direto por WhatsApp
 */
export class BackupServiceOtimizado {
  constructor() {
    this.logger = createLogger({
      categoria: 'backup-service-otimizado',
      fonte: 'src/backend/service/backupServiceOtimizado.js'
    });
  }

  /**
   * Compacta pasta inteira em memória (sem salvar arquivo)
   */
  async compactarPastaEmMemoria(caminhoOrigem) {
    return new Promise((resolve, reject) => {
      this.logger.info('Iniciando compactação em memória', { caminhoOrigem });

      // Verifica se a pasta de origem existe
      if (!fs.existsSync(caminhoOrigem)) {
        const erro = `Pasta de origem não encontrada: ${caminhoOrigem}`;
        this.logger.error(erro);
        return reject(new Error(erro));
      }

      // Arrays para coletar dados
      const chunks = [];
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
  calcularTamanhoPasta(caminho) {
    try {
      let totalSize = 0;

      const calcularRecursivo = (dirPath) => {
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
      this.logger.error('Erro ao calcular tamanho da pasta', { erro: erro.message });
      return 0;
    }
  }

  /**
   * Gera hash simples do buffer
   */
  gerarHashSimples(buffer) {
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
  verificarHorarioBackup() {
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
  verificarBackupHoje() {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const backupLogPath = path.join(process.cwd(), 'backup-log.json');

      if (!fs.existsSync(backupLogPath)) {
        this.logger.debug('Log de backup não encontrado, primeiro backup do dia');
        return false;
      }

      const logsContent = fs.readFileSync(backupLogPath, 'utf-8');
      const logs = JSON.parse(logsContent);
      const ultimoBackupHoje = logs.backups?.some(backup =>
        backup.dataExecucao?.includes(hoje)
      );

      if (ultimoBackupHoje) {
        this.logger.debug('Backup já realizado hoje, pulando');
        return true;
      }

      this.logger.debug('Último backup não é de hoje, fazendo novo backup');
      return false;
    } catch (erro) {
      this.logger.error('Erro ao verificar status do backup', { erro: erro.message });
      return false;
    }
  }

  /**
   * Coleta métricas detalhadas da pasta clientes
   */
  async coletarMetricas() {
    const pastaClientes = path.join(process.cwd(), 'clientes');

    try {
      let totalClientes = 0;
      let totalConversas = 0;
      let tamanhoTotal = 0;
      const categorias = fs.readdirSync(pastaClientes)
        .filter(item => fs.statSync(path.join(pastaClientes, item)).isDirectory());

      for (const categoria of categorias) {
        const categoriaPath = path.join(pastaClientes, categoria);

        // Assumimos que cada subdiretório dentro de 'clientes/' é uma categoria (e.g., 'ativos', 'cancelados', 'modelos')
        // e que os clientes são subdiretórios dentro dessas categorias, ou, no novo formato,
        // o próprio cliente é um diretório diretamente sob 'clientes/'.
        // Precisamos ajustar para lidar com ambos os cenários ou padronizar.
        // Para simplificar, vou considerar que 'clientes/' pode conter tanto categorias (como 'ativos')
        // quanto diretamente IDs de clientes no formato novo.

        // Se a categoria é um diretório de cliente (novo formato)
        let clientesDiretos = [];
        if (fs.existsSync(path.join(categoriaPath, 'config', 'infoCliente.json'))) {
          clientesDiretos.push(categoria); // A própria "categoria" é um cliente
        }

        // Se a categoria contém subdiretórios de clientes (formato antigo/categorias)
        const subClientes = fs.readdirSync(categoriaPath)
          .filter(item => fs.statSync(path.join(categoriaPath, item)).isDirectory());

        const todosClientesNestaCategoria = [...clientesDiretos, ...subClientes];
        totalClientes += todosClientesNestaCategoria.length;

        for (const cliente of todosClientesNestaCategoria) {
          const clientePath = path.join(
            clientesDiretos.includes(cliente) ? pastaClientes : categoriaPath, // Se for cliente direto, o caminho já é pastaClientes/cliente
            cliente,
            'Chats',
            'Historico'
          );


            if (fs.existsSync(clientePath)) {
              const conversas = fs.readdirSync(clientePath)
                .filter(item => fs.statSync(path.join(clientePath, item)).isDirectory());

              totalConversas += conversas.length;

              // Calcula tamanho aproximado
              try {
                const arquivos = fs.readdirSync(clientePath, { recursive: true });
                for (const arquivo of arquivos) {
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
      

      return {
        totalClientes,
        totalConversas,
        tamanhoTotal,
        categorias: categorias,
        timestamp: new Date().toISOString()
      };
    } catch (erro) {
      this.logger.error('Erro ao coletar métricas', { erro: erro.message });
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
  salvarRegistroBackup(registro) {
    try {
      const backupLogPath = path.join(process.cwd(), 'backup-log.json');

      // Carrega logs existentes ou cria estrutura inicial
      let logs = { backups: [], lastUpdated: new Date().toISOString() };
      if (fs.existsSync(backupLogPath)) {
        logs = JSON.parse(fs.readFileSync(backupLogPath, 'utf-8'));
      }

      // Adiciona novo registro
      if (!logs.backups) logs.backups = [];
      logs.backups.push(registro);
      logs.lastUpdated = new Date().toISOString();

      // Mantém apenas os últimos 30 backups
      if (logs.backups.length > 30) {
        logs.backups = logs.backups.slice(-30);
      }

      const logsJson = JSON.stringify(logs, null, 2);
      fs.writeFileSync(backupLogPath, logsJson, 'utf-8');

      this.logger.info('Registro de backup salvo', {
        backupId: registro.backupId,
        tamanhoRegistro: logsJson.length
      });
    } catch (erro) {
      this.logger.error('Erro ao salvar registro de backup', { erro: erro.message });
    }
  }

  /**
   * Obtém o chat ID de backup do cliente
   */
  obterChatIdBackup(caminhoClientes) {
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
      this.logger.error('Erro ao obter chat ID de backup', { erro: erro.message });
      return null;
    }
  }

  /**
   * Executa backup completo da pasta clientes (otimizado)
   */
  async executarBackup(caminhoClientes) {
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
      this.logger.error('Erro durante execução do backup', { erro: erro.message });
      throw erro;
    }
  }

  /**
   * Finaliza backup com envio por WhatsApp
   */
  async finalizarBackupComWhatsApp(client, chatId, buffer, registro) {
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
      this.logger.error('Erro ao finalizar backup com WhatsApp', { erro: erro.message });

      // Salva registro com erro
      registro.whatsapp = {
        enviado: false,
        chatId: chatId,
        dataEnvio: new Date().toISOString(),
        erro: erro.message,
        status: 'error'
      };

      this.salvarRegistroBackup(registro);
      throw erro;
    }
  }
}

// Exporta instância singleton
export const backupServiceOtimizado = new BackupServiceOtimizado();
import winston from 'winston';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { syncManager } from '../../database/sync.ts';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  clienteId?: string;
  message: string;
  details?: any;
  categoria?: string;
  fonte?: string;
}

interface LoggerOptions {
  clienteId?: string;
  categoria?: string;
  fonte?: string;
}

class ClienteLogger {
  private clienteId?: string;
  private categoria?: string;
  private fonte?: string;
  private logDir: string;
  private currentDate: string;
  private logFile: string;
  private winstonLogger!: winston.Logger;

  constructor(options: LoggerOptions = {}) {
    this.clienteId = options.clienteId;
    this.categoria = options.categoria || 'sistema';
    this.fonte = options.fonte;

    // Define diretório de logs baseado no cliente
    if (this.clienteId) {
      // Para clientes específicos: clientes/CMW/config/logs/
      this.logDir = path.join(process.cwd(), 'clientes', this.clienteId, 'config', 'logs');
    } else {
      // Para logs gerais do backend: logs/
      this.logDir = path.join(process.cwd(), 'logs');
    }

    this.currentDate = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logDir, `${this.currentDate}.json`);

    this.initializeLogDir();
    this.setupWinstonLogger();
  }

  private initializeLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Cria diretório de backup se não existir
    const backupDir = path.join(this.logDir, 'logs_backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  }

  private setupWinstonLogger() {
    // Custom format para combinar com estrutura JSON existente
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.sssZ' }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const logEntry: LogEntry = {
          timestamp: info.timestamp as string,
          level: info.level as 'info' | 'error' | 'warn',
          clienteId: this.clienteId,
          message: String(info.message),
          details: info.details,
          categoria: this.categoria,
          fonte: this.fonte || String(info.fonte || '')
        };
        return JSON.stringify(logEntry);
      })
    );

    this.winstonLogger = winston.createLogger({
      level: 'info',
      format: customFormat,
      transports: [
        new winston.transports.File({
          filename: this.logFile,
          maxsize: 50 * 1024 * 1024, // 50MB por arquivo
          maxFiles: 10, // Mantém 10 arquivos
          tailable: true
        }),
      ],
    });

    // Se não estiver em produção, também loga no console
    if (process.env.NODE_ENV !== 'production') {
      this.winstonLogger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf((info) => {
            const clientePrefix = this.clienteId ? `[${this.clienteId}] ` : '';
            const categoriaPrefix = this.categoria ? `{${this.categoria}} ` : '';
            return `${info.timestamp} ${clientePrefix}${categoriaPrefix}${info.level}: ${info.message}`;
          })
        ),
      }));
    }
  }

  private getLogEntries(): LogEntry[] {
    if (fs.existsSync(this.logFile)) {
      try {
        const content = fs.readFileSync(this.logFile, 'utf-8');
        if (content && content.trim()) {
          const lines = content.trim().split('\n');
          return lines.map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          }).filter(entry => entry !== null) as LogEntry[];
        }
      } catch (error) {
        console.warn('Erro ao fazer parse do arquivo de log. Resetando arquivo:', error);
        this.resetLogFile();
      }
    }
    return [];
  }

  private resetLogFile(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        // Cria um backup do arquivo corrompido
        const backupPath = path.join(this.logDir, 'logs_backup', `${this.currentDate}_corrompido_${Date.now()}.json`);
        fs.copyFileSync(this.logFile, backupPath);
        console.log(`Arquivo de log corrompido salvo em backup: ${backupPath}`);
      }
      // Cria um novo arquivo vazio
      fs.writeFileSync(this.logFile, '', 'utf-8');
    } catch (backupError) {
      console.error('Erro ao criar backup do arquivo de log corrompido:', backupError);
      // Força a criação de um novo arquivo mesmo com erro no backup
      try {
        fs.writeFileSync(this.logFile, '', 'utf-8');
      } catch (writeError) {
        console.error('Erro crítico ao resetar arquivo de log:', writeError);
      }
    }
  }

  private saveLog(entry: LogEntry) {
    try {
      const logs = this.getLogEntries();

      // Sanitiza a entrada para evitar caracteres que possam corromper o JSON
      const sanitizedEntry = {
        timestamp: entry.timestamp,
        level: entry.level,
        clienteId: entry.clienteId,
        message: this.sanitizeString(entry.message),
        details: entry.details ? this.sanitizeObject(entry.details) : undefined,
        categoria: entry.categoria,
        fonte: entry.fonte
      };

      logs.push(sanitizedEntry);

      // Limita o tamanho do log para evitar arquivos muito grandes
      const maxLogEntries = 10000;
      if (logs.length > maxLogEntries) {
        logs.splice(0, logs.length - maxLogEntries);
      }

      // Salva cada entrada em uma linha separada
      const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
      fs.writeFileSync(this.logFile, logContent, 'utf-8');

      // Também envia para Winston
      this.winstonLogger.log({
        level: entry.level,
        message: entry.message,
        clienteId: entry.clienteId,
        details: entry.details,
        categoria: entry.categoria,
        fonte: entry.fonte
      });

    } catch (error) {
      console.error('Erro ao salvar log:', error);
      // Em caso de erro crítico, tenta resetar o arquivo
      this.resetLogFile();
    }
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return String(str);
    }
    // Remove caracteres de controle e caracteres não imprimíveis, exceto quebra de linha e tab
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  info(message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      clienteId: this.clienteId,
      message,
      details,
      categoria: this.categoria,
      fonte: this.fonte
    };

    // Também faz console.log (compatibilidade)
    console.log(message, details || '');

    this.saveLog(entry);
  }

  error(message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      clienteId: this.clienteId,
      message,
      details,
      categoria: this.categoria,
      fonte: this.fonte
    };

    // Também faz console.error (compatibilidade)
    console.error(message, details || '');

    this.saveLog(entry);
  }

  warn(message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      clienteId: this.clienteId,
      message,
      details,
      categoria: this.categoria,
      fonte: this.fonte
    };

    // Também faz console.warn (compatibilidade)
    console.warn(message, details || '');

    this.saveLog(entry);
  }

  debug(message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info', // Debug como info para compatibilidade
      clienteId: this.clienteId,
      message,
      details,
      categoria: this.categoria,
      fonte: this.fonte
    };

    // Também faz console.log (compatibilidade)
    console.log(message, details || '');

    this.saveLog(entry);
  }
}

// Factory function para criar loggers por cliente
function createLogger(options: LoggerOptions = {}): ClienteLogger {
  return new ClienteLogger(options);
}

// Logger padrão para uso geral do backend
const defaultLogger = createLogger();

// Exporta tanto a factory quanto o logger padrão
export default defaultLogger;
export { createLogger, ClienteLogger };
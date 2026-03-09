import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  details?: any;
}

class Logger {
  private logDir: string;
  private currentDate: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.currentDate = new Date().toISOString().split('T')[0];
    this.logFile = path.join(this.logDir, `${this.currentDate}.json`);
    this.initializeLogDir();
  }

  private initializeLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogEntries(): LogEntry[] {
    if (fs.existsSync(this.logFile)) {
      try {
        const content = fs.readFileSync(this.logFile, 'utf-8');
        if (content && content.trim()) {
          // Verifica se o conteúdo é um JSON válido antes de fazer o parse
          const trimmedContent = content.trim();
          if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
            return JSON.parse(content);
          } else {
            console.warn('Arquivo de log não está no formato JSON válido. Resetando arquivo.');
            this.resetLogFile();
            return [];
          }
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
        const backupPath = this.logFile.replace('.json', `_backup_${Date.now()}.json`);
        fs.copyFileSync(this.logFile, backupPath);
        console.log(`Arquivo de log corrompido salvo em backup: ${backupPath}`);
      }
      // Cria um novo arquivo vazio
      fs.writeFileSync(this.logFile, '[]', 'utf-8');
    } catch (backupError) {
      console.error('Erro ao criar backup do arquivo de log corrompido:', backupError);
      // Força a criação de um novo arquivo mesmo com erro no backup
      try {
        fs.writeFileSync(this.logFile, '[]', 'utf-8');
      } catch (writeError) {
        console.error('Erro crítico ao resetar arquivo de log:', writeError);
      }
    }
  }

  private async saveLog(entry: LogEntry) {
    try {
      const logs = this.getLogEntries();

      // Sanitiza a entrada para evitar caracteres que possam corromper o JSON
      const sanitizedEntry = {
        timestamp: entry.timestamp,
        level: entry.level,
        message: this.sanitizeString(entry.message),
        details: entry.details ? this.sanitizeObject(entry.details) : undefined
      };

      logs.push(sanitizedEntry);

      // Limita o tamanho do log para evitar arquivos muito grandes
      const maxLogEntries = 10000;
      if (logs.length > maxLogEntries) {
        logs.splice(0, logs.length - maxLogEntries);
      }

      // 🔄 SALVAR NO SQLITE (sincronização automática) - logs
      try {
        // Como o logger é usado em contextos diferentes, vamos usar um cliente padrão se disponível
        const clienteId = 'modelos/Padrao'; // Cliente padrão para logs
        const { syncManager } = await import('../../../../src/database/sync.ts');
        await syncManager.saveClientData(clienteId, {
          logs: logs
        });
        console.log(`[Logger] Logs salvos no SQLite para ${clienteId}`);
      } catch (sqliteError) {
        console.error(`[Logger] Erro ao salvar logs no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2), 'utf-8');
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
      message,
      details
    };
    console.log(message, details || '');
    this.saveLog(entry);
  }

  error(message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      details
    };
    console.error(message, details || '');
    this.saveLog(entry);
  }

  warn(message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      details
    };
    console.warn(message, details || '');
    this.saveLog(entry);
  }
}

const logger = new Logger();
export default logger;
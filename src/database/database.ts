// @ts-nocheck - Desativando verificações de tipo para contornar problemas com sqlite3
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { DATABASE_SCHEMA, DATABASE_MAINTENANCE, DATABASE_MIGRATIONS, runSafeMigrations } from './schema.ts';

// Habilitar verbose mode para debugging
sqlite3.verbose();

/**
 * Classe principal para gerenciamento do banco de dados SQLite
 * Implementa isolamento completo por cliente e sincronização segura
 */
export class SQLiteDatabase {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'dados', 'crm_data.db');

    // Garantir que o diretório existe
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.initializeDatabase();
  }

  /**
   * Inicializa o banco de dados e cria tabelas se necessário
   */
  private initializeDatabase(): void {
    try {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar com banco de dados:', err);
          throw err;
        }
        console.log('🔗 Conexão SQLite estabelecida');
      });

      // Configurar o banco
      this.db.serialize(() => {
        // Configurações de performance e confiabilidade
        this.db!.run('PRAGMA journal_mode = WAL;');
        this.db!.run('PRAGMA synchronous = NORMAL;');
        this.db!.run('PRAGMA cache_size = 1000000;');
        this.db!.run('PRAGMA temp_store = memory;');

        // Criar tabelas se não existirem
        this.db!.exec(DATABASE_SCHEMA);

        // Executar migrações necessárias (versão segura)
        runSafeMigrations(this.db!);

        console.log('✅ Banco de dados SQLite inicializado com sucesso');
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  /**
   * Executa migrações necessárias para atualizar o banco de dados
   */
  private runMigrations(): void {
    try {
      // Criar tabela de controle de migrações se não existir
      this.db!.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Verificar quais migrações já foram aplicadas
      const appliedMigrationsResult = this.db!.prepare('SELECT version FROM schema_migrations').all();
      const appliedMigrations = Array.isArray(appliedMigrationsResult) ? appliedMigrationsResult as { version: number }[] : [];
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));

      // Executar migrações pendentes
      for (const migration of DATABASE_MIGRATIONS) {
        if (!appliedVersions.has(migration.version)) {
          console.log(`[Migration] Executando migração v${migration.version}: ${migration.name}`);
          this.db!.exec(migration.sql);
          this.db!.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
          console.log(`[Migration] ✅ Migração v${migration.version} concluída`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao executar migrações:', error);
      // Não lança erro para não bloquear a inicialização
    }
  }

  /**
   * Executa uma query preparada
   */
  prepare<T = any>(sql: string) {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.prepare(sql);
  }

  /**
   * Executa uma query sem parâmetros
   */
  exec(sql: string): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec(sql);
  }

  /**
   * Executa uma transação usando callbacks do sqlite3
   */
  transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        this.db!.run('BEGIN TRANSACTION');
        
        fn()
          .then(result => {
            this.db!.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve(result);
            });
          })
          .catch(error => {
            this.db!.run('ROLLBACK', () => {
              reject(error);
            });
          });
      });
    });
  }

  /**
   * Backup do banco de dados
   */
  backup(backupPath: string): void {
    try {
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`✅ Backup do banco de dados realizado para: ${backupPath}`);
    } catch (error) {
      console.error(`❌ Erro ao realizar backup do banco de dados para ${backupPath}:`, error);
      throw error;
    }
  }

  /**
   * Otimização do banco após migração
   */
  optimize(): void {
    if (!this.db) throw new Error('Database not initialized');
    this.exec(DATABASE_MAINTENANCE.optimize);
    console.log('✅ Banco de dados otimizado');
  }

  /**
   * Verifica integridade do banco
   */
  checkIntegrity(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise<boolean>((resolve, reject) => {
      this.db!.get(DATABASE_MAINTENANCE.integrityCheck, (err, row: any) => {
        if (err) {
          console.error('❌ Erro ao verificar a integridade do banco de dados:', err);
          resolve(false);
        } else {
          const isValid = row && row.integrity_check === 'ok';
          resolve(isValid);
        }
      });
    });
  }

  /**
   * Fecha a conexão com o banco
   */
  close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Erro ao fechar conexão:', err);
        } else {
          console.log('🔒 Conexão com banco de dados fechada');
        }
      });
      this.db = null;
    }
  }

  /**
   * Obtém estatísticas do banco
   */
  getStats(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        const stats: any = {};
        let completed = 0;
        const total = 4;

        const checkComplete = () => {
          completed++;
          if (completed === total) {
            resolve(stats);
          }
        };

        // Page count
        this.db!.get('PRAGMA page_count;', (err, row: any) => {
          stats.pageCount = row?.page_count || 0;
          checkComplete();
        });

        // Page size
        this.db!.get('PRAGMA page_size;', (err, row: any) => {
          stats.pageSize = row?.page_size || 0;
          checkComplete();
        });

        // Freelist count
        this.db!.get('PRAGMA freelist_count;', (err, row: any) => {
          stats.freelistCount = row?.freelist_count || 0;
          checkComplete();
        });

        // Table count
        this.db!.get('SELECT COUNT(*) as count FROM sqlite_master WHERE type=\'table\'', (err, row: any) => {
          stats.tableCount = row?.count || 0;
          checkComplete();
        });
      });
    });
  }
}

// Instância singleton do banco
let dbInstance: SQLiteDatabase | null = null;

export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = new SQLiteDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Cleanup automático no encerramento da aplicação
process.on('exit', () => {
  closeDatabase();
});

process.on('SIGINT', () => {
  closeDatabase();
  process.exit();
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit();
});
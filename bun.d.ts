// Declaração de tipos para 'bun:sqlite' - solução para "Cannot find module 'bun:sqlite'"
declare module 'bun:sqlite' {
  /**
   * Classe principal para gerenciar o banco de dados SQLite
   */
  export default class Database {
    constructor(path: string);
    run(sql: string, params?: any[]): { changes: number; lastInsertRowId: number };
    query<T = any>(sql: string): {
      all(params?: any[]): T[];
      get(params?: any[]): T | null;
    };
    prepare<T = any>(sql: string): {
      all(params?: any[]): T[];
      get(params?: any[]): T | null;
      run(params?: any[]): { changes: number; lastInsertRowId: number };
    };
    close(): void;
  }
}


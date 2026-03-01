// src/backend/util/storage/StateStorage.ts

export interface ActiveChatState {
  clienteId: string;
  chatId: string;
  estado: 'index' | 'disparo';
  enviandoMensagem: boolean;
  timestamp: number;
  abortController: AbortController | null;
}

export interface StateStorage {
  set(clienteId: string, chatId: string, state: ActiveChatState): Promise<void>;
  get(clienteId: string, chatId: string): Promise<ActiveChatState | null>;
  delete(clienteId: string, chatId: string): Promise<void>;
  cleanup(): Promise<void>;
  getMetrics(): Promise<any>;
}
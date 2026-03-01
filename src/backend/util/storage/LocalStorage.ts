// src/backend/util/storage/LocalStorage.ts
// Temporariamente usando abordagem alternativa devido a problemas de módulos ES
// import { StateStorage, ActiveChatState } from './StateStorage.ts';

// Definindo as interfaces localmente como workaround temporário
interface ActiveChatState {
  clienteId: string;
  chatId: string;
  estado: 'index' | 'disparo';
  enviandoMensagem: boolean;
  timestamp: number;
  abortController: AbortController | null;
}

interface StateStorage {
  set(clienteId: string, chatId: string, state: ActiveChatState): Promise<void>;
  get(clienteId: string, chatId: string): Promise<ActiveChatState | null>;
  getAllStatesForClient(clienteId: string): Promise<ActiveChatState[]>;
  delete(clienteId: string, chatId: string): Promise<void>;
  cleanup(): Promise<void>;
  getMetrics(): Promise<any>;
}

export class LocalStorage implements StateStorage {
  private states = new Map<string, ActiveChatState>();

  async set(clienteId: string, chatId: string, state: ActiveChatState): Promise<void> {
    const key = `${clienteId}:${chatId}`;
    this.states.set(key, { ...state, timestamp: Date.now() });
  }

  async get(clienteId: string, chatId: string): Promise<ActiveChatState | null> {
    const key = `${clienteId}:${chatId}`;
    const state = this.states.get(key);

    // Remove estados antigos (>60s)
    if (state && Date.now() - state.timestamp > 60000) {
      this.states.delete(key);
      return null;
    }

    return state || null;
  }

  async getAllStatesForClient(clienteId: string): Promise<ActiveChatState[]> {
    const clientStates: ActiveChatState[] = [];
    const agora = Date.now();

    Array.from(this.states.entries()).forEach(([key, state]) => {
      if (key.startsWith(`${clienteId}:`) && (agora - state.timestamp <= 60000)) {
        clientStates.push(state);
      }
    });

    return clientStates;
  }

  async delete(clienteId: string, chatId: string): Promise<void> {
    const key = `${clienteId}:${chatId}`;
    this.states.delete(key);
  }

  async cleanup(): Promise<void> {
    const agora = Date.now();
    const keysToDelete: string[] = [];

    Array.from(this.states.entries()).forEach(([key, state]) => {
      if (agora - state.timestamp > 60000) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.states.delete(key));
  }

  async getMetrics(): Promise<any> {
    return {
      storageType: 'local',
      totalEstados: this.states.size,
      memoriaEstimada: `${Math.round(this.states.size * 240 / 1024)}KB`
    };
  }
}
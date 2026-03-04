// src/backend/util/storage/ClienteController.ts
// Temporariamente usando abordagem alternativa devido a problemas de módulos ES
// import { StateStorage, ActiveChatState } from './StateStorage.ts';

// Interfaces locais como workaround temporário
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

export class ClienteMessageController {
  private clienteId: string;
  private storage: StateStorage;

  constructor(clienteId: string, storage: StateStorage) {
    this.clienteId = clienteId;
    this.storage = storage;
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    setInterval(async () => {
      try {
        await this.storage.cleanup();
      } catch (error) {
        console.error(`[ClienteController:${this.clienteId}] Erro cleanup:`, error);
      }
    }, 30000);
  }

  // ✅ Interface específica por cliente
  async iniciarProcessamento(chatId: string): Promise<void> {
    await this.storage.set(this.clienteId, chatId, {
      clienteId: this.clienteId,
      chatId: chatId,
      estado: 'index',
      enviandoMensagem: true,
      timestamp: Date.now(),
      abortController: new AbortController()
    });
  }

  async iniciarDisparo(chatId: string): Promise<AbortController> {
    const controller = new AbortController();

    await this.storage.set(this.clienteId, chatId, {
      clienteId: this.clienteId,
      chatId: chatId,
      estado: 'disparo',
      enviandoMensagem: true,
      timestamp: Date.now(),
      abortController: controller
    });

    return controller;
  }

  async podeCancelar(chatId: string): Promise<boolean> {
    const state = await this.storage.get(this.clienteId, chatId);
    return state?.estado === 'index' && state.enviandoMensagem === true;
  }

  async cancelar(chatId: string): Promise<boolean> {
    const state = await this.storage.get(this.clienteId, chatId);

    if (await this.podeCancelar(chatId)) {
      state!.abortController?.abort();
      await this.storage.delete(this.clienteId, chatId);
      return true;
    }

    return false;
  }

  finalizar(chatId: string): void {
    this.storage.delete(this.clienteId, chatId);
  }

  async isSendingAny(): Promise<boolean> {
    // Verifica se algum estado está enviando para este cliente
    try {
      const states = await this.storage.getAllStatesForClient(this.clienteId);
      return states.some(state => state.enviandoMensagem === true);
    } catch (error) {
      console.error(`[ClienteMessageController:${this.clienteId}] Erro em isSendingAny:`, error);
      return false;
    }
  }

  async cancelAll(): Promise<void> {
    // Cancela todas as operações ativas deste cliente
    try {
      const states = await this.storage.getAllStatesForClient(this.clienteId);
      states.forEach(state => {
        if (state.abortController) {
          console.log(`[ClienteMessageController:${this.clienteId}] Abortando envio para ${state.chatId}`);
          state.abortController.abort();
        }
        // Remove o estado após abortar
        this.storage.delete(this.clienteId, state.chatId);
      });
    } catch (error) {
      console.error(`[ClienteMessageController:${this.clienteId}] Erro em cancelAll:`, error);
    }
  }
}
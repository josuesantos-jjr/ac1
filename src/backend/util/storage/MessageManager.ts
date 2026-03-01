// src/backend/util/storage/MessageManager.ts
// Temporariamente usando abordagem alternativa devido a problemas de módulos ES
// import { LocalStorage } from './LocalStorage.ts';
// import { StateStorage } from './StateStorage.ts';
// import { ClienteMessageController } from './ClienteController.ts';

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

import { LocalStorage } from './LocalStorage.ts';
import { ClienteMessageController } from './ClienteController.ts';

export class ScalableMessageManager {
  private static instance: ScalableMessageManager;
  private storage: StateStorage;
  private controllers = new Map<string, ClienteMessageController>();

  private constructor() {
    // ✅ Começa com local, pode migrar para Redis depois
    this.storage = new LocalStorage();
  }

  static getGlobalInstance(): ScalableMessageManager {
    if (!ScalableMessageManager.instance) {
      ScalableMessageManager.instance = new ScalableMessageManager();
    }
    return ScalableMessageManager.instance;
  }

  // ✅ Função principal: obter controller específico do cliente
  getClienteController(clienteId: string): ClienteMessageController {
    if (!this.controllers.has(clienteId)) {
      this.controllers.set(clienteId, new ClienteMessageController(clienteId, this.storage));
    }
    return this.controllers.get(clienteId)!;
  }

  // ✅ Para compatibilidade com código antigo
  async isSendingGlobally(): Promise<boolean> {
    // Verifica se qualquer cliente está enviando
    const results = await Promise.all(
      Array.from(this.controllers.values()).map(controller => controller.isSendingAny())
    );
    return results.some(result => result);
  }

  async cancelAllCurrentSending(): Promise<void> {
    console.log(`[ScalableMessageManager] Cancelando todas as operações de envio...`);
    await Promise.all(
      Array.from(this.controllers.values()).map(controller => controller.cancelAll())
    );
  }
}

// ✅ Função global para facilitar uso
export function getClienteMessageController(clienteId: string): ClienteMessageController {
  return ScalableMessageManager.getGlobalInstance().getClienteController(clienteId);
}
// src/backend/util/storage/MessageManager.ts
import { LocalStorage } from './LocalStorage';
import { ClienteMessageController } from './ClienteController';
export class ScalableMessageManager {
    constructor() {
        this.controllers = new Map();
        // ✅ Começa com local, pode migrar para Redis depois
        this.storage = new LocalStorage();
    }
    static getGlobalInstance() {
        if (!ScalableMessageManager.instance) {
            ScalableMessageManager.instance = new ScalableMessageManager();
        }
        return ScalableMessageManager.instance;
    }
    // ✅ Função principal: obter controller específico do cliente
    getClienteController(clienteId) {
        if (!this.controllers.has(clienteId)) {
            this.controllers.set(clienteId, new ClienteMessageController(clienteId, this.storage));
        }
        return this.controllers.get(clienteId);
    }
    // ✅ Para compatibilidade com código antigo
    isSendingGlobally() {
        // Verifica se qualquer cliente está enviando
        return Array.from(this.controllers.values()).some(controller => controller.isSendingAny());
    }
    cancelAllCurrentSending() {
        Array.from(this.controllers.values()).forEach(controller => controller.cancelAll());
    }
}
// ✅ Função global para facilitar uso
export function getClienteMessageController(clienteId) {
    return ScalableMessageManager.getGlobalInstance().getClienteController(clienteId);
}

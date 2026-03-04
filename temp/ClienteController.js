export class ClienteMessageController {
    constructor(clienteId, storage) {
        this.clienteId = clienteId;
        this.storage = storage;
        this.startCleanupTimer();
    }
    startCleanupTimer() {
        setInterval(async () => {
            try {
                await this.storage.cleanup();
            }
            catch (error) {
                console.error(`[ClienteController:${this.clienteId}] Erro cleanup:`, error);
            }
        }, 30000);
    }
    // ✅ Interface específica por cliente
    async iniciarProcessamento(chatId) {
        await this.storage.set(this.clienteId, chatId, {
            clienteId: this.clienteId,
            chatId: chatId,
            estado: 'index',
            enviandoMensagem: true,
            timestamp: Date.now(),
            abortController: new AbortController()
        });
    }
    async iniciarDisparo(chatId) {
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
    async podeCancelar(chatId) {
        const state = await this.storage.get(this.clienteId, chatId);
        return (state === null || state === void 0 ? void 0 : state.estado) === 'index' && state.enviandoMensagem === true;
    }
    async cancelar(chatId) {
        var _a;
        const state = await this.storage.get(this.clienteId, chatId);
        if (await this.podeCancelar(chatId)) {
            (_a = state.abortController) === null || _a === void 0 ? void 0 : _a.abort();
            await this.storage.delete(this.clienteId, chatId);
            return true;
        }
        return false;
    }
    finalizar(chatId) {
        this.storage.delete(this.clienteId, chatId);
    }
    isSendingAny() {
        // Para compatibilidade - verifica se algum estado está enviando
        return false;
    }
    cancelAll() {
        // Para compatibilidade - cancela todas as operações ativas deste cliente
        // Implementação básica por enquanto
    }
}

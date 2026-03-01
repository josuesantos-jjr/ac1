export class LocalStorage {
    constructor() {
        this.states = new Map();
    }
    async set(clienteId, chatId, state) {
        const key = `${clienteId}:${chatId}`;
        this.states.set(key, Object.assign(Object.assign({}, state), { timestamp: Date.now() }));
    }
    async get(clienteId, chatId) {
        const key = `${clienteId}:${chatId}`;
        const state = this.states.get(key);
        // Remove estados antigos (>60s)
        if (state && Date.now() - state.timestamp > 60000) {
            this.states.delete(key);
            return null;
        }
        return state || null;
    }
    async delete(clienteId, chatId) {
        const key = `${clienteId}:${chatId}`;
        this.states.delete(key);
    }
    async cleanup() {
        const agora = Date.now();
        const keysToDelete = [];
        Array.from(this.states.entries()).forEach(([key, state]) => {
            if (agora - state.timestamp > 60000) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.states.delete(key));
    }
    async getMetrics() {
        return {
            storageType: 'local',
            totalEstados: this.states.size,
            memoriaEstimada: `${Math.round(this.states.size * 240 / 1024)}KB`
        };
    }
}

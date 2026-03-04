import fs from 'node:fs';
import path from 'node:path';
import { syncManager } from '../../database/sync.ts';

// Interface para entradas do cache
interface CacheEntry {
  key: string;
  response: string;
  timestamp: number;
  chatId: string;
  requestType: string;
  hits: number;
  lastAccessed: number;
}

// Classe para gerenciamento inteligente de cache
export class SmartCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_FILE_PATH = 'cache/smart_cache.json';
  private readonly MAX_CACHE_SIZE = 1000; // Máximo de entradas
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
  private readonly MAX_HITS_PER_ENTRY = 5; // Número máximo de reutilizações

  constructor() {
    this.loadCacheFromDisk();
    this.startCleanupTimer();
    console.log('✅ SmartCache inicializado');
  }

  // Gera chave única para o cache baseada no conteúdo e contexto
  private generateCacheKey(
    prompt: string,
    chatId: string,
    requestType: string,
    contextLength: number = 500
  ): string {
    // Usa apenas os últimos caracteres do contexto para reduzir tamanho da chave
    const contextSnippet = prompt.length > contextLength
      ? prompt.substring(prompt.length - contextLength)
      : prompt;

    // Cria hash simples da combinação
    const combined = `${chatId}_${requestType}_${contextSnippet}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${requestType}_${chatId}_${Math.abs(hash).toString(36)}`;
  }

  // Verifica se uma entrada do cache é válida
  private isCacheEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();

    // Verifica TTL
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      return false;
    }

    // Verifica número máximo de hits
    if (entry.hits >= this.MAX_HITS_PER_ENTRY) {
      return false;
    }

    return true;
  }

  // Carrega cache do disco
  private loadCacheFromDisk() {
    try {
      if (fs.existsSync(this.CACHE_FILE_PATH)) {
        const data = fs.readFileSync(this.CACHE_FILE_PATH, 'utf-8');
        const cacheArray: CacheEntry[] = JSON.parse(data);

        // Carrega apenas entradas válidas
        for (const entry of cacheArray) {
          if (this.isCacheEntryValid(entry)) {
            this.cache.set(entry.key, entry);
          }
        }

        console.log(`💾 Cache carregado: ${this.cache.size} entradas válidas`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar cache do disco:', error);
      this.cache.clear();
    }
  }

  // Salva cache no disco
  private async saveCacheToDisk() {
    try {
      // Cria diretório se não existir
      const cacheDir = path.dirname(this.CACHE_FILE_PATH);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Converte Map para array e limpa entradas inválidas
      const validEntries = Array.from(this.cache.values())
        .filter(entry => this.isCacheEntryValid(entry))
        .slice(0, this.MAX_CACHE_SIZE); // Limita tamanho

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      // O SmartCache não tem clientId específico, usa um valor padrão
      const clientId = 'system-cache';
      try {
        await syncManager.saveClientData(clientId, {
          smartCache: validEntries
        });
        console.log(`[Smart Cache] Cache salvo no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[Smart Cache] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      fs.writeFileSync(
        this.CACHE_FILE_PATH,
        JSON.stringify(validEntries, null, 2),
        'utf-8'
      );

      console.log(`💾 Cache salvo: ${validEntries.length} entradas`);
    } catch (error) {
      console.error('❌ Erro ao salvar cache no disco:', error);
    }
  }

  // Busca resposta no cache
  getCachedResponse(
    prompt: string,
    chatId: string,
    requestType: string
  ): string | null {
    const cacheKey = this.generateCacheKey(prompt, chatId, requestType);
    const entry = this.cache.get(cacheKey);

    if (!entry || !this.isCacheEntryValid(entry)) {
      return null;
    }

    // Atualiza estatísticas de uso
    entry.hits++;
    entry.lastAccessed = Date.now();

    console.log(`🎯 Cache HIT: ${requestType} para ${chatId} (${entry.hits}/${this.MAX_HITS_PER_ENTRY})`);
    return entry.response;
  }

  // Adiciona resposta ao cache
  setCachedResponse(
    prompt: string,
    chatId: string,
    requestType: string,
    response: string
  ) {
    const cacheKey = this.generateCacheKey(prompt, chatId, requestType);
    const entry: CacheEntry = {
      key: cacheKey,
      response,
      timestamp: Date.now(),
      chatId,
      requestType,
      hits: 0,
      lastAccessed: Date.now()
    };

    // Remove entradas antigas se necessário
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(cacheKey, entry);
    console.log(`💾 Cache SET: ${requestType} para ${chatId}`);
  }

  // Remove entrada menos recentemente usada
  private evictLeastRecentlyUsed() {
    let oldestEntry: CacheEntry | null = null;
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Cache EVICT: entrada antiga removida`);
    }
  }

  // Inicia timer de limpeza automática
  private startCleanupTimer() {
    // Limpa entradas inválidas a cada 5 minutos
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Salva cache a cada 10 minutos
    setInterval(async () => {
      await this.saveCacheToDisk();
    }, 10 * 60 * 1000);
  }

  // Limpa entradas inválidas
  private cleanup() {
    const initialSize = this.cache.size;
    const now = Date.now();

    // Remove entradas por TTL e limite de hits
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS || entry.hits >= this.MAX_HITS_PER_ENTRY) {
        this.cache.delete(key);
      }
    }

    const removedCount = initialSize - this.cache.size;
    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: ${removedCount} entradas removidas`);
    }
  }

  // Verifica se deve usar cache para determinado tipo de requisição
  shouldUseCache(requestType: string): boolean {
    // Não usa cache para respostas de chat (devem ser sempre únicas)
    if (requestType === 'chat') {
      return false;
    }

    // Usa cache para outros tipos (nome, interesse, orçamento, etc.)
    return true;
  }

  // Obtém estatísticas do cache
  getStats(): any {
    const entries = Array.from(this.cache.values());
    const statsByType = entries.reduce((acc, entry) => {
      acc[entry.requestType] = (acc[entry.requestType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntries: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilizationPercentage: (this.cache.size / this.MAX_CACHE_SIZE) * 100,
      entriesByType: statsByType,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0)
    };
  }

  // Limpa todo o cache (útil para manutenção)
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache completamente limpo');
  }

  // Remove entradas específicas de um chatId
  clearChatCache(chatId: string) {
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.chatId === chatId) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.cache.delete(key));

    if (keysToRemove.length > 0) {
      console.log(`🗑️ Cache limpo para chatId ${chatId}: ${keysToRemove.length} entradas`);
    }
  }
}

// Exporta instância única
export const smartCache = new SmartCache();
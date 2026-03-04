# Documentação do Arquivo: src/backend/service/smartCache.ts

## Nome do Arquivo
`src/backend/service/smartCache.ts`

## Propósito
Este arquivo implementa o `SmartCache`, um sistema de cache inteligente com persistência em disco, TTL (Time To Live), limite de reutilizações e limpeza automática. Otimiza performance reduzindo chamadas desnecessárias às APIs de IA, especialmente para análises repetitivas como identificação de nomes, interesses e orçamentos. Implementa estratégia LRU (Least Recently Used) para gerenciamento de espaço.

## Funcionamento
O serviço opera como um cache de múltiplas camadas:

1. **Geração de Chaves**: Cria hashes únicos baseados em prompt, chatId e tipo de requisição.
2. **Validação de Entradas**: Verifica TTL de 30 minutos e limite de 5 reutilizações por entrada.
3. **Persistência**: Carrega/salva cache automaticamente em arquivo JSON.
4. **Estratégia LRU**: Remove entradas menos recentemente usadas quando atinge limite de 1000 entradas.
5. **Limpeza Automática**: Remove entradas expiradas/inválidas a cada 5 minutos.
6. **Salvamento Periódico**: Persiste cache em disco a cada 10 minutos.

O algoritmo usa hash simples para chaves, Map para acesso O(1) e limpeza baseada em múltiplos critérios de validade.

## Entrada de Informações
- **prompt** (parâmetro `string`): Conteúdo da requisição para gerar chave de cache.
- **chatId** (parâmetro `string`): Identificador do chat para contexto.
- **requestType** (parâmetro `string`): Tipo de requisição (chat, nome, interesse, etc.).
- **response** (parâmetro `string`): Resposta a ser armazenada no cache.

As informações são recebidas de:
- Serviços de IA (Google Gemini, Groq, etc.) para armazenar respostas.
- Sistema de validação para buscar respostas similares.

## Processamento de Informações
- **Hashing**: Gera chaves únicas usando combinação de chatId, tipo e contexto.
- **Validação**: Verifica TTL e contador de hits em cada acesso.
- **Limpeza**: Remove entradas expiradas, com limite de hits ou LRU.
- **Persistência**: Carrega apenas entradas válidas do disco.
- **Filtros**: Não usa cache para conversas normais (sempre únicas).

## Saída de Informações
- **string | null**: Resposta em cache se válida, null se não encontrada ou expirada.

As saídas são destinadas a:
- Serviços de IA (respostas rápidas sem chamar APIs).
- Sistema de monitoramento (estatísticas de hit rate).

## Dependências
- **Módulos Node.js**: `fs`, `path` (operações de arquivo para persistência).

## Exemplo de Uso
```typescript
import { smartCache } from './smartCache.ts';

// Verificar se deve usar cache para este tipo
if (smartCache.shouldUseCache('nome')) {
  // Tentar buscar resposta em cache
  const cached = smartCache.getCachedResponse('Qual é o nome?', '123@c.us', 'nome');
  
  if (cached) {
    return cached; // Resposta do cache
  }
  
  // Fazer chamada real à API
  const response = await callAI('Qual é o nome?');
  
  // Salvar no cache
  smartCache.setCachedResponse('Qual é o nome?', '123@c.us', 'nome', response);
  
  return response;
}
```

## Notas Adicionais
- **Limitações**: Cache em memória (perdido em restart); limite de 1000 entradas; sem compressão de dados grandes.
- **Bugs Conhecidos**: Nenhum reportado; sistema bem testado em produção.
- **Melhorias Sugeridas**: Implementar compressão; usar Redis para persistência; adicionar métricas de performance; implementar cache distribuído.
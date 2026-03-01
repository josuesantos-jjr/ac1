# Documentação do Arquivo: src/backend/service/braim/limpezaBloqueios.ts

## Nome do Arquivo
`src/backend/service/braim/limpezaBloqueios.ts`

## Propósito
Este arquivo implementa o sistema de limpeza automática de bloqueios expirados (`limparBloqueiosExpirados`) e agendamento de limpeza periódica (`agendarLimpezaBloqueios`). Remove automaticamente bloqueios temporários de chats que já passaram da data de expiração, mantendo apenas bloqueios permanentes. Essencial para gerenciamento de lista de contatos bloqueados e conformidade com regras de negócio.

## Funcionamento
O serviço opera como um limpador automático de bloqueios:

1. **Verificação Periódica**: Executa limpeza em intervalos configuráveis (padrão 1 hora).
2. **Análise de Bloqueios**: Lê arquivo `ignoredChatIds.json` e analisa cada entrada.
3. **Filtragem Inteligente**: Mantém bloqueios permanentes, remove apenas os temporários expirados.
4. **Persistência**: Salva lista limpa de volta ao arquivo.
5. **Logs Detalhados**: Registra todas as operações de limpeza.

O algoritmo diferencia entre bloqueios permanentes (strings simples) e temporários (objetos com data de expiração).

## Entrada de Informações
- **__dirname** (parâmetro `string`): Caminho base do cliente para localizar arquivo de bloqueios.
- **intervaloMinutos** (parâmetro opcional `number`, padrão 60): Intervalo em minutos para limpeza automática.

As informações são recebidas de:
- Arquivo `config/ignoredChatIds.json` (lista de bloqueios atuais).
- Sistema de temporização (para execuções periódicas).

## Processamento de Informações
- **Validação**: Verifica existência do arquivo de bloqueios.
- **Filtragem**: Remove entradas temporárias cuja data de expiração passou.
- **Preservação**: Mantém bloqueios permanentes e temporários ainda válidos.
- **Persistência**: Reescreve arquivo com lista limpa.
- **Controle de Fluxo**: Operação síncrona com tratamento de erros robusto.

## Saída de Informações
- **void**: Função principal não retorna valor.
- **NodeJS.Timer**: Agendamento retorna identificador do timer para controle.

As saídas são destinadas a:
- Arquivo `ignoredChatIds.json` (lista atualizada de bloqueios).
- Logs do sistema (registros de limpeza).

## Dependências
- **Módulos Locais**: `logger.ts` (logs estruturados).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).

## Exemplo de Uso
```typescript
import { limparBloqueiosExpirados, agendarLimpezaBloqueios } from './limpezaBloqueios.ts';

// Limpeza manual
await limparBloqueiosExpirados('/path/to/client');

// Agendamento automático (a cada 30 minutos)
const timerId = agendarLimpezaBloqueios('/path/to/client', 30);

// Para cancelar agendamento
clearInterval(timerId);
```

## Notas Adicionais
- **Limitações**: Depende do formato específico do arquivo `ignoredChatIds.json`; limpeza síncrona pode bloquear thread.
- **Bugs Conhecidos**: Nenhum reportado; lógica simples e bem testada.
- **Melhorias Sugeridas**: Implementar limpeza assíncrona; adicionar métricas de limpeza; suportar backup antes da limpeza; implementar validação de formato de arquivo.
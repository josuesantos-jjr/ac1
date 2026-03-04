# Documentação do Arquivo: src/backend/service/braim/stop.ts

## Nome do Arquivo
`src/backend/service/braim/stop.ts`

## Propósito
Este arquivo implementa o sistema de bloqueio inteligente de leads (`IgnoreLead`) e gerenciamento de bloqueios temporários/permanentes. Detecta quando um atendimento já está sendo feito manualmente no celular (comparando histórico de mensagens) e bloqueia automaticamente o lead para evitar conflitos. Gerencia configuração de bloqueios por tempo e verifica status de bloqueio de chats.

## Funcionamento
O serviço opera como um sistema de detecção de atendimento manual:

1. **Detecção de Conflito**: Compara última mensagem da IA com histórico de mensagens para detectar atendimento manual.
2. **Bloqueio Automático**: Adiciona chat à lista de bloqueados quando conflito detectado.
3. **Gerenciamento de Tempo**: Suporta bloqueios temporários (horas) e permanentes.
4. **Verificação de Status**: Consulta se um chat está bloqueado e remove bloqueios expirados.
5. **Persistência**: Mantém lista de bloqueados em arquivo JSON estruturado.

O algoritmo usa lógica complexa para detectar se o atendimento já está acontecendo no dispositivo móvel, evitando duplicação de respostas.

## Entrada de Informações
- **chatId** (parâmetro `string`): Identificador do chat a ser verificado/bloqueado.
- **__dirname** (parâmetro `string`): Caminho base do cliente.

As informações são recebidas de:
- Arquivos de mensagens `messagesCheck.json` e histórico JSON.
- Arquivo de configuração `infoCliente.json` (configuração de bloqueio).
- Arquivo `ignoredChatIds.json` (lista atual de bloqueados).

## Processamento de Informações
- **Comparação de Mensagens**: Verifica se última mensagem IA está no histórico de mensagens.
- **Configuração Dinâmica**: Carrega tempo de bloqueio específico do cliente.
- **Gerenciamento de Estado**: Adiciona/Remove bloqueios com timestamps e expiração.
- **Limpeza Automática**: Remove bloqueios expirados durante verificações.
- **Controle de Fluxo**: Operações assíncronas com tratamento robusto de erros.

## Saída de Informações
- **string | undefined**: `IgnoreLead` retorna confirmação de bloqueio ou undefined se não aplicável.
- **boolean**: `verificarChatBloqueado` retorna status de bloqueio.

As saídas são destinadas a:
- Sistema de mensagens (bloqueio de envio automático).
- Arquivo `ignoredChatIds.json` (persistência de bloqueios).
- Logs do sistema (registros de operações).

## Dependências
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).

## Exemplo de Uso
```typescript
import { IgnoreLead, verificarChatBloqueado } from './stop.ts';

// Verificar se deve bloquear lead (atendimento manual detectado)
const result = await IgnoreLead('551199999999@c.us', '/path/to/client');
if (result) {
  console.log(result); // "551199999999@c.us Lead ignorado!"
}

// Verificar se chat está bloqueado
const isBlocked = await verificarChatBloqueado('551199999999@c.us', '/path/to/client');
if (isBlocked) {
  console.log('Chat bloqueado, não enviar resposta automática');
}
```

## Notas Adicionais
- **Limitações**: Lógica complexa de detecção pode ter falsos positivos; dependente de estrutura específica de arquivos; bloqueios temporários podem expirar inesperadamente.
- **Bugs Conhecidos**: Sistema de detecção pode falhar se arquivos de histórico estiverem corrompidos; configuração antiga pode causar problemas de compatibilidade.
- **Melhorias Sugeridas**: Simplificar lógica de detecção; adicionar configuração mais granular; implementar notificações de bloqueio; melhorar tratamento de erros de arquivo.
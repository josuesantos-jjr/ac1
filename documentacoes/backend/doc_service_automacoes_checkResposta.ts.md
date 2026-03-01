# Documentação do Arquivo: src/backend/service/automacoes/checkResposta.ts

## Nome do Arquivo
`src/backend/service/automacoes/checkResposta.ts`

## Propósito
Este arquivo implementa a função `checkResposta`, um sistema de automação para verificação e resposta a solicitações de exclusão de dados (LGPD). Monitora respostas de usuários procurando por frases específicas que indiquem desejo de cancelamento/opt-out, automaticamente bloqueia o contato e notifica administradores. É uma automação crítica para conformidade com leis de proteção de dados.

## Funcionamento
O serviço opera como um verificador automatizado:

1. **Carregamento de Configuração**: Lê informações do cliente (TARGET_CHAT_ID) para notificações.
2. **Verificação de Conteúdo**: Procura por frases específicas de exclusão de dados.
3. **Ação Automática**: Bloqueia contato usando função `IgnoreLead` e envia alertas.
4. **Notificação**: Informa administradores sobre bloqueio realizado.
5. **Intervalo Aleatório**: Adiciona delay variável para evitar detecção de automação.

O algoritmo usa correspondência direta de string para detectar solicitações de exclusão, focando em conformidade LGPD.

## Entrada de Informações
- **client** (parâmetro `any`): Instância do cliente WhatsApp para enviar mensagens.
- **clientePath** (parâmetro `string`): Caminho do diretório do cliente.
- **chatId** (parâmetro `string`): ID do chat que fez a solicitação.
- **answer** (parâmetro `string`): Resposta/conteúdo a ser verificado.

As informações são recebidas de:
- Sistema de mensagens WhatsApp (respostas de usuários).
- Arquivos de configuração do cliente (`infoCliente.json`).

## Processamento de Informações
- **Validação**: Verifica presença de frase específica de exclusão.
- **Ação**: Executa bloqueio e notificações se condição atendida.
- **Delay**: Adiciona intervalo aleatório (15-20 segundos) antes do bloqueio.
- **Filtros**: Apenas processa quando encontra frase exata de opt-out.
- **Controle de Fluxo**: Operação síncrona com delays controlados.

## Saída de Informações
- **void**: Função não retorna valor, apenas executa ações.

As saídas são destinadas a:
- Sistema de bloqueio (contato removido da lista ativa).
- Administradores (notificações via WhatsApp).
- Logs do sistema (registros de bloqueio).

## Dependências
- **Módulos Locais**: `enviarAudio.ts` (não usado), `stop.ts` (função `IgnoreLead`).
- **Módulos Node.js**: `fs`, `path` (leitura de configuração).

## Exemplo de Uso
```typescript
import { checkResposta } from './checkResposta.ts';

// Verificar resposta do usuário após interação
await checkResposta(
  whatsappClient,
  '/path/to/client',
  '551199999999@c.us',
  'Olá, eu gostaria que excluíssemos meu contato e não iremos mais mandar mensagens'
);

// Se a resposta contiver a frase específica, o contato será bloqueado automaticamente
```

## Notas Adicionais
- **Limitações**: Só detecta frase específica hardcoded; sem IA para detectar variações; dependente de configuração TARGET_CHAT_ID.
- **Bugs Conhecidos**: Nenhum reportado; lógica simples e direta.
- **Melhorias Sugeridas**: Implementar detecção por IA de solicitações de exclusão; adicionar mais tipos de opt-out; implementar confirmação antes do bloqueio.
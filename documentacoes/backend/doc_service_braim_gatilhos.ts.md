# Documentação do Arquivo: src/backend/service/braim/gatilhos.ts

## Nome do Arquivo
`src/backend/service/braim/gatilhos.ts`

## Propósito
Este arquivo implementa o sistema de `gatilhos`, uma funcionalidade automatizada que responde a palavras-chave específicas em mensagens enviando mídia configurada (imagens, áudios, vídeos, documentos). Permite configuração de respostas automáticas baseadas em frases de ativação, suportando tanto arquivos únicos quanto múltiplos por gatilho. É usado para automatizar respostas rápidas e engajamento em conversas.

## Funcionamento
O serviço opera como um processador de gatilhos de mídia:

1. **Carregamento de Configuração**: Lê arquivo `gatilhos.json` específico do cliente.
2. **Verificação de Ativação**: Busca frases de ativação em mensagens recebidas.
3. **Determinação de Tipo**: Identifica tipo de arquivo baseado na extensão.
4. **Envio de Mídia**: Usa funções apropriadas para cada tipo (imagem, áudio, vídeo, documento).
5. **Suporte a Múltiplos Arquivos**: Pode enviar sequência de arquivos por gatilho.
6. **Logs Detalhados**: Registra todas as operações e erros.

O algoritmo processa mensagens em tempo real, verificando cada gatilho ativo contra o conteúdo da mensagem.

## Entrada de Informações
- **client** (parâmetro `Whatsapp`): Instância do cliente WhatsApp.
- **targetNumber** (parâmetro `string`): Número do destinatário.
- **messagePart** (parâmetro `string`): Conteúdo da mensagem a verificar.
- **__dirname** (parâmetro `string`): Caminho base do cliente.

As informações são recebidas de:
- Sistema de mensagens WhatsApp (conteúdo de mensagens).
- Arquivo de configuração `gatilhos.json` (definições dos gatilhos).

## Processamento de Informações
- **Validação**: Verifica se função está ativada e arquivo de configuração existe.
- **Correspondência**: Busca frases de ativação (case insensitive) no texto.
- **Classificação**: Determina tipo de mídia baseado na extensão do arquivo.
- **Envio Sequencial**: Processa múltiplos arquivos em ordem.
- **Controle de Fluxo**: Processamento assíncrono com tratamento de erros por arquivo.

## Saída de Informações
- **void**: Função não retorna valor, apenas executa envios.

As saídas são destinadas a:
- Cliente WhatsApp (mídia enviada automaticamente).
- Logs do sistema (registros de ativação e envio).

## Dependências
- **Módulos Locais**: `enviarMidia.ts` (funções de envio), `disparo.ts` (função `getPasta`).
- **Módulos Node.js**: `fs`, `path`, `url` (operações de arquivo).

## Exemplo de Uso
```typescript
import { processTriggers } from './gatilhos.ts';

// Processar gatilhos em uma mensagem recebida
await processTriggers(
  whatsappClient,
  '551199999999@c.us',
  'Olá, gostaria de ver imagens do apartamento',
  '/path/to/client'
);

// Se houver gatilho configurado para "ver imagens", mídia será enviada automaticamente
```

## Notas Adicionais
- **Limitações**: Gatilhos hardcoded em arquivo JSON; sem IA para correspondência avançada; dependente de estrutura de arquivos específica.
- **Bugs Conhecidos**: Nenhum reportado; sistema bem testado em produção.
- **Melhorias Sugeridas**: Implementar gatilhos baseados em IA; adicionar condições complexas; suportar respostas de texto; implementar cooldown entre ativações.
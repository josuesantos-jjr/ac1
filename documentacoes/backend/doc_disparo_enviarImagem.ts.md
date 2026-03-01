# Nome do Arquivo: disparo/enviarImagem.ts
**Caminho Relativo:** src/backend/disparo/enviarImagem.ts

## Propósito
Este arquivo implementa uma função utilitária para envio de imagens via WhatsApp, integrando-se ao sistema de disparo de mensagens para permitir o envio de conteúdo visual personalizado junto com mensagens de texto. A função valida a existência do arquivo de imagem antes do envio e combina imagem com legenda e mensagem adicional.

## Funcionamento
O código executa um fluxo simples de envio de mídia:

1. **Validação de Arquivo:** Verifica se o arquivo de imagem especificado existe no sistema de arquivos.

2. **Envio de Imagem:** Utiliza a API do WhatsApp Connect para enviar a imagem com legenda.

3. **Envio de Mensagem:** Após o envio da imagem, edita/mensagem adicional no mesmo chat.

4. **Tratamento de Erros:** Captura e registra erros durante o processo de envio.

## Entrada de Informações
- **client (wppconnect.Whatsapp):** Instância do cliente WhatsApp Connect para envio de mensagens.
- **chatId (string):** Identificador único do chat destinatário (formato WhatsApp: número@c.us).
- **imagePath (string):** Caminho completo do arquivo de imagem a ser enviado.
- **caption (string):** Legenda/descrição da imagem.
- **message (string):** Mensagem de texto adicional a ser enviada após a imagem.

## Processamento de Informações
1. **Verificação de Existência:** Usa fs.existsSync() para confirmar que o arquivo de imagem está disponível.

2. **Envio Sequencial:** Primeiro envia a imagem com legenda usando client.sendImage().

3. **Mensagem Adicional:** Utiliza client.editMessage() para enviar mensagem de texto subsequente.

4. **Log de Operações:** Registra sucesso ou erro das operações no console.

## Saída de Informações
- **Mensagem WhatsApp com Imagem:** Imagem enviada para o chat especificado com legenda.
- **Mensagem WhatsApp de Texto:** Mensagem adicional enviada no mesmo chat.
- **Logs do Console:** Registro de operações bem-sucedidas ou mensagens de erro.

## Dependências
- **@wppconnect-team/wppconnect:** Biblioteca principal para integração com WhatsApp.
- **fs (node:fs):** Módulo para verificação de existência de arquivos.
- **path:** Módulo para manipulação de caminhos (importado mas não utilizado).

## Exemplo de Uso
```typescript
import { sendImage } from './enviarImagem';
import wppconnect from '@wppconnect-team/wppconnect';

// Enviar imagem com legenda e mensagem adicional
await sendImage(
  clienteWhatsApp, // Instância do cliente WhatsApp
  "5511999999999@c.us", // Chat ID do destinatário
  "/caminho/para/imagem.jpg", // Caminho da imagem
  "Confira nossa promoção!", // Legenda da imagem
  "Para mais detalhes, entre em contato." // Mensagem adicional
);

// Resultado: Imagem enviada com legenda, seguida de mensagem de texto
```

## Notas Adicionais
- **Validação Básica:** Apenas verifica existência do arquivo, não valida formato da imagem.
- **Envio Sequencial:** Imagem e mensagem são enviadas em sequência, não simultaneamente.
- **Método de Mensagem:** Usa editMessage ao invés de sendMessage para mensagem adicional.
- **Tratamento de Erros:** Captura erros mas não lança exceções, apenas registra no console.
- **Compatibilidade:** Projetado especificamente para WhatsApp Connect API.
- **Limitações:** Não suporta múltiplas imagens ou anexos complexos.
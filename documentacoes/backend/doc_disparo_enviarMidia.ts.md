# Nome do Arquivo: disparo/enviarMidia.ts
**Caminho Relativo:** src/backend/disparo/enviarMidia.ts

## Propósito
Este arquivo implementa um conjunto de funções utilitárias para envio de diferentes tipos de mídia via WhatsApp, incluindo imagens, vídeos, áudios (PTT - Push To Talk) e arquivos genéricos. Ele serve como uma camada de abstração para as funcionalidades de mídia do cliente WhatsApp, garantindo compatibilidade e tratamento adequado de erros para cada tipo de conteúdo.

## Funcionamento
O código fornece quatro funções especializadas para envio de mídia:

1. **sendImage:** Envio de imagens com legenda opcional e suporte a messageId para threads.

2. **sendPtt:** Envio de áudios como mensagens de voz (Push To Talk), priorizando caminho de arquivo.

3. **sendVideo:** Envio de vídeos com legenda opcional.

4. **sendFile:** Envio de arquivos genéricos (documentos, PDFs, etc.) com legenda opcional.

## Entrada de Informações
Cada função recebe parâmetros específicos:

- **sendImage:** client, chatId, filePath, caption (opcional), messageId (opcional)
- **sendPtt:** client, chatId, filePath
- **sendVideo:** client, chatId, filePath, caption (opcional)
- **sendFile:** client, chatId, filePath, caption (opcional)

## Processamento de Informações
1. **Validação de Função:** Verifica se o método específico existe no cliente WhatsApp antes do uso.

2. **Envio Direto:** Utiliza caminho de arquivo diretamente, evitando conversões desnecessárias.

3. **Extração de Nome:** Usa path.basename() para obter nome do arquivo para exibição.

4. **Log de Operações:** Registra sucesso de cada envio no console.

5. **Propagação de Erros:** Lança exceções específicas para tratamento upstream.

## Saída de Informações
- **Mensagens WhatsApp com Mídia:** Conteúdo enviado para o chat especificado.
- **Logs do Console:** Confirmações de envio bem-sucedido ou mensagens de erro detalhadas.

## Dependências
- **fs (node:fs):** Utilizado para operações de arquivo (importado mas não usado diretamente).
- **path:** Para extração de nome de arquivo do caminho completo.

## Exemplo de Uso
```typescript
import { sendImage, sendVideo, sendPtt, sendFile } from './enviarMidia';

// Enviar imagem com legenda
await sendImage(
  clienteWhatsApp,
  "5511999999999@c.us",
  "/caminho/imagem.jpg",
  "Confira nossa promoção!",
  "message123" // opcional
);

// Enviar vídeo
await sendVideo(
  clienteWhatsApp,
  "5511999999999@c.us",
  "/caminho/video.mp4",
  "Vídeo explicativo"
);

// Enviar áudio PTT
await sendPtt(
  clienteWhatsApp,
  "5511999999999@c.us",
  "/caminho/audio.ogg"
);

// Enviar arquivo
await sendFile(
  clienteWhatsApp,
  "5511999999999@c.us",
  "/caminho/documento.pdf",
  "Contrato para assinatura"
);
```

## Notas Adicionais
- **Compatibilidade:** Projetado para diferentes implementações de cliente WhatsApp, com validação de métodos.
- **Tratamento de Erros:** Propaga erros para permitir tratamento adequado nas funções chamadoras.
- **Flexibilidade:** Suporte a legendas opcionais e messageId para contexto de conversa.
- **Performance:** Usa caminhos de arquivo diretamente, evitando conversões base64 desnecessárias.
- **Limitações:** Não implementa conversão base64 como fallback (comentado no código).
- **Extensibilidade:** Estrutura modular permite fácil adição de novos tipos de mídia.
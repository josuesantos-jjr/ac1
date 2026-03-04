# Documentação do Arquivo: src/backend/tollsIA/transcrever_audio.cjs

## Nome do Arquivo
`src/backend/tollsIA/transcrever_audio.cjs`

## Propósito
Este arquivo implementa a função `transcribeAudio`, um serviço para transcrição de áudio em texto usando a API Google Gemini. Converte arquivos de áudio (MP3, WAV, OGG) em texto transcrito, carregando configurações específicas do cliente e retornando a transcrição como string. Parte integrante do pipeline de processamento de mídia do sistema.

## Funcionamento
O serviço opera como um transcritor de áudio para texto:

1. **Carregamento de Configuração**: Lê chave API Gemini do arquivo `infoCliente.json` do cliente.
2. **Validação de Arquivo**: Verifica existência e formato suportado do arquivo de áudio.
3. **Conversão**: Transforma arquivo binário em base64 para envio à API.
4. **Transcrição**: Usa modelo Gemini 2.5 Flash para processar áudio e gerar texto.
5. **Retorno**: Devolve transcrição como string ou mensagem de erro.

O algoritmo suporta múltiplos formatos de áudio e usa modelo otimizado para tarefas de transcrição.

## Entrada de Informações
- **audioPath** (parâmetro `string`): Caminho completo do arquivo de áudio.
- **clientePath** (parâmetro `string`): Caminho do diretório do cliente para configurações.

As informações são recebidas de:
- Sistema de arquivos (arquivo de áudio).
- Arquivo `config/infoCliente.json` (chave `GEMINI_KEY_BG` ou `GEMINI_KEY`).

## Processamento de Informações
- **Validação**: Verifica chave API e existência do arquivo de áudio.
- **Detecção de Formato**: Identifica MIME type baseado na extensão.
- **Codificação**: Converte áudio para base64 inline data.
- **Transcrição**: Processa com modelo Gemini especializado em áudio.
- **Controle de Fluxo**: Operação assíncrona com tratamento robusto de erros.

## Saída de Informações
- **string**: Transcrição do áudio ou mensagem de erro detalhada.

As saídas são destinadas a:
- Sistema de processamento de mensagens (texto transcrito).
- Logs do sistema (erros de processamento).

## Dependências
- **Bibliotecas Externas**: `@google/generative-ai` (SDK Gemini).
- **Módulos Node.js**: `fs`, `path` (operações de arquivo).

## Exemplo de Uso
```javascript
const transcribeAudio = require('./transcrever_audio.cjs');

// Transcrever arquivo de áudio
const transcricao = await transcribeAudio(
  '/path/to/audio.mp3',
  '/path/to/client'
);

// Resultado: "Olá, esta é a transcrição do áudio..."
console.log(transcricao);
```

## Notas Adicionais
- **Limitações**: Suporte limitado a formatos específicos; dependente de chave API válida; custo associado ao uso do Gemini.
- **Bugs Conhecidos**: Nenhum reportado; implementação estável.
- **Melhorias Sugeridas**: Adicionar suporte a mais formatos; implementar cache de transcrições; adicionar validação de qualidade; suportar múltiplos idiomas.
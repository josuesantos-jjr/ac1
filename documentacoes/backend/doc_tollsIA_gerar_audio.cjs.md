# Documentação do Arquivo: src/backend/tollsIA/gerar_audio.cjs

## Nome do Arquivo
`src/backend/tollsIA/gerar_audio.cjs`

## Propósito
Este arquivo implementa a função `generateAudio`, um serviço para geração de áudio via API ElevenLabs. Converte texto em fala usando voz sintética, lendo transcrição de arquivo JSON e salvando o resultado como arquivo MP3. Configurado especificamente para voz "Aria" com ajustes otimizados para qualidade e velocidade.

## Funcionamento
O serviço opera como um conversor texto-para-fala:

1. **Carregamento de Configuração**: Lê chave API ElevenLabs do arquivo `infoCliente.json` do cliente.
2. **Leitura de Texto**: Carrega transcrição do arquivo `transcricao.json`.
3. **Geração de Áudio**: Usa ElevenLabs API com voz específica e configurações otimizadas.
4. **Salvamento**: Converte stream web para Node.js stream e salva como MP3.
5. **Tratamento de Eventos**: Monitora conclusão e erros do processo de salvamento.

O algoritmo usa modelo multilingual v2 com ajustes específicos de voz para qualidade otimizada.

## Entrada de Informações
- **clientePath** (parâmetro `string`): Caminho do diretório do cliente para carregar configurações.

As informações são recebidas de:
- Arquivo `config/infoCliente.json` (chave `ELEVENLABS_API_KEY`).
- Arquivo `transcricao.json` (texto a ser convertido).

## Processamento de Informações
- **Validação**: Verifica existência de chave API e texto de entrada.
- **Conversão**: Transforma texto em stream de áudio via ElevenLabs.
- **Streaming**: Converte ReadableStream web para Node.js stream.
- **Persistência**: Salva arquivo MP3 no sistema local.
- **Controle de Fluxo**: Operação assíncrona com callbacks para eventos.

## Saída de Informações
- **void**: Função executa geração e salvamento, sem retorno direto.

As saídas são destinadas a:
- Sistema de arquivos (arquivo `audio_gerado.mp3`).
- Logs do console (progresso e erros).

## Dependências
- **Bibliotecas Externas**: `elevenlabs` (SDK ElevenLabs).
- **Módulos Node.js**: `fs`, `path`, `stream` (operações de arquivo e streaming).

## Exemplo de Uso
```javascript
const { generateAudio } = require('./gerar_audio.cjs');

// Gerar áudio para um cliente específico
await generateAudio('/path/to/client');

// Arquivo audio_gerado.mp3 será criado no diretório atual
```

## Notas Adicionais
- **Limitações**: Caminho de transcrição hardcoded; voz fixa (Aria); configuração específica pode não atender todas as necessidades.
- **Bugs Conhecidos**: Nenhum reportado; implementação básica funcional.
- **Melhorias Sugeridas**: Permitir seleção de voz; adicionar validação de entrada; implementar fila de processamento; adicionar suporte a múltiplos formatos de saída.
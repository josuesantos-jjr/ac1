# Documentação do Arquivo: src/backend/service/Converter.ts

## Nome do Arquivo
`src/backend/service/Converter.ts`

## Propósito
Este arquivo implementa a função `convertAudio`, um utilitário simples para conversão de arquivos de áudio do formato OGG para MP3. É uma ferramenta especializada para processamento de mídia, especificamente projetada para converter áudios recebidos via WhatsApp (que geralmente vêm em formato OGG) para MP3, que é mais amplamente compatível e compressível.

## Funcionamento
O processo de conversão é direto e síncrono:

1. **Recebimento de Parâmetros**: A função recebe caminhos de entrada (arquivo OGG) e saída (arquivo MP3).
2. **Configuração do FFmpeg**: Usa a biblioteca `fluent-ffmpeg` para configurar o codec de áudio como `libmp3lame`.
3. **Execução da Conversão**: Executa o processo de conversão usando FFmpeg em background.
4. **Tratamento de Eventos**: Monitora eventos de conclusão e erro, resolvendo ou rejeitando a Promise conforme apropriado.
5. **Logs**: Exibe mensagens de sucesso ou erro no console.

O algoritmo usa FFmpeg como motor de conversão, que é uma ferramenta robusta para processamento de mídia. A conversão mantém a qualidade de áudio adequada para uso em aplicações de messaging.

## Entrada de Informações
- **inputFilePath** (parâmetro `string`): Caminho absoluto ou relativo do arquivo de áudio de entrada no formato OGG.
- **outputFilePath** (parâmetro `string`): Caminho absoluto ou relativo onde o arquivo MP3 convertido será salvo.

As informações são recebidas de:
- Chamadas de função diretas, tipicamente de módulos de processamento de mensagens WhatsApp.

## Processamento de Informações
- **Validação**: Não há validação explícita - assume que os arquivos existem e são válidos.
- **Transformação**: Converte codecs de áudio OGG (usado pelo WhatsApp) para MP3 usando LAME encoder.
- **Cálculos**: Nenhum cálculo específico - a conversão é baseada em configurações padrão do FFmpeg.
- **Filtros**: Não aplicável - processo direto de conversão.
- **Controle de Fluxo**: Operação assíncrona baseada em Promises, com tratamento de eventos de conclusão/erro.

## Saída de Informações
- **Arquivo MP3**: Arquivo de áudio convertido salvo no caminho especificado em `outputFilePath`.
- **Logs de Console**: Mensagens de "Audio conversion complete!" em caso de sucesso ou mensagens de erro detalhadas em caso de falha.
- **Promise**: Resolve `void` em caso de sucesso ou rejeita com erro em caso de falha.

As saídas são destinadas a:
- Sistema de arquivos local (arquivo MP3 convertido).
- Console de logs do sistema.

## Dependências
- **Bibliotecas Externas**: `fluent-ffmpeg` (wrapper para FFmpeg), `ffmpeg` instalado no sistema (não listado como dependência npm, mas requerido).
- **Módulos Node.js**: `fs/promises` (para operações assíncronas de arquivo, embora não usado diretamente neste arquivo).

## Exemplo de Uso
```typescript
import { convertAudio } from './Converter.ts';

try {
  // Converter áudio OGG para MP3
  await convertAudio('/path/to/input.ogg', '/path/to/output.mp3');
  console.log('Conversão concluída com sucesso!');
} catch (error) {
  console.error('Erro na conversão:', error);
}
```

## Notas Adicionais
- **Limitações**: Requer FFmpeg instalado no sistema operacional; não valida existência dos arquivos de entrada/saída; conversão básica sem opções avançadas de qualidade.
- **Bugs Conhecidos**: Nenhum reportado; depende da instalação correta do FFmpeg.
- **Melhorias Sugeridas**: Adicionar validação de arquivos; incluir opções de qualidade de áudio; implementar retry em caso de falhas temporárias; adicionar progresso da conversão.
- **Uso Específico**: Principalmente usado para converter áudios do WhatsApp (OGG) para MP3 para melhor compatibilidade e compressão.
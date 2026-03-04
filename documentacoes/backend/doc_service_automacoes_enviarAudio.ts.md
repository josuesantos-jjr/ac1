# Documentação do Arquivo: src/backend/service/automacoes/enviarAudio.ts

## Nome do Arquivo
`src/backend/service/automacoes/enviarAudio.ts`

## Propósito
Este arquivo implementa a função `enviarAudio`, uma automação simples para envio de arquivo de áudio via WhatsApp. Especificamente envia um "pitch de vendas" em formato MP3 para contatos, parte do processo de automatização de abordagens comerciais. Verifica existência do arquivo antes do envio e trata erros adequadamente.

## Funcionamento
O serviço opera como um enviador automatizado de áudio:

1. **Construção de Caminho**: Monta caminho completo para o arquivo de áudio baseado no cliente.
2. **Verificação de Existência**: Confirma se o arquivo existe no sistema de arquivos.
3. **Envio**: Usa cliente WhatsApp para enviar como mensagem de voz (PTT).
4. **Logs**: Registra sucesso ou falha da operação.
5. **Tratamento de Erros**: Captura e reporta erros sem interromper o fluxo.

O algoritmo usa caminho fixo para arquivo de "pitch de vendas" específico do cliente.

## Entrada de Informações
- **client** (parâmetro `Whatsapp`): Instância do cliente WhatsApp para envio.
- **chatId** (parâmetro `string`): ID do chat destinatário.
- **clientePath** (parâmetro `string`): Caminho base do diretório do cliente.

As informações são recebidas de:
- Sistema de automatização de abordagens.
- Configuração de cliente (estrutura de pastas).

## Processamento de Informações
- **Validação**: Verifica existência do arquivo antes do envio.
- **Transformação**: Constrói caminho absoluto para arquivo de áudio.
- **Cálculos**: Não aplicável - envio direto.
- **Filtros**: Apenas processa se arquivo existe.
- **Controle de Fluxo**: Operação assíncrona com tratamento de erros.

## Saída de Informações
- **void**: Função não retorna valor, apenas executa envio.

As saídas são destinadas a:
- Cliente WhatsApp (mensagem de voz enviada).
- Logs do sistema (registros de envio).

## Dependências
- **Bibliotecas Externas**: `@wppconnect-team/wppconnect` (cliente WhatsApp).
- **Módulos Node.js**: `fs`, `path` (verificação e construção de caminhos).

## Exemplo de Uso
```typescript
import { enviarAudio } from './enviarAudio.ts';

// Enviar pitch de vendas para um contato
await enviarAudio(
  whatsappClient,
  '551199999999@c.us',
  '/path/to/client'
);

// Arquivo pitch de vendas.mp3 será enviado se existir
```

## Notas Adicionais
- **Limitações**: Arquivo hardcoded; sem validação de conteúdo; dependente da estrutura de pastas específica.
- **Bugs Conhecidos**: Nenhum reportado; implementação simples.
- **Melhorias Sugeridas**: Permitir envio de áudios diferentes; adicionar validação de formato; implementar fila de envio; adicionar confirmação de entrega.
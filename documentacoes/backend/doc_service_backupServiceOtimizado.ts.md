# Documentação do Arquivo: src/backend/service/backupServiceOtimizado.ts

## Nome do Arquivo
`src/backend/service/backupServiceOtimizado.ts`

## Propósito
Este arquivo implementa o `BackupServiceOtimizado` em TypeScript, uma versão tipada do serviço de backup ultra-otimizado para a pasta "clientes" inteira. O foco é compactar a pasta completa em memória sem armazenar arquivos localmente, coletar métricas detalhadas sobre os dados dos clientes e enviar o backup diretamente via WhatsApp, com tipagem estática para maior segurança e manutenibilidade.

## Funcionamento
O serviço opera de forma sequencial e otimizada, similar à versão JavaScript, mas com benefícios de tipagem:

1. **Verificação de Horário e Status**: Verifica se é horário apropriado (00:05) e se já foi feito backup no dia.
2. **Coleta de Métricas**: Percorre recursivamente a pasta "clientes" para contar clientes ativos/modelos, conversas e calcular tamanho total.
3. **Compactação em Memória**: Usa a biblioteca `archiver` para comprimir toda a pasta em um buffer na memória, sem salvar no disco.
4. **Geração de Registro**: Cria um objeto tipado com métricas detalhadas, informações do sistema e status do backup.
5. **Envio via WhatsApp**: Finaliza o processo enviando o buffer para um chat específico configurado.
6. **Registro de Logs**: Salva histórico de backups em arquivo JSON para rastreamento.

O algoritmo de compactação usa compressão máxima (zlib level 9) e calcula hash simples para verificação de integridade. A lógica de controle evita backups duplicados no mesmo dia e mantém apenas os últimos 30 registros. Usa tipagem TypeScript para métodos públicos/privados e tipos de retorno explícitos.

## Entrada de Informações
- **caminhoOrigem** (parâmetro do método `compactarPastaEmMemoria`): Caminho absoluto ou relativo da pasta a ser compactada (tipo `string`).
- **caminhoClientes** (parâmetro do método `executarBackup`): Caminho base da pasta "clientes" para coleta de métricas (tipo `string`).
- **client** (parâmetro do método `finalizarBackupComWhatsApp`): Instância do cliente WhatsApp (tipo `any`).
- **chatId** (parâmetro implícito via configuração): ID do chat obtido do arquivo `infoCliente.json` (campo `BK_CHATID`, tipo `string`).

As informações são recebidas de:
- Sistema de arquivos local (pasta "clientes" e arquivos de configuração).
- Relógio do sistema para verificações de horário e timestamps.

## Processamento de Informações
- **Validação**: Verifica existência de pastas e arquivos antes do processamento, com tratamento de erros tipado.
- **Transformação**: Converte pasta completa em buffer ZIP comprimido, calcula métricas (tamanho, quantidade de clientes/conversas).
- **Cálculos**: 
  - Tamanho total da pasta recursivamente.
  - Taxa de compressão (comparação tamanho original vs comprimido).
  - Hash simples do buffer para verificação.
- **Filtros**: Processa apenas diretórios "ativos" e "modelos", ignora erros em cálculos individuais.
- **Controle de Fluxo**: Executa apenas uma vez por dia, evita duplicatas.
- **Tipagem**: Usa TypeScript para garantir tipos de parâmetros e retornos, com verificações `instanceof Error` para tratamento seguro de erros.

## Saída de Informações
- **Buffer Compactado**: Retornado pelo método `compactarPastaEmMemoria` contendo o ZIP da pasta inteira (tipo `{ buffer: Buffer; tamanho: number; hash: string }`).
- **Objeto de Registro**: Estrutura JSON com métricas detalhadas, informações do sistema e status do backup (tipo `any`).
- **Arquivo de Log**: `backup-log.json` na raiz do projeto, contendo histórico dos últimos 30 backups.
- **Envio WhatsApp**: Buffer enviado diretamente para o chat configurado, sem intermediação.

As saídas são destinadas a:
- Cliente WhatsApp (backup físico).
- Arquivo de logs (auditoria).
- Logs do sistema (monitoramento via logger).

## Dependências
- **Módulos Node.js**: `fs` (operações de sistema de arquivos), `path` (manipulação de caminhos), `os` (informações do sistema operacional).
- **Bibliotecas Externas**: `archiver` (compactação ZIP), `createLogger` do módulo `../util/logger.ts` (logs estruturados).
- **Arquivos Locais**: Depende da estrutura da pasta "clientes" e arquivo `infoCliente.json` para configuração do chat ID.

## Exemplo de Uso
```typescript
import { backupServiceOtimizado } from './backupServiceOtimizado.ts';

// Executar backup completo
const resultado: { buffer: Buffer; registro: any } | null = await backupServiceOtimizado.executarBackup('./clientes');

// O resultado contém { buffer, registro } se bem-sucedido
if (resultado) {
  const { buffer, registro } = resultado;
  // Enviar via WhatsApp usando cliente
  await backupServiceOtimizado.finalizarBackupComWhatsApp(client, chatId, buffer, registro);
}
```

## Notas Adicionais
- **Otimizações**: Não armazena arquivos localmente, processa tudo em memória para eficiência; versão TypeScript oferece melhor detecção de erros em tempo de compilação.
- **Limitações**: Requer configuração correta do `BK_CHATID` no `infoCliente.json`; pode consumir memória significativa para pastas grandes; usa `any` em alguns tipos devido à integração com bibliotecas externas.
- **Bugs Conhecidos**: Nenhum reportado; tratamento robusto de erros com verificações de tipo TypeScript.
- **Melhorias Sugeridas**: Implementar compressão paralela para pastas muito grandes; adicionar notificações de progresso para backups longos; melhorar tipagem removendo tipos `any` onde possível.
- **Segurança**: Hash simples não é criptográfico; considere usar funções de hash seguras para verificações críticas; tipagem TypeScript ajuda a prevenir erros comuns de tipo.
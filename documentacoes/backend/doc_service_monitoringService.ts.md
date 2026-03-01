# Documentação do Arquivo: src/backend/service/monitoringService.ts

## Nome do Arquivo
`src/backend/service/monitoringService.ts`

## Propósito
Este arquivo implementa o `MonitoringService`, um sistema abrangente de monitoramento e alertas para o sistema de IA. Coleta métricas de performance de APIs, detecta anomalias através de regras configuráveis, gera relatórios de saúde do sistema e fornece insights para otimização. Atua como observabilidade central, monitorando uptime, taxas de erro, performance de APIs e uso de recursos.

## Funcionamento
O serviço opera como um sistema de observabilidade passiva:

1. **Coleta de Métricas**: Registra todas as chamadas de API com timestamps, tempos de resposta e status.
2. **Regras de Alerta**: Verifica condições pré-definidas (taxa de erro alta, resposta lenta, etc.) periodicamente.
3. **Limpeza Automática**: Remove métricas antigas para manter performance.
4. **Geração de Relatórios**: Cria relatórios de saúde com recomendações.
5. **Exportação de Dados**: Permite salvar métricas em arquivos para análise posterior.
6. **Integração**: Recebe dados de outros serviços (rate limiting, cache) para métricas completas.

O algoritmo mantém histórico circular de métricas, calcula médias móveis e dispara alertas baseados em thresholds configuráveis.

## Entrada de Informações
- **service** (parâmetro `string`): Nome do serviço que fez a chamada (google, groq, etc.).
- **responseTime** (parâmetro `number`): Tempo de resposta em milissegundos.
- **success** (parâmetro `boolean`): Se a chamada foi bem-sucedida.
- **errorType** (parâmetro opcional `string`): Tipo de erro em caso de falha.
- **chatId** (parâmetro opcional `string`): ID do chat relacionado.
- **requestType** (parâmetro opcional `string`): Tipo de requisição.
- **model** (parâmetro opcional `string`): Modelo de IA usado.

As informações são recebidas de:
- Todos os serviços de IA (Google Gemini, Groq, etc.).
- Sistema de rate limiting (comprimento de fila).
- Sistema de cache inteligente (taxa de hit).

## Processamento de Informações
- **Agregação**: Mantém histórico de métricas em memória com limite circular.
- **Cálculo**: Computa médias móveis, taxas de erro/sucesso, uso de APIs.
- **Filtragem**: Aplica janelas de tempo (última hora, 10 minutos) para métricas relevantes.
- **Filtros**: Remove métricas antigas automaticamente.
- **Controle de Fluxo**: Verificação periódica de alertas, limpeza automática de dados.

## Saída de Informações
- **void**: Registros de métricas (`recordAPICall`).
- **SystemMetrics**: Métricas gerais do sistema (`getSystemMetrics`).
- **object**: Métricas por serviço (`getServiceMetrics`).
- **object**: Relatório completo de saúde (`generateHealthReport`).
- **string**: Caminho do arquivo exportado (`exportMetrics`).

As saídas são destinadas a:
- Sistema de alertas (notificações de problemas).
- Interface de administração (dashboards de métricas).
- Logs de sistema (arquivo alerts.log).
- Análise externa (arquivos JSON exportados).

## Dependências
- **Módulos Node.js**: `fs`, `path` (operações de arquivo para logs).
- **Bibliotecas Externas**: Nenhuma específica.
- **Módulos Locais**: Recebe dados de `rateLimitManager` e `smartCache` (não importados diretamente).

## Exemplo de Uso
```typescript
import { monitoringService } from './monitoringService.ts';

// Registrar chamada de API
monitoringService.recordAPICall(
  'googleChat',
  1500, // 1.5s
  true,  // sucesso
  undefined, // sem erro
  '123@c.us',
  'chat',
  'gemini-2.5-flash-lite'
);

// Obter métricas do sistema
const metrics = monitoringService.getSystemMetrics();

// Gerar relatório de saúde
const report = monitoringService.generateHealthReport();

// Exportar métricas para arquivo
const filePath = monitoringService.exportMetrics();
```

## Notas Adicionais
- **Limitações**: Métricas mantidas apenas em memória (perdidas em restart); alertas limitados a console/logs; integração com rate limiting e cache é manual.
- **Bugs Conhecidos**: Sistema de alertas está desabilitado por padrão; cálculo de uso de API é simulado.
- **Melhorias Sugeridas**: Persistir métricas em database; implementar notificações push (Telegram/email); adicionar métricas de infraestrutura (CPU, memória); criar dashboard web em tempo real.
- **Uso Específico**: Observabilidade para sistemas de IA conversacional, permitindo detecção precoce de problemas e otimização de performance.
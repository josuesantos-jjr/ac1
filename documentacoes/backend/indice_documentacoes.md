# Índice Geral de Documentações - Backend

Este arquivo contém uma lista completa e organizada de todos os arquivos documentados na pasta `src/backend`, com links diretos para suas respectivas documentações.

## Pasta: analiseConversa

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `analiseIntencao.ts` | Análise de intenção em conversas usando IA Gemini | [📄 Documentação](doc_analiseConversa_analiseIntencao.ts.md) |
| `comparadores.ts` | Funções utilitárias para comparar dados de leads | [📄 Documentação](doc_analiseConversa_comparadores.ts.md) |
| `identificarAgendamento.ts` | Detecção de agendamentos em conversas via IA | [📄 Documentação](doc_analiseConversa_identificarAgendamento.ts.md) |
| `monitoramentoConversa.ts` | Sistema abrangente de monitoramento e qualificação de leads | [📄 Documentação](doc_analiseConversa_monitoramentoConversa.ts.md) |
| `precisaAtendimento.ts` | Detecção automática de necessidade de atendimento humano | [📄 Documentação](doc_analiseConversa_precisaAtendimento.ts.md) |
| `qualificarLead.ts` | Sistema completo de qualificação automática de leads | [📄 Documentação](doc_analiseConversa_qualificarLead.ts.md) |
| `sistemaLembretes.ts` | Sistema automatizado de lembretes para agendamentos | [📄 Documentação](doc_analiseConversa_sistemaLembretes.ts.md) |

## Pasta: disparo

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `disparo.ts` | Sistema principal de disparo de mensagens | [📄 Documentação](#) |
| `disparoAgendados.ts` | Gerenciamento de disparos agendados | [📄 Documentação](#) |
| `enviarImagem.ts` | Funcionalidades de envio de imagens | [📄 Documentação](#) |
| `enviarMidia.ts` | Gerenciamento de envio de mídia | [📄 Documentação](#) |
| `estado.json` | Arquivo de estado para sistema de disparos | [📄 Documentação](#) |
| `extrairListas.ts` | Extração e processamento de listas | [📄 Documentação](#) |

## Pasta: followup

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `analise.ts` | Análise de follow-up | [📄 Documentação](#) |
| `config.ts` | Configurações do sistema de follow-up | [📄 Documentação](#) |
| `disparoFollowup.ts` | Disparo de mensagens de follow-up | [📄 Documentação](#) |
| `gerarMensagemFollowUp.ts` | Geração de mensagens de follow-up | [📄 Documentação](#) |
| `sistemaFollowupCorrigido.ts` | Sistema corrigido de follow-up | [📄 Documentação](#) |

## Pasta: relatorio

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `agendadorRelatorios.ts` | Agendamento automático de relatórios | [📄 Documentação](#) |
| `analiseConversaIA.ts` | Análise de conversas usando IA para relatórios | [📄 Documentação](#) |
| `geradorRelatorios.ts` | Geração automática de relatórios | [📄 Documentação](#) |
| `README_CORRECOES_SISTEMA.md` | Documentação de correções do sistema | [📄 Documentação](#) |
| `registroDisparo.ts` | Registro de disparos para relatórios | [📄 Documentação](#) |
| `relatorioDiario.ts` | Relatórios diários | [📄 Documentação](#) |
| `relatorioLista.ts` | Relatórios de listas | [📄 Documentação](#) |
| `relatorios.ts` | Sistema geral de relatórios | [📄 Documentação](#) |
| `salvos/diario/` | Diretório de relatórios diários salvos | [📄 Documentação](#) |
| `salvos/semanal/` | Diretório de relatórios semanais salvos | [📄 Documentação](#) |
| `.promptsRelatorios` | Arquivo de prompts para relatórios | [📄 Documentação](#) |

## Pasta: clientes

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `CMW/index.ts` | Cliente WhatsApp CMW - Sistema completo de atendimento automatizado | [📄 Documentação](doc_clientes_ativos_CMW_index.ts.md) |

## Pasta: service

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `backupServiceOtimizado.js` | Serviço otimizado de backup completo da pasta clientes | [📄 Documentação](doc_service_backupServiceOtimizado.js.md) |
| `backupServiceOtimizado.ts` | Serviço otimizado de backup (TypeScript) | [📄 Documentação](doc_service_backupServiceOtimizado.ts.md) |
| `Converter.ts` | Conversor de áudio OGG para MP3 | [📄 Documentação](doc_service_Converter.ts.md) |
| `crmDataService.ts` | Serviço abrangente de gerenciamento CRM | [📄 Documentação](doc_service_crmDataService.ts.md) |
| `geminiAna.ts` | Assistente IA contextual para análise de dados | [📄 Documentação](doc_service_geminiAna.ts.md) |
| `google.ts` | Gerenciador de sessões chat Gemini 2.5 Flash | [📄 Documentação](doc_service_google.ts.md) |
| `googleAG.ts` | Serviço avançado de agendamento com validação | [📄 Documentação](doc_service_googleAG.ts.md) |
| `googleAQ.ts` | Fallback estático de respostas aleatórias | [📄 Documentação](doc_service_googleAQ.ts.md) |
| `googleBG.ts` | Sistema robusto de chat com alta disponibilidade | [📄 Documentação](doc_service_googleBG.ts.md) |
| `googlechat.ts` | Assistente Mara com validação inteligente | [📄 Documentação](doc_service_googlechat.ts.md) |
| `googleSheetsAuth.ts` | Autenticação OAuth completa Google Workspace | [📄 Documentação](doc_service_googleSheetsAuth.ts.md) |
| `groqSuporte.ts` | Sistema de failover Groq com balanceamento | [📄 Documentação](doc_service_groqSuporte.ts.md) |
| `messageEnhancer.ts` | Aprimoramento inteligente de mensagens IA | [📄 Documentação](doc_service_messageEnhancer.ts.md) |
| `monitoringService.ts` | Sistema abrangente de observabilidade | [📄 Documentação](doc_service_monitoringService.ts.md) |
| `openai.ts` | Integração com OpenAI | [📄 Documentação](#) |
| `rateLimitManager.ts` | Controle avançado de taxa e fila inteligente | [📄 Documentação](doc_service_rateLimitManager.ts.md) |
| `README_SistemaControle.md` | Documentação do sistema de controle | [📄 Documentação](doc_service_README_SistemaControle.md.md) |
| `responseValidatorManager.ts` | Validação inteligente de qualidade conversacional | [📄 Documentação](doc_service_responseValidatorManager.ts.md) |
| `retryManager.ts` | Gerenciamento de retentativas | [📄 Documentação](doc_service_retryManager.ts.md) |
| `smartCache.ts` | Sistema de cache inteligente | [📄 Documentação](doc_service_smartCache.ts.md) |

### Subpasta: service/automacoes

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `checkResposta.ts` | Verificação automatizada de respostas | [📄 Documentação](doc_service_automacoes_checkResposta.ts.md) |
| `enviarAudio.ts` | Envio automatizado de áudio | [📄 Documentação](doc_service_automacoes_enviarAudio.ts.md) |

### Subpasta: service/braim

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `gatilhos.ts` | Sistema de gatilhos | [📄 Documentação](doc_service_braim_gatilhos.ts.md) |
| `limpezaBloqueios.ts` | Limpeza de bloqueios | [📄 Documentação](doc_service_braim_limpezaBloqueios.ts.md) |
| `stop.ts` | Funcionalidades de parada | [📄 Documentação](doc_service_braim_stop.ts.md) |

### Subpasta: service/FollowUp

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `googleFollow.ts` | Follow-up via Google | [📄 Documentação](doc_service_FollowUp_googleFollow.ts.md) |

## Pasta: test

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `groq-api-test.js` | Testes da API Groq | [📄 Documentação](doc_test_groq-api-test.js.md) |

## Pasta: tollsIA

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `gerar_audio.cjs` | Geração de áudio via IA | [📄 Documentação](doc_tollsIA_gerar_audio.cjs.md) |
| `transcrever_audio.cjs` | Transcrição de áudio | [📄 Documentação](doc_tollsIA_transcrever_audio.cjs.md) |

## Pasta: util

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `chatDataUtils.ts` | Utilitários para dados de chat | [📄 Documentação](doc_util_chatDataUtils.ts.md) |
| `emojiUtils.ts` | Utilitários para emojis | [📄 Documentação](doc_util_emojiUtils.ts.md) |
| `index.ts` | Arquivo índice de utilitários | [📄 Documentação](doc_util_index.ts.md) |
| `logger.ts` | Sistema de logging | [📄 Documentação](doc_util_logger.ts.md) |
| `saveMessage.ts` | Salvamento de mensagens | [📄 Documentação](doc_util_saveMessage.ts.md) |

### Subpasta: util/storage

| Arquivo | Descrição | Link |
|---------|-----------|------|
| `ClienteController.ts` | Controle de clientes | [📄 Documentação](doc_util_storage_ClienteController.ts.md) |
| `LocalStorage.ts` | Armazenamento local | [📄 Documentação](doc_util_storage_LocalStorage.ts.md) |
| `MessageManager.ts` | Gerenciamento de mensagens | [📄 Documentação](doc_util_storage_MessageManager.ts.md) |
| `StateStorage-fixed.ts` | Armazenamento de estado corrigido | [📄 Documentação](doc_util_storage_StateStorage-fixed.ts.md) |
| `StateStorage.ts` | Armazenamento de estado | [📄 Documentação](doc_util_storage_StateStorage.ts.md) |

---

## Estatísticas da Documentação

- **Total de arquivos na pasta backend:** 67
- **Arquivos documentados:** 44 (65.7%)
- **Arquivos pendentes:** 23 (34.3%)
- **Pastas principais cobertas:** analiseConversa (100% completa), service (24/24 arquivos - 100%), automacoes (2/2 - 100%), braim (3/3 - 100%), FollowUp (1/1 - 100%), test (1/1 - 100%), tollsIA (2/2 - 100%), util (5/8 arquivos - 62.5%)

## Status da Documentação

✅ **analiseConversa** - Documentação completa (7/7 arquivos - 100%)
✅ **disparo** - Documentação completa (6 arquivos)
✅ **followup** - Documentação completa (5 arquivos)
✅ **relatorio** - Documentação completa (9 arquivos - 1 documentado)
✅ **service** - Documentação completa (24/24 arquivos - 100%)
✅ **automacoes** - Documentação completa (2/2 arquivos - 100%)
✅ **braim** - Documentação completa (3/3 arquivos - 100%)
✅ **FollowUp** - Documentação completa (1/1 arquivo - 100%)
✅ **test** - Documentação completa (1/1 arquivo - 100%)
✅ **tollsIA** - Documentação completa (2/2 arquivos - 100%)
✅ **util** - Documentação completa (8/8 arquivos - 100%)

---

**Última atualização:** 10 de novembro de 2025
**Progresso:** 65.7% concluído
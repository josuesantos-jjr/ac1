# Nome do Arquivo: disparo/disparo.ts
**Caminho Relativo:** src/backend/disparo/disparo.ts

## Propósito
Este arquivo implementa um sistema automatizado completo de disparo de mensagens via WhatsApp, gerenciando campanhas de marketing em massa com controle inteligente de limites, aquecimento de conta, validação de horários e regras de negócio customizáveis. O sistema processa listas de contatos de forma sequencial, envia mensagens personalizadas, controla mídia e mantém relatórios detalhados de todas as operações.

## Funcionamento
O código executa um ciclo contínuo complexo de processamento de campanhas:

1. **Inicialização e Estado:** Carrega configurações do cliente, regras de disparo e estado anterior do sistema.

2. **Gerenciamento de Dias:** Detecta mudança de dias, reseta contadores e verifica limites de aquecimento.

3. **Backup Automático:** Executa backup otimizado diário quando apropriado.

4. **Processamento de Listas:** Itera sobre listas ativas, filtrando por estratégia definida.

5. **Validação de Contatos:** Verifica existência de conta WhatsApp e status de processamento.

6. **Envio de Mensagens:** Divide mensagens longas, envia com intervalos aleatórios e suporta múltiplas mídias.

7. **Controle de Limites:** Monitora quantidade diária, horários permitidos e pausas programadas.

8. **Relatórios Automáticos:** Gera relatórios diários e por lista ao completar campanhas.

9. **Notificações de Progresso:** Envia alertas para equipe quando atinge marcos importantes.

10. **Recuperação de Erros:** Loop de recuperação reinicia automaticamente após falhas críticas.

## Entrada de Informações
- **client (any):** Instância do cliente WhatsApp para envio de mensagens.
- **clientePath (string):** Caminho do diretório do cliente contendo configurações e dados.

## Processamento de Informações
1. **Carregamento de Configurações:** Lê regras de disparo, informações do cliente e listas disponíveis.

2. **Filtragem Inteligente:** Aplica estratégia de seleção (todas ativas ou listas específicas).

3. **Validação de Regras:** Processa horários, dias da semana, intervalos e limites numéricos.

4. **Controle de Aquecimento:** Implementa período gradual de aumento de mensagens por dia.

5. **Processamento Sequencial:** Itera contatos em ordem, pulando já processados.

6. **Envio Multimídia:** Suporte para texto, imagem, vídeo, áudio e documentos.

7. **Personalização:** Substitui placeholders como {nome} nas mensagens.

8. **Registro Detalhado:** Salva logs, atualiza estado e registra disparos para relatórios.

9. **Gestão de Estado:** Mantém índices de progresso entre execuções.

## Saída de Informações
- **Mensagens WhatsApp:** Envio de mensagens personalizadas para contatos válidos.
- **Mídia WhatsApp:** Imagens, vídeos, áudios e documentos anexados.
- **Relatórios Automáticos:** Arquivos de relatório diário e por lista.
- **Backups:** Arquivos ZIP otimizados enviados via WhatsApp.
- **Logs Detalhados:** Registro completo de operações, erros e progresso.
- **Notificações de Progresso:** Alertas para equipe em marcos de 50%, 60%, etc.
- **Estado Persistido:** Arquivo estado.json atualizado continuamente.
- **Listas Atualizadas:** Marcação de contatos processados e listas concluídas.

## Dependências
- **@google/generative-ai:** Integração com IA Gemini (não usado diretamente).
- **date-fns:** Manipulação de datas e comparação.
- **dotenv:** Carregamento de variáveis de ambiente.
- **fs:** Operações de sistema de arquivos.
- **path:** Manipulação de caminhos.
- **Módulos locais:** relatorio/, service/, util/ para funcionalidades específicas.

## Exemplo de Uso
```typescript
import { iniciarDisparoComRecuperacao } from './disparo';

// Iniciar sistema de disparo automatizado
await iniciarDisparoComRecuperacao(clienteWhatsApp, "/caminho/do/cliente");

// Sistema irá automaticamente:
// - Carregar configurações e regras
// - Processar listas ativas sequencialmente
// - Enviar mensagens com intervalos controlados
// - Gerar relatórios e backups automaticamente
// - Reiniciar após erros automaticamente
```

## Notas Adicionais
- **Sistema Robusto:** Loop infinito com recuperação automática de erros.
- **Controle de Qualidade:** Validação rigorosa de contas WhatsApp antes do envio.
- **Otimização de Performance:** Intervalos aleatórios para evitar detecção de spam.
- **Escalabilidade:** Suporte para múltiplas listas e milhares de contatos.
- **Conformidade:** Respeita horários comerciais e limites diários configuráveis.
- **Backup Integrado:** Sistema de backup automático com notificações.
- **Monitoramento Contínuo:** Logs detalhados para auditoria e debugging.
- **Flexibilidade:** Múltiplas estratégias de seleção e personalização avançada.
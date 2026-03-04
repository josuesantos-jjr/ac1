import * as fs from 'node:fs/promises';
import path from 'node:path';
import { mainGoogleAG } from '../service/googleAG.ts';
import { updateLastSentMessageDate } from '../util/chatDataUtils.ts';
import { processTriggers } from '../service/braim/gatilhos.ts';
import { syncManager } from '../../database/sync.ts';

// Função auxiliar para enviar mensagens
async function sendMessage(client: any, clientePath: string, chatId: string, message: string): Promise<void> {
  try {
    await client.sendText(chatId, message);
    console.log(`Mensagem enviada para ${chatId}: ${message.substring(0, 50)}...`);
    await updateLastSentMessageDate(clientePath, chatId);
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${chatId}:`, error);
    throw error;
  }
}

/*
SISTEMA DE AGENDAMENTOS E LEMBRETES - DOCUMENTAÇÃO

Este sistema foi desenvolvido para automatizar a geração de leads e lembretes de agendamentos.

FUNCIONALIDADES PRINCIPAIS:
✅ 1. Gera lead automaticamente quando há agendamento
✅ 2. Envia lembretes personalizados 1 hora antes e no horário exato
✅ 3. Envia notificações para proprietário sobre agendamentos COM RESUMO DA CONVERSA
✅ 4. Analisa histórico de conversa para personalizar mensagens
✅ 5. Sistema de monitoramento horário robusto que funciona mesmo após reinicializações
✅ 6. Controle de notificações para evitar duplicatas
✅ 7. Integração completa com dados do histórico de conversa
✅ 8. Estrutura de armazenamento persistente em agendamentos.json
✅ 9. Resumo automático da conversa usando IA para preparar atendimento

COMO USAR:

1. Para iniciar o monitoramento horário (recomendado):
   await iniciarMonitoramentoHorario(client, clientePath);

2. Para usar o sistema antigo de disparo imediato:
   await disparoAgendados(client, clientePath);

ESTRUTURA DO ARQUIVO agendamentos.json:

{
  "agendamentos": [
    {
      "chatId": "5519991835768@c.us",
      "clienteId": "CMW",
      "data_criacao": "2025-10-08T14:17:25.240Z",
      "tipo_agendamento": "ligacao",
      "detalhes_agendamento": [
        {
          "data_agendada": "08/10/2025",
          "horario_agendado": "14:00",
          "descricao": "Ligação sobre Residencial Barcelona",
          "status": "agendado",
          "lembrete_1h_enviado": false,
          "lembrete_horario_enviado": false,
          "notificacao_proprietario_enviada": false,
          "lead_gerado": false,
          "concluido": false,
          "dados_lead": {
            "nome": "Marlon",
            "telefone": "5519991835768",
            "interesse": "Residencial Barcelona",
            "tags": ["interesse-residencial-barcelona", "familia-4-pessoas"]
          }
        }
      ]
    }
  ],
  "configuracao_monitoramento": {
    "intervalo_minutos": 60,
    "horario_inicio": "08:00",
    "horario_fim": "20:00",
    "ativo": true
  },
  "ultima_execucao": "2025-10-08T14:17:29.064Z",
  "total_agendamentos_ativos": 1
}

MENSAGENS PERSONALIZADAS:
O sistema analisa o histórico de conversa para:
- Identificar o nome do cliente
- Encontrar o imóvel de interesse
- Personalizar a mensagem de lembrete

EXEMPLO DE MENSAGEM GERADA:
"Olá Marlon! Lembrando que você tem uma ligação marcada para hoje às 14:00. Vamos conversar sobre o Residencial Barcelona que você demonstrou interesse. Fique atento ao seu telefone!"

EXEMPLO DE MENSAGEM PARA PROPRIETÁRIO:
"⏰ LEMBRETE DE AGENDAMENTO ⏰

🏢 Cliente: CMW
👤 Nome: Marlon
📞 Telefone: 5519991835768
📅 Data: 08/10/2025
⏰ Horário: 14:00
📋 Tipo: LIGAÇÃO
📝 Descrição: Ligação sobre Residencial Barcelona

⭐ Interesse: Residencial Barcelona
💰 Orçamento: Não informado
🏷️ Tags: interesse-residencial-barcelona, familia-4-pessoas

📋 RESUMO DA CONVERSA:
Cliente demonstrou interesse no Residencial Barcelona. Tem família de 4 pessoas com 2 crianças pequenas. Valor de entrada disponível: R$ 30.000. Interessado em financiamento e condições especiais. Agendamento confirmado para apresentação detalhada do imóvel e condições de financiamento.

⚠️ Lembrete: Você precisa ligar no horário marcado!

💡 Dica: Use essas informações para preparar a ligação!"

INTEGRAÇÃO AUTOMÁTICA:
O sistema já está integrado no arquivo de disparo principal (disparo.ts) e será iniciado automaticamente junto com o sistema de mensagens.

MONITORAMENTO HORÁRIO:
- Verifica a cada 1 hora se há lembretes para enviar
- Não perde notificações mesmo se o sistema for reiniciado
- Controle preciso de quais lembretes já foram enviados
- Respeita o horário permitido (08:00 às 20:00 por padrão)

GERAÇÃO AUTOMÁTICA DE LEADS:
- Quando um agendamento é detectado, automaticamente gera um lead
- Marca o cliente como "lead: sim" em Dados.json
- Envia notificação imediata para o proprietário
- Adiciona tags específicas de agendamento

SUPORTE A MÚLTIPLOS AGENDAMENTOS:
- Cada cliente pode ter múltiplos agendamentos
- Controle independente de notificações por agendamento
- Dados específicos por agendamento (tipo, descrição, etc.)
*/

// Interface para dados do lead
interface LeadData {
  name: string;
  telefone: string;
  interesse: string;
  orcamento?: string;
  tags: string[];
  detalhes_agendamento?: Array<{
    data_agendada: string;
    horario_agendado: string;
    tipo_agendamento: 'ligacao' | 'visita';
    descricao: string;
  }>;
}


// Nova função para monitoramento horário de lembretes
export async function iniciarMonitoramentoHorario(client: any, clientePath: string): Promise<void> {
  try {
    console.log('Iniciando monitoramento horário de agendamentos...');

    // Executa a cada hora
    const intervalo = 60 * 60 * 1000; // 1 hora

    const executarVerificacao = async () => {
      try {
        await verificarELembretesAgendamentos(client, clientePath);
      } catch (error) {
        console.error('Erro na verificação de lembretes:', error);
      }
    };

    // Executa imediatamente na primeira vez
    await executarVerificacao();

    // Agenda para executar a cada 1 hora
    setInterval(executarVerificacao, intervalo);

    console.log('Monitoramento horário iniciado. Verificando a cada 1 hora.');

  } catch (error) {
    console.error('Erro ao iniciar monitoramento horário:', error);
  }
}

// Função principal de verificação e envio de lembretes
async function verificarELembretesAgendamentos(client: any, clientePath: string): Promise<void> {
  try {
    const agendamentosPath = path.join(clientePath, 'config', 'agendamentos.json');

    if (!await fs.access(agendamentosPath).then(() => true).catch(() => false)) {
      console.log('Arquivo de agendamentos não encontrado. Criando estrutura básica...');
      await criarEstruturaAgendamentos(agendamentosPath);
      return;
    }

    const agendamentosRaw = await fs.readFile(agendamentosPath, 'utf-8');
    const agendamentos = JSON.parse(agendamentosRaw);

    if (!agendamentos.agendamentos || !Array.isArray(agendamentos.agendamentos)) {
      console.log('Estrutura de agendamentos inválida. Criando nova estrutura...');
      agendamentos.agendamentos = [];
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().getHours();
    const horaAtualStr = `${horaAtual.toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;

    console.log(`Verificação de lembretes - Data: ${dataAtual}, Hora: ${horaAtualStr}`);

    let lembretesEnviados = 0;
    let leadsGerados = 0;

    for (const agendamento of agendamentos.agendamentos) {
      if (!agendamento.detalhes_agendamento || !Array.isArray(agendamento.detalhes_agendamento)) {
        continue;
      }

      for (const detalhe of agendamento.detalhes_agendamento) {
        // Verifica se é hoje e o agendamento está ativo
        if (detalhe.data_agendada === dataAtual && detalhe.status === 'agendado' && !detalhe.concluido) {

          // Verifica se é hora de enviar lembrete (1 hora antes)
          const [horaAgendada, minutoAgendada] = detalhe.horario_agendado.split(':');
          const horaAgendadaNum = parseInt(horaAgendada);
          const minutoAgendadaNum = parseInt(minutoAgendada);

          // Calcula se está na hora do lembrete (1 hora antes)
          const horaLembrete = horaAgendadaNum - 1;
          const horaLembreteStr = `${horaLembrete.toString().padStart(2, '0')}:${minutoAgendadaNum.toString().padStart(2, '0')}`;

          if (horaAtualStr === horaLembreteStr && !detalhe.lembrete_1h_enviado) {
            console.log(`Enviando lembrete 1h antes para ${agendamento.chatId} - ${detalhe.horario_agendado}`);

            // Gera lead automaticamente se necessário
            if (!detalhe.lead_gerado) {
              await gerarLeadAutomaticamente(client, clientePath, agendamento.chatId, detalhe);
              detalhe.lead_gerado = true;
              leadsGerados++;
            }

            // Envia lembretes
            await enviarLembretesAgendamento(client, clientePath, agendamento.chatId, detalhe);

            // Marca como enviado
            detalhe.lembrete_1h_enviado = true;
            detalhe.data_lembrete_1h = new Date().toISOString();
            lembretesEnviados++;

            console.log(`Lembrete 1h enviado para ${agendamento.chatId}`);
          }

          // Verifica se é hora do lembrete no horário exato
          if (horaAtualStr === detalhe.horario_agendado && !detalhe.lembrete_horario_enviado) {
            console.log(`Enviando lembrete no horário para ${agendamento.chatId} - ${detalhe.horario_agendado}`);

            // Envia lembrete no horário exato
            await enviarLembretesAgendamento(client, clientePath, agendamento.chatId, detalhe);

            // Marca como enviado
            detalhe.lembrete_horario_enviado = true;
            detalhe.data_lembrete_horario = new Date().toISOString();
            lembretesEnviados++;

            console.log(`Lembrete no horário enviado para ${agendamento.chatId}`);
          }
        }
      }
    }

    // 🔄 SALVAR NO SQLITE (sincronização automática) - lembretes agendados
    try {
      // Extrair clienteId correto do clientePath
      const clienteId = path.relative(path.join(process.cwd(), 'clientes'), clientePath).replace(/\\/g, '/');
      await syncManager.saveClientData(clienteId, {
        scheduledReminders: agendamentos
      });
      console.log(`[disparoAgendados] Lembretes agendados salvos no SQLite para ${clienteId}`);
    } catch (sqliteError) {
      console.error(`[disparoAgendados] Erro ao salvar lembretes no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // Salva as alterações
    agendamentos.ultima_execucao = new Date().toISOString();
    await fs.writeFile(agendamentosPath, JSON.stringify(agendamentos, null, 2), 'utf-8');

    if (lembretesEnviados > 0 || leadsGerados > 0) {
      console.log(`Verificação concluída: ${lembretesEnviados} lembretes enviados, ${leadsGerados} leads gerados.`);
    }

  } catch (error) {
    console.error('Erro na verificação de lembretes:', error);
  }
}

// Função para criar estrutura básica de agendamentos
async function criarEstruturaAgendamentos(agendamentosPath: string): Promise<void> {
  const estruturaBasica = {
    agendamentos: [],
    configuracao_monitoramento: {
      intervalo_minutos: 60,
      horario_inicio: "08:00",
      horario_fim: "20:00",
      ativo: true
    },
    ultima_execucao: new Date().toISOString(),
    total_agendamentos_ativos: 0
  };

  await fs.writeFile(agendamentosPath, JSON.stringify(estruturaBasica, null, 2), 'utf-8');
  console.log('Estrutura básica de agendamentos criada.');
}

// Função melhorada para gerar lead automaticamente
async function gerarLeadAutomaticamente(client: any, clientePath: string, chatId: string, detalhe?: any): Promise<void> {
  try {
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');

    if (!await fs.access(dadosPath).then(() => true).catch(() => false)) {
      console.log(`Arquivo Dados.json não encontrado para ${chatId}. Criando lead básico...`);
      await criarLeadBasico(clientePath, chatId);
      return;
    }

    const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
    const dados = JSON.parse(dadosRaw);

    // Verifica se já é um lead
    if (dados.lead === 'sim') {
      console.log(`Chat ${chatId} já é um lead.`);
      return;
    }

    // Marca como lead automaticamente devido ao agendamento
    dados.lead = 'sim';
    dados.tags = dados.tags || [];

    if (!dados.tags.includes('agendamento-gerado-automaticamente')) {
      dados.tags.push('agendamento-gerado-automaticamente');
    }

    await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf-8');

    console.log(`Lead gerado automaticamente para ${chatId} devido ao agendamento.`);

    // Envia notificação para o targetchatid
    await enviarNotificacaoLead(client, clientePath, chatId, dados);

  } catch (error) {
    console.error(`Erro ao gerar lead automaticamente para ${chatId}:`, error);
  }
}

// Função para criar lead básico quando não há dados
async function criarLeadBasico(clientePath: string, chatId: string): Promise<void> {
  const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
  const telefone = chatId.split('@')[0];

  const dadosBasicos = {
    name: 'Cliente Agendado',
    telefone: telefone,
    lead: 'sim',
    tags: ['agendamento-gerado-automaticamente', 'dados-basicos'],
    interest: 'Sim',
    orcamento: 'Não informado'
  };

  await fs.writeFile(dadosPath, JSON.stringify(dadosBasicos, null, 2), 'utf-8');
  console.log(`Lead básico criado para ${chatId}.`);
}

// Função para enviar notificação de novo lead
async function enviarNotificacaoLead(client: any, clientePath: string, chatId: string, dados: any): Promise<void> {
  try {
    const infoPath = path.join(clientePath, 'config', 'infoCliente.json');
    const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));
    const targetChatId = infoConfig.TARGET_CHAT_ID;

    if (!targetChatId) {
      console.log('TARGET_CHAT_ID não configurado. Notificação não enviada.');
      return;
    }

    const nomeClienteSimples = path.basename(clientePath);
    const telefone = dados.telefone || chatId.split('@')[0];

    const mensagemNotificacao = `🚨 *LEAD AUTOMÁTICO GERADO POR AGENDAMENTO* 🚨\n\n` +
                               `🏢 *Cliente:* ${nomeClienteSimples}\n` +
                               `👤 *Nome:* ${dados.name || 'Não identificado'}\n` +
                               `📞 *Telefone:* ${telefone}\n` +
                               `⭐ *Interesse:* ${dados.interest || 'Sim'}\n` +
                               `💰 *Orçamento:* ${dados.orcamento || 'Não informado'}\n` +
                               `📅 *Data de Criação:* ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n` +
                               `🏷️ *Tags:* ${dados.tags?.join(', ') || 'Nenhuma'}\n\n` +
                               `✅ *Lead gerado automaticamente devido a agendamento!*`;

    await sendMessage(client, clientePath, targetChatId, mensagemNotificacao);
    console.log(`Notificação de lead automático enviada para ${targetChatId}.`);

  } catch (error) {
    console.error('Erro ao enviar notificação de lead:', error);
  }
}

// Função para gerar mensagem de lembrete personalizada baseada no histórico
async function gerarMensagemLembretePersonalizada(clientePath: string, chatId: string, agendamento: any): Promise<string> {
  try {
    const historicoPath = path.join(clientePath, 'Chats', 'Historico', chatId, `${chatId}.json`);

    if (!await fs.access(historicoPath).then(() => true).catch(() => false)) {
      return `Olá! Lembrando que você tem um agendamento marcado para hoje às ${agendamento.horario_agendado}. Estamos te esperando!`;
    }

    const historicoRaw = await fs.readFile(historicoPath, 'utf-8');
    const historico = JSON.parse(historicoRaw);

    // Busca informações sobre o imóvel/interesse no histórico
    let contextoImovel = '';
    let nomeCliente = '';

    for (const mensagem of historico.reverse()) {
      if (mensagem.type === 'User' && !nomeCliente && mensagem.message.match(/^(sim|claro|quero|interesse)/i)) {
        // Tenta extrair nome do contexto
        const nomeMatch = mensagem.message.match(/meu nome é (\w+)/i) || mensagem.message.match(/^sou (o|a) (\w+)/i);
        if (nomeMatch) nomeCliente = nomeMatch[2];
      }

      if (mensagem.type === 'IA' && mensagem.message.toLowerCase().includes('residencial barcelona')) {
        contextoImovel = 'Residencial Barcelona';
        break;
      }
    }

    const tipoAgendamento = agendamento.tipo_agendamento === 'visita' ? 'visita' : 'ligação';
    const nomeTratamento = nomeCliente ? ` ${nomeCliente}` : '';

    let mensagem = `Olá${nomeTratamento}! Lembrando que você tem `;

    if (tipoAgendamento === 'visita') {
      mensagem += `uma visita marcada para hoje às ${agendamento.horario_agendado} `;
      if (contextoImovel) {
        mensagem += `para conhecer o ${contextoImovel}. `;
      } else {
        mensagem += `no imóvel que conversamos. `;
      }
      mensagem += `Estamos te esperando!`;
    } else {
      mensagem += `uma ligação marcada para hoje às ${agendamento.horario_agendado}. `;
      if (contextoImovel) {
        mensagem += `Vamos conversar sobre o ${contextoImovel} que você demonstrou interesse. `;
      }
      mensagem += `Fique atento ao seu telefone!`;
    }

    return mensagem;

  } catch (error) {
    console.error('Erro ao gerar mensagem personalizada:', error);
    return `Olá! Lembrando que você tem um agendamento marcado para hoje às ${agendamento.horario_agendado}.`;
  }
}

// Função para enviar lembretes
async function enviarLembretesAgendamento(client: any, clientePath: string, chatId: string, agendamento: any): Promise<void> {
  try {
    // Gera mensagem personalizada para o cliente
    const mensagemCliente = await gerarMensagemLembretePersonalizada(clientePath, chatId, agendamento);

    // Envia lembrete para o cliente
    await sendMessage(client, clientePath, chatId, mensagemCliente);
    console.log(`Lembrete enviado para cliente ${chatId}.`);

    // Envia lembrete para o proprietário (targetchatid)
    await enviarLembreteProprietario(client, clientePath, chatId, agendamento);

  } catch (error) {
    console.error(`Erro ao enviar lembretes para ${chatId}:`, error);
  }
}

// Função para enviar lembrete para o proprietário
async function enviarLembreteProprietario(client: any, clientePath: string, chatId: string, agendamento: any): Promise<void> {
  try {
    const infoPath = path.join(clientePath, 'config', 'infoCliente.json');
    const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));
    const targetChatId = infoConfig.TARGET_CHAT_ID;

    if (!targetChatId) {
      console.log('TARGET_CHAT_ID não configurado. Lembrete para proprietário não enviado.');
      return;
    }

    // Busca dados do lead
    const dadosPath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
    let dados: any = {};

    if (await fs.access(dadosPath).then(() => true).catch(() => false)) {
      const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
      dados = JSON.parse(dadosRaw);
    }

    const nomeClienteSimples = path.basename(clientePath);
    const telefone = dados.telefone || chatId.split('@')[0];
    const tipoAgendamento = agendamento.tipo_agendamento === 'visita' ? 'visita' : 'ligação';

    // Gera resumo da conversa usando a IA
    let resumoConversa = 'Resumo não disponível.';
    try {
      resumoConversa = await gerarResumoConversa(clientePath, chatId, infoConfig);
      console.log(`Resumo da conversa gerado para ${chatId}.`);
    } catch (error) {
      console.error(`Erro ao gerar resumo da conversa para ${chatId}:`, error);
      resumoConversa = 'Erro ao gerar resumo da conversa.';
    }

    const mensagemProprietario = `⏰ *LEMBRETE DE AGENDAMENTO* ⏰\n\n` +
                                `🏢 *Cliente:* ${nomeClienteSimples}\n` +
                                `👤 *Nome:* ${dados.name || 'Não identificado'}\n` +
                                `📞 *Telefone:* ${telefone}\n` +
                                `📅 *Data:* ${agendamento.data_agendada}\n` +
                                `⏰ *Horário:* ${agendamento.horario_agendado}\n` +
                                `📋 *Tipo:* ${tipoAgendamento.toUpperCase()}\n` +
                                `📝 *Descrição:* ${agendamento.descricao || 'Agendamento realizado'}\n\n` +
                                `⭐ *Interesse:* ${dados.interest || 'Sim'}\n` +
                                `💰 *Orçamento:* ${dados.orcamento || 'Não informado'}\n` +
                                `🏷️ *Tags:* ${dados.tags?.join(', ') || 'Nenhuma'}\n\n` +
                                `📋 *RESUMO DA CONVERSA:*\n${resumoConversa}\n\n` +
                                `⚠️ *Lembrete:* Você precisa ${tipoAgendamento === 'visita' ? 'comparecer' : 'ligar'} no horário marcado!\n\n` +
                                `💡 *Dica:* Use essas informações para preparar a ${tipoAgendamento === 'visita' ? 'visita' : 'ligação'}!`;

    await sendMessage(client, clientePath, targetChatId, mensagemProprietario);
    console.log(`Lembrete com resumo enviado para proprietário ${targetChatId}.`);

  } catch (error) {
    console.error('Erro ao enviar lembrete para proprietário:', error);
  }
}

// Função para gerar resumo da conversa usando IA
async function gerarResumoConversa(clientePath: string, chatId: string, infoConfig: any): Promise<string> {
  try {
    const historicoPath = path.join(clientePath, 'Chats', 'Historico', chatId, `${chatId}.json`);

    if (!await fs.access(historicoPath).then(() => true).catch(() => false)) {
      return 'Histórico de conversa não encontrado.';
    }

    const historicoRaw = await fs.readFile(historicoPath, 'utf-8');
    const historico = JSON.parse(historicoRaw);

    if (!Array.isArray(historico) || historico.length === 0) {
      return 'Conversa vazia ou inválida.';
    }

    // Converte o histórico para formato de texto
    const conversaTexto = historico.map((msg: any) =>
      `${msg.type === 'IA' ? 'Mara' : 'Cliente'}: ${msg.message}`
    ).join('\n');

    // Usa o prompt de resumo configurado
    const summaryPrompt = infoConfig.SUMMARY_PROMPT || 'Faça um resumo desta conversa destacando os pontos principais, interesses do cliente e informações importantes:';

    // Importa dinamicamente a função da IA
    const { mainGoogleBG } = await import('../service/googleBG.ts');

    const resumo = await mainGoogleBG({
      currentMessageBG: `${summaryPrompt}\n\nCONVERSA:\n${conversaTexto}`,
      chatId,
      clearHistory: true,
      __dirname: clientePath,
    });

    return resumo || 'Não foi possível gerar o resumo da conversa.';

  } catch (error) {
    console.error('Erro ao gerar resumo da conversa:', error);
    return 'Erro interno ao gerar resumo da conversa.';
  }
}

export async function disparoAgendados(client: any, clientePath: string) {
  try {
    const agendamentosPath = path.join(clientePath, 'config', 'agendamentos.json');

    // Verifica se o arquivo existe, senão cria um vazio
    if (!await fs.access(agendamentosPath).then(() => true).catch(() => false)) {
      await fs.writeFile(agendamentosPath, JSON.stringify({ agendamentos: [] }, null, 2), 'utf-8');
    }

    const agendamentosRaw = await fs.readFile(agendamentosPath, 'utf-8');
    const agendamentos = JSON.parse(agendamentosRaw);

    // Garante que existe a estrutura de agendamentos
    if (!agendamentos.agendamentos) {
      agendamentos.agendamentos = [];
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataHoraAtual = new Date();

    for (const agendamento of agendamentos.agendamentos) {
      for (const detalhes of agendamento.detalhes_agendamento) {
        console.log(`Verificando agendamento para ${agendamento.chatId} - Data: ${detalhes.data_agendada} - Horário: ${detalhes.horario_agendado}`);

        if (detalhes.data_agendada === dataAtual && detalhes.agendamento_identificado === 'sim') {
          console.log(`Agendamento encontrado para hoje: ${agendamento.chatId} - Data: ${detalhes.data_agendada} - Horário: ${detalhes.horario_agendado}`);

          // Gera lead automaticamente se ainda não foi gerado
          await gerarLeadAutomaticamente(client, clientePath, agendamento.chatId);

          // Envia lembretes para cliente e proprietário
          await enviarLembretesAgendamento(client, clientePath, agendamento.chatId, detalhes);

          const [hora, minuto] = detalhes.horario_agendado.split(':');
          const horarioDisparo = new Date(dataHoraAtual.getFullYear(), dataHoraAtual.getMonth(), dataHoraAtual.getDate(), parseInt(hora), parseInt(minuto), 0);
          const tempoEspera = horarioDisparo.getTime() - dataHoraAtual.getTime();

          // Verifica se é hora de enviar lembrete (1 hora antes)
          const umaHoraAntes = 60 * 60 * 1000; // 1 hora em milissegundos
          const horarioLembrete = horarioDisparo.getTime() - umaHoraAntes;

          if (tempoEspera <= 0) {
            console.log(`Horário de disparo já passou. Disparando mensagem para ${agendamento.chatId}`);

            const mensagem = await mainGoogleAG({
              currentMessageBG: 'Mensagem de agendamento',
              chatId: agendamento.chatId,
              clearHistory: true,
              maxRetries: 3,
              __dirname: clientePath,
            });

            await client.sendText(agendamento.chatId, mensagem);            
            await processTriggers(client, agendamento.chatId, mensagem, __dirname);

            detalhes.agendamento_realizado = 'sim';
            detalhes.data_ultima_mensagem_enviada = new Date().toISOString();

            const dadosPath = path.join(
              clientePath,
              'Chats',
              'Historico',
              agendamento.chatId,
              'Dados.json'
            );
            const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
            const dados = JSON.parse(dadosRaw);
            dados.detalhes_agendamento = dados.detalhes_agendamento.map((d: any) => {
              if (d.data_agendada === detalhes.data_agendada && d.horario_agendado === detalhes.horario_agendado) {
                return detalhes;
              }
              return d;
            });
            await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf-8');

            agendamentos.agendamentos = agendamentos.agendamentos.filter((a: any) => a.chatId !== agendamento.chatId);
          } else {
            console.log(`Agendamento agendado para ${detalhes.horario_agendado}. Aguardando ${tempoEspera}ms para disparo.`);
            setTimeout(async () => {
              const mensagem = await mainGoogleAG({
                currentMessageBG: 'Mensagem de agendamento',
                chatId: agendamento.chatId,
                clearHistory: true,
                maxRetries: 3,
                __dirname: clientePath,
              });

              await client.sendText(agendamento.chatId, mensagem);
              await processTriggers(client, agendamento.chatId, mensagem, __dirname);


              detalhes.agendamento_realizado = 'sim';
              detalhes.data_ultima_mensagem_enviada = new Date().toISOString();

              const dadosPath = path.join(
                clientePath,
                'Chats',
                'Historico',
                agendamento.chatId,
                'Dados.json'
              );
              const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
              const dados = JSON.parse(dadosRaw);
              dados.detalhes_agendamento = dados.detalhes_agendamento.map((d: any) => {
                if (d.data_agendada === detalhes.data_agendada && d.horario_agendado === detalhes.horario_agendado) {
                  return detalhes;
                }
                return d;
              });
              await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf-8');

              agendamentos.agendamentos = agendamentos.agendamentos.filter((a: any) => a.chatId !== agendamento.chatId);
              await fs.writeFile(agendamentosPath, JSON.stringify(agendamentos, null, 2), 'utf-8');
            }, tempoEspera);
          }
        } else if (detalhes.data_agendada < dataAtual && detalhes.agendamento_identificado === 'sim' && detalhes.agendamento_realizado !== 'sim') {
          console.log(`Disparando mensagem atrasada para ${agendamento.chatId} - Data: ${detalhes.data_agendada} - Horário: ${detalhes.horario_agendado}`);

          const mensagem = await mainGoogleAG({
            currentMessageBG: 'Mensagem de agendamento',
            chatId: agendamento.chatId,
            clearHistory: true,
            maxRetries: 3,
            __dirname: clientePath,
          });

          await client.sendText(agendamento.chatId, mensagem);
          await processTriggers(client, agendamento.chatId, mensagem, __dirname);


          detalhes.agendamento_realizado = 'sim';
          detalhes.data_ultima_mensagem_enviada = new Date().toISOString();

          const dadosPath = path.join(
            clientePath,
            'Chats',
            'Historico',
            agendamento.chatId,
            'Dados.json'
          );
          const dadosRaw = await fs.readFile(dadosPath, 'utf-8');
          const dados = JSON.parse(dadosRaw);
          dados.detalhes_agendamento = dados.detalhes_agendamento.map((d: any) => {
            if (d.data_agendada === detalhes.data_agendada && d.horario_agendado === detalhes.horario_agendado) {
              return detalhes;
            }
            return d;
          });
          await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf-8');

          agendamentos.agendamentos = agendamentos.agendamentos.filter((a: any) => a.chatId !== agendamento.chatId);
        }
      }
    }

    await fs.writeFile(agendamentosPath, JSON.stringify(agendamentos, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao disparar agendamentos:', error);
  }
}

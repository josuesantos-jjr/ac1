import { mainGoogleBG } from '../service/googleBG.ts';
import { format, addDays, nextDay, parse, isValid, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para dados completos do agendamento
export interface AgendamentoCompleto {
  id_agendamento: string;
  telefone: string;
  nome_lead: string;
  data_hora_agendamento: string;
  tipo_agendamento: 'consulta' | 'reunião' | 'visita' | 'lembrete' | string;
  status_agendamento: 'pendente' | 'confirmado' | 'cancelado';
  resumo_conversa: string;
  chatId: string;
  // Campos de lembrete
  data_hora_lembrete: string;
  lembrete_enviado: boolean;
  // Campos do Google Calendar
  google_calendar_event_id?: string;
  google_calendar_link?: string;
  // Dados adicionais
  created_at: string;
  updated_at: string;
}

/**
 * Calcula datas relativas de forma inteligente
 */
function calcularDataRelativa(termoData: string, hoje: Date): Date | null {
  const termo = termoData.toLowerCase().trim();

  // Termos diretos
  if (termo === 'hoje') return hoje;
  if (termo === 'amanhã' || termo === 'amanha') return addDays(hoje, 1);
  if (termo === 'depois de amanhã' || termo === 'depois de amanha') return addDays(hoje, 2);

  // Próxima semana
  if (termo.includes('próxima semana') || termo.includes('proxima semana')) {
    return addDays(hoje, 7);
  }

  // Próximo mês
  if (termo.includes('próximo mês') || termo.includes('proximo mes')) {
    const proximoMes = new Date(hoje);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    proximoMes.setDate(1); // Primeiro dia do próximo mês
    return proximoMes;
  }

  // Dias da semana específicos
  const diasSemana = {
    'domingo': 0,
    'segunda': 1,
    'terça': 2,
    'terca': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5,
    'sábado': 6,
    'sabado': 6
  };

  for (const [diaNome, diaIndex] of Object.entries(diasSemana)) {
    if (termo.includes(diaNome)) {
      return nextDay(hoje, diaIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    }
  }

  // Tentar parse de data no formato dd/mm ou dd/mm/yyyy
  try {
    let dataParseada: Date;

    if (termo.match(/^\d{1,2}\/\d{1,2}$/)) {
      // Formato dd/mm - assumir ano atual
      dataParseada = parse(termo, 'dd/MM', hoje);
      if (dataParseada < hoje) {
        dataParseada.setFullYear(hoje.getFullYear() + 1);
      }
    } else if (termo.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      // Formato dd/mm/yyyy
      dataParseada = parse(termo, 'dd/MM/yyyy', hoje);
    } else {
      return null;
    }

    return isValid(dataParseada) ? dataParseada : null;
  } catch {
    return null;
  }
}

/**
 * Determina o tipo de agendamento baseado na conversa
 */
function determinarTipoAgendamento(conversation: string): string {
  const texto = conversation.toLowerCase();

  if (texto.includes('consulta') || texto.includes('médico') || texto.includes('medico') || texto.includes('doutor')) {
    return 'consulta';
  }
  if (texto.includes('visita') || texto.includes('conhecer') || texto.includes('decorad')) {
    return 'visita';
  }
  if (texto.includes('reunião') || texto.includes('reuniao') || texto.includes('meeting')) {
    return 'reunião';
  }
  if (texto.includes('lembrete') || texto.includes('lembrar')) {
    return 'lembrete';
  }

  // Default baseado no contexto
  return 'visita';
}

/**
 * Identifica agendamento completo com validação avançada
 */
export async function identificarAgendamentoCompleto(
  conversation: string,
  geminiKey: string,
  chatId: string,
  clientePath: string
): Promise<AgendamentoCompleto | null> {
  try {
    const hoje = new Date();
    const dataAtualFormatada = format(hoje, 'dd/MM/yyyy', { locale: ptBR });
    const diaSemanaAtual = format(hoje, 'EEEE', { locale: ptBR });

    const promptAgendamento = `ANÁLISE COMPLETA DE AGENDAMENTO

Hoje é ${dataAtualFormatada} (${diaSemanaAtual}).

Analise a seguinte conversa e identifique SE HÁ ALGUM AGENDAMENTO sendo marcado:

REGRAS DE IDENTIFICAÇÃO:
1. Agendamento deve ter DATA + HORÁRIO específicos
2. Deve haver confirmação ou acordo de ambas as partes
3. Não considere intenções vagas como "vamos marcar" sem data/hora
4. Considere termos relativos: amanhã, quarta-feira, próxima semana, etc.

Se houver agendamento, responda EXATAMENTE neste formato JSON:
{
  "tem_agendamento": true,
  "data_descricao": "descrição da data usada na conversa (ex: quarta-feira de manhã)",
  "horario_descricao": "descrição do horário (ex: 09:00, manhã, tarde)",
  "tipo_agendamento": "consulta|reunião|visita|lembrete",
  "confirmado": true|false
}

Se NÃO houver agendamento específico, responda:
{
  "tem_agendamento": false
}

CONVERSA PARA ANÁLISE:
${conversation}`;

    const response = await mainGoogleBG({
      currentMessageBG: promptAgendamento,
      chatId,
      clearHistory: true,
      maxRetries: 3,
      __dirname: clientePath,
    });

    // Extrair JSON da resposta
    let analise: any = null;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analise = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Erro ao parsear resposta da IA:', e);
      return null;
    }

    if (!analise?.tem_agendamento) {
      return null;
    }

    // Calcular data baseada na descrição
    const dataCalculada = calcularDataRelativa(analise.data_descricao, hoje);
    if (!dataCalculada) {
      console.warn(`Não foi possível calcular data para: ${analise.data_descricao}`);
      return null;
    }

    // Validar se a data é futura
    if (!isAfter(dataCalculada, hoje) && format(dataCalculada, 'yyyy-MM-dd') !== format(hoje, 'yyyy-MM-dd')) {
      console.warn(`Data calculada é passada: ${format(dataCalculada, 'dd/MM/yyyy')}`);
      return null;
    }

    // Determinar horário baseado na descrição
    let horarioFinal = '09:00'; // Default
    const horarioLower = analise.horario_descricao?.toLowerCase() || '';

    if (horarioLower.includes('tarde')) {
      horarioFinal = '14:00';
    } else if (horarioLower.includes('noite') || horarioLower.includes('18:')) {
      horarioFinal = '18:00';
    } else if (horarioLower.match(/\d{1,2}:\d{2}/)) {
      horarioFinal = horarioLower.match(/\d{1,2}:\d{2}/)[0];
    }

    // Calcular data/hora do lembrete (1 dia antes, às 9h)
    const dataLembrete = addDays(dataCalculada, -1);
    dataLembrete.setHours(9, 0, 0, 0);

    // Criar agendamento completo
    const agendamento: AgendamentoCompleto = {
      id_agendamento: `ag_${Date.now()}_${chatId.substring(0, 10)}`,
      telefone: chatId.replace('@c.us', ''),
      nome_lead: 'Não identificado', // Será preenchido depois
      data_hora_agendamento: `${format(dataCalculada, 'yyyy-MM-dd')}T${horarioFinal}:00`,
      tipo_agendamento: analise.tipo_agendamento || determinarTipoAgendamento(conversation),
      status_agendamento: analise.confirmado ? 'confirmado' : 'pendente',
      resumo_conversa: conversation.substring(-500), // Últimos 500 caracteres
      chatId,
      data_hora_lembrete: format(dataLembrete, "yyyy-MM-dd'T'HH:mm:ss"),
      lembrete_enviado: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ Agendamento identificado: ${agendamento.tipo_agendamento} para ${format(dataCalculada, 'dd/MM/yyyy')} às ${horarioFinal}`);
    return agendamento;

  } catch (error) {
    console.error('Erro ao identificar agendamento completo:', error);
    return null;
  }
}

// Manter função original para compatibilidade
export async function identificarAgendamento(conversation: string, geminiKey: string, chatId: string, clientePath: string): Promise<{ data_agendada: string; horario_agendado: string }> {
  const agendamento = await identificarAgendamentoCompleto(conversation, geminiKey, chatId, clientePath);
  if (agendamento) {
    const [data, hora] = agendamento.data_hora_agendamento.split('T');
    return {
      data_agendada: data.split('-').reverse().join('/'),
      horario_agendado: hora.substring(0, 5)
    };
  }
  return { data_agendada: '', horario_agendado: '' };
}
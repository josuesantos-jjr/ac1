/**
 * Funções utilitárias para comparar campos individualmente
 * e detectar alterações significativas nos dados do lead
 */

// Interface para definir a estrutura da resposta da IA
export interface AnaliseLead {
  nome: string | null;
  interesse: string | null;
  leadScore: number;
  etapaFunil: string | null;
  isLeadQualificado: boolean;
  detalhes_agendamento: Array<{
    agendamento_identificado: boolean;
    tipo_agendamento: "visita" | "reunião" | null;
    data_agendada: string | null; // Formato "YYYY-MM-DD",
    horario_agendado: string | null; // Formato "HH:MM",
    agendamento_notificado: Array<{
      chatid: boolean;
      TARGET_CHATID: boolean;
    }>
  }>;
  resumoParaAtendente: string | null;
  precisaAtendimentoHumano: boolean;
  tags: string[];
}

/**
 * Compara dois valores de nome e determina se há mudança significativa
 */
export function compararNome(nomeAtual: string | null, nomeNovo: string | null): boolean {
  // Se um é null e o outro não é, há mudança
  if ((nomeAtual === null) !== (nomeNovo === null)) {
    return true;
  }

  // Se ambos são null, não há mudança
  if (nomeAtual === null && nomeNovo === null) {
    return false;
  }

  // Se ambos existem, compara se são diferentes
  return nomeAtual?.trim().toLowerCase() !== nomeNovo?.trim().toLowerCase();
}

/**
 * Compara dois valores de interesse e determina se há mudança significativa
 */
export function compararInteresse(interesseAtual: string | null, interesseNovo: string | null): boolean {
  if ((interesseAtual === null) !== (interesseNovo === null)) {
    return true;
  }

  if (interesseAtual === null && interesseNovo === null) {
    return false;
  }

  // Calcula similaridade de texto usando distância de Levenshtein simplificada
  const texto1 = interesseAtual?.trim().toLowerCase() || '';
  const texto2 = interesseNovo?.trim().toLowerCase() || '';

  if (texto1 === texto2) {
    return false;
  }

  // Se diferença de tamanho for muito grande (>50%), considera mudança significativa
  const tamanho1 = texto1.length;
  const tamanho2 = texto2.length;
  const diferencaTamanho = Math.abs(tamanho1 - tamanho2);

  if (tamanho1 > 0 && (diferencaTamanho / tamanho1) > 0.5) {
    return true;
  }

  // Conta caracteres diferentes
  const maxLength = Math.max(tamanho1, tamanho2);
  let diferencaCaracteres = 0;

  for (let i = 0; i < maxLength; i++) {
    if (texto1[i] !== texto2[i]) {
      diferencaCaracteres++;
    }
  }

  // Se mais de 30% dos caracteres são diferentes, considera mudança significativa
  return (diferencaCaracteres / maxLength) > 0.3;
}

/**
 * Compara dois valores de leadScore e determina se há mudança significativa
 */
export function compararLeadScore(scoreAtual: number, scoreNovo: number): boolean {
  const diferenca = Math.abs(scoreAtual - scoreNovo);
  return diferenca > 1; // Diferença maior que 1 ponto
}

/**
 * Compara dois valores de etapaFunil e determina se há mudança
 */
export function compararEtapaFunil(etapaAtual: string | null, etapaNova: string | null): boolean {
  return etapaAtual?.trim().toLowerCase() !== etapaNova?.trim().toLowerCase();
}

/**
 * Compara dois valores booleanos de isLeadQualificado
 */
export function compararIsLeadQualificado(atual: boolean, novo: boolean): boolean {
  return atual !== novo;
}

/**
 * Compara detalhes de agendamento e determina se há mudanças
 */
export function compararDetalhesAgendamento(
  atual: AnaliseLead['detalhes_agendamento'] | undefined,
  novo: AnaliseLead['detalhes_agendamento']
): boolean {
  const atualArray = atual || [];
  const novoArray = novo || [];

  const atualVazio = atualArray.length === 0;
  const novoVazio = novoArray.length === 0;

  if (atualVazio !== novoVazio) {
    return true; // Um tem agendamento e o outro não
  }

  if (atualVazio && novoVazio) {
    return false; // Ambos não têm agendamento
  }

  const atualAgendamento = atualArray[0];
  const novoAgendamento = novoArray[0];

  if (!atualAgendamento || !novoAgendamento) {
    return atualAgendamento !== novoAgendamento;
  }

  // Compara cada campo do agendamento
  return atualAgendamento.agendamento_identificado !== novoAgendamento.agendamento_identificado ||
         atualAgendamento.tipo_agendamento !== novoAgendamento.tipo_agendamento ||
         atualAgendamento.data_agendada !== novoAgendamento.data_agendada ||
         atualAgendamento.horario_agendado !== novoAgendamento.horario_agendado;
}

/**
 * Compara resumo para atendente e determina se há mudança significativa
 */
export function compararResumoParaAtendente(resumoAtual: string | null, resumoNovo: string | null): boolean {
  if ((resumoAtual === null) !== (resumoNovo === null)) {
    return true;
  }

  if (resumoAtual === null && resumoNovo === null) {
    return false;
  }

  const texto1 = resumoAtual?.trim().toLowerCase() || '';
  const texto2 = resumoNovo?.trim().toLowerCase() || '';

  if (texto1 === texto2) {
    return false;
  }

  // Se diferença de tamanho for muito grande (>50%), considera mudança significativa
  const tamanho1 = texto1.length;
  const tamanho2 = texto2.length;

  if (tamanho1 > 0 && Math.abs(tamanho1 - tamanho2) / tamanho1 > 0.5) {
    return true;
  }

  // Conta palavras diferentes
  const palavras1 = new Set(texto1.split(/\s+/));
  const palavras2 = new Set(texto2.split(/\s+/));

  const palavrasComuns = new Set([...palavras1].filter(x => palavras2.has(x)));
  const totalPalavras = Math.max(palavras1.size, palavras2.size);

  // Se menos de 60% das palavras são comuns, considera mudança significativa
  return palavrasComuns.size / totalPalavras < 0.6;
}

/**
 * Compara necessidade de atendimento humano
 */
export function compararPrecisaAtendimentoHumano(atual: boolean, novo: boolean): boolean {
  return atual !== novo;
}

/**
 * Compara arrays de tags e determina se há mudanças
 */
export function compararTags(tagsAtual: string[], tagsNovo: string[]): boolean {
  if (tagsAtual.length !== tagsNovo.length) {
    return true;
  }

  const setAtual = new Set(tagsAtual.map(tag => tag.toLowerCase().trim()));
  const setNovo = new Set(tagsNovo.map(tag => tag.toLowerCase().trim()));

  // Verifica se todas as tags atuais estão nas novas
  for (const tag of setAtual) {
    if (!setNovo.has(tag)) {
      return true;
    }
  }

  // Verifica se todas as tags novas estão nas atuais
  for (const tag of setNovo) {
    if (!setAtual.has(tag)) {
      return true;
    }
  }

  return false;
}

/**
 * Função principal que compara dois objetos AnaliseLead completos
 * e retorna se há qualquer mudança significativa
 */
export function detectarMudancasSignificativas(
  atual: Partial<AnaliseLead>,
  novo: AnaliseLead
): boolean {
  return compararNome(atual.nome ?? null, novo.nome) ||
         compararInteresse(atual.interesse ?? null, novo.interesse) ||
         compararLeadScore(atual.leadScore || 0, novo.leadScore) ||
         compararEtapaFunil(atual.etapaFunil ?? null, novo.etapaFunil) ||
         compararIsLeadQualificado(atual.isLeadQualificado || false, novo.isLeadQualificado) ||
         compararDetalhesAgendamento(atual.detalhes_agendamento, novo.detalhes_agendamento) ||
         compararResumoParaAtendente(atual.resumoParaAtendente ?? null, novo.resumoParaAtendente) ||
         compararPrecisaAtendimentoHumano(atual.precisaAtendimentoHumano || false, novo.precisaAtendimentoHumano) ||
         compararTags(atual.tags || [], novo.tags);
}
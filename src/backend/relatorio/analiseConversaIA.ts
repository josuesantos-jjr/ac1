import fs from 'node:fs/promises';
import path from 'node:path';
import { createLogger } from '../util/logger.ts';

const logger = createLogger({
  categoria: 'analise-conversa-ia',
  fonte: 'src/backend/relatorio/analiseConversaIA.ts'
});

interface AnaliseResultado {
    resumoGeral: string;
    resumosIndividuais: Array<{ chatId: string, resumo: string, etapaFunil: string }>;
}

// ✅ VERSÃO MELHORADA: Pega resumos existentes no Dados.json
export async function analisarConversasDoDia(clientePath: string, dataRelatorio: Date): Promise<AnaliseResultado> {
  logger.info('🚀 Iniciando análise melhorada de conversas do dia');

  const dataAlvoString = dataRelatorio.toLocaleDateString('pt-BR');
  const resumosIndividuais: Array<{ chatId: string, resumo: string, etapaFunil: string }> = [];

  try {
    const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
    const chatIds = await fs.readdir(pastaHistorico);
    let conversasComEtapa = 0;

    logger.info(`📁 Verificando ${chatIds.length} conversas para ${dataAlvoString}`);

    for (const chatId of chatIds) {
      const caminhoChatId = path.join(pastaHistorico, chatId);

      try {
        const stats = await fs.stat(caminhoChatId);
        if (!stats.isDirectory()) continue;

        const arquivoDados = path.join(caminhoChatId, 'Dados.json');

        try {
          await fs.access(arquivoDados);
        } catch {
          continue; // Pula se Dados.json não existe
        }

        const dadosContent = await fs.readFile(arquivoDados, 'utf-8');
        const dados = JSON.parse(dadosContent);

        // ✅ APENAS chatIds que têm etapa do funil definida
        if (dados.etapaFunil && dados.etapaFunil !== 'Não definida') {
          conversasComEtapa++;

          const resumo = `📞 ${dados.name || 'Não identificado'} (${chatId.replace('@c.us', '')})
📅 Contato: ${dados.telefone || chatId.replace('@c.us', '')}
📊 Etapa: ${dados.etapaFunil}
🏷️ Tags: ${dados.tags?.join(', ') || 'Nenhuma'}
📋 Origem: ${dados.origem || 'Não definida'}
💬 Status: ${dados.interesse || 'Não definido'}`;

          resumosIndividuais.push({
            chatId,
            resumo,
            etapaFunil: dados.etapaFunil
          });

          logger.info(`✅ ChatId ${chatId} adicionado ao relatório (etapa: ${dados.etapaFunil})`);
        }

      } catch (erro) {
        logger.error(`Erro ao processar chat ${chatId}:`, erro);
      }
    }

    // ✅ Resumo geral baseado nos dados encontrados
    const resumoGeral = `📊 RELATÓRIO DE CONVERSAS - ${dataAlvoString}

📈 RESUMO EXECUTIVO:
├─ 📁 Total de conversas verificadas: ${chatIds.length}
├─ 🎯 Conversas com etapa definida: ${conversasComEtapa}
├─ 📊 Total de etapas identificadas: ${resumosIndividuais.length}
└─ 📅 Data do relatório: ${dataAlvoString}

📋 DISTRIBUIÇÃO POR ETAPA:
${gerarDistribuicaoPorEtapa(resumosIndividuais)}

✅ Relatório gerado com sucesso usando dados existentes no sistema.`;

    logger.info(`✅ Análise concluída: ${resumosIndividuais.length} conversas com etapa definida`);
    return { resumoGeral, resumosIndividuais };

  } catch (error) {
    logger.error('❌ Erro ao analisar conversas do dia:', error);
    return {
      resumoGeral: `❌ Erro ao gerar relatório: ${error}`,
      resumosIndividuais: []
    };
  }
}

// ✅ Função auxiliar para gerar distribuição por etapa
function gerarDistribuicaoPorEtapa(resumos: Array<{ etapaFunil: string }>): string {
  const distribuicao: { [key: string]: number } = {};

  resumos.forEach(item => {
    distribuicao[item.etapaFunil] = (distribuicao[item.etapaFunil] || 0) + 1;
  });

  return Object.entries(distribuicao)
    .map(([etapa, count]) => `├─ ${etapa}: ${count}`)
    .join('\n');
}
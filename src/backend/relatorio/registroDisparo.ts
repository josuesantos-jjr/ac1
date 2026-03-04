import fs from 'node:fs';
import path from 'node:path';
import { format } from 'date-fns';
import { createLogger } from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

const logger = createLogger({
  categoria: 'registro-disparo',
  fonte: 'src/backend/relatorio/registroDisparo.ts'
});

interface DisparoRegistro {
  data: string;
  numeroTelefone: string;
  status: boolean;
  etapaAquecimento: number;
  quantidadeDisparada: number;
  limiteDiario: number;
  tipo?: 'disparo_inicial' | 'followup';
  listaNome?: string;
}

interface ConversasAtivasRegistro {
  data: string;
  chatId: string;
  tipoInteracao: 'resposta' | 'iniciativa' | 'followup';
  listaOrigem?: string;
}

export const registrarDisparo = async (clientePath: string, registro: DisparoRegistro) => {
  const dataRegistro = new Date(registro.data);
  const ano = dataRegistro.getFullYear().toString();
  const mes = (dataRegistro.getMonth() + 1).toString().padStart(2, '0');
  const dia = dataRegistro.getDate().toString().padStart(2, '0');

  // ✅ Arquivo único organizado: config/relatorios/disparos.json
  const relatorioPath = path.join(clientePath, 'config', 'relatorios');
  const relatorioFile = path.join(relatorioPath, 'disparos.json');

  // ✅ Criar diretório se não existir
  if (!fs.existsSync(relatorioPath)) {
    fs.mkdirSync(relatorioPath, { recursive: true });
    console.log(`📁 Diretório de relatórios criado: ${relatorioPath}`);
  }

  // ✅ Ler estrutura existente ou criar estrutura vazia organizada por ano/mês/dia
  let estruturaRelatorios: any = {};
  if (fs.existsSync(relatorioFile)) {
    try {
      const data = fs.readFileSync(relatorioFile, 'utf8');
      estruturaRelatorios = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler estrutura de relatórios existente:', error);
      estruturaRelatorios = {};
    }
  }

  // ✅ Garantir que ano/mês/dia existem na estrutura
  if (!estruturaRelatorios[ano]) {
    estruturaRelatorios[ano] = {};
  }
  if (!estruturaRelatorios[ano][mes]) {
    estruturaRelatorios[ano][mes] = {};
  }
  if (!estruturaRelatorios[ano][mes][dia]) {
    estruturaRelatorios[ano][mes][dia] = [];
  }

  // ✅ Adicionar novo registro no dia específico
  estruturaRelatorios[ano][mes][dia].push(registro);

  // 🔄 SALVAR NO SQLITE (sincronização automática)
  // clientId já é apenas o nome da pasta (ex: "CMW"), não precisa extrair do caminho
  const clientId = clientePath.split(/[\\/]/).pop() || 'default';
  try {
    await syncManager.saveClientData(clientId, {
      relatoriosDisparos: estruturaRelatorios
    });
    console.log(`[Registro Disparo] Relatorios de disparos salvos no SQLite para ${clientId}`);
  } catch (sqliteError) {
    console.error(`[Registro Disparo] Erro ao salvar no SQLite:`, sqliteError);
    // Continua com o salvamento JSON mesmo se SQLite falhar
  }

  // 📄 SALVAR NO JSON (manter funcionalidade original)
  // ✅ Salvar estrutura atualizada
  try {
    fs.writeFileSync(relatorioFile, JSON.stringify(estruturaRelatorios, null, 2));
    console.log(`✅ Disparo registrado em ${ano}/${mes}/${dia} - Total: ${estruturaRelatorios[ano][mes][dia].length}`);
  } catch (error) {
    console.error('❌ Erro ao salvar registro de disparo:', error);
  }
};

export const buscarRelatorios = (clientePath: string, dataInicio?: string, dataFim?: string) => {
  const relatorioFile = path.join(clientePath, 'config', 'relatorios', 'disparos.json');

  if (!fs.existsSync(relatorioFile)) {
    return [];
  }

  let todosRegistros: Array<DisparoRegistro & { data: string }> = [];

  try {
    const conteudo = fs.readFileSync(relatorioFile, 'utf8');
    const estruturaRelatorios = JSON.parse(conteudo);

    // ✅ Percorrer estrutura ano/mês/dia
    Object.keys(estruturaRelatorios).forEach(ano => {
      Object.keys(estruturaRelatorios[ano]).forEach(mes => {
        Object.keys(estruturaRelatorios[ano][mes]).forEach(dia => {
          const dataString = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

          // Filtrar por intervalo de datas se especificado
          if (dataInicio && dataString < dataInicio) return;
          if (dataFim && dataString > dataFim) return;

          const registros: DisparoRegistro[] = estruturaRelatorios[ano][mes][dia];

          // Adicionar data ao registro para compatibilidade
          registros.forEach(registro => {
            todosRegistros.push({ ...registro, data: dataString });
          });
        });
      });
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return [];
  }

  return todosRegistros;
};

export const gerarEstatisticas = (registros: DisparoRegistro[]) => {
  return {
    totalDisparos: registros.length,
    disparosSucesso: registros.filter(r => r.status).length,
    disparosFalha: registros.filter(r => !r.status).length,
    mediaDisparosDiarios: registros.length / new Set(registros.map(r => r.data.split('T')[0])).size,
    etapaAquecimentoAtual: registros[registros.length - 1]?.etapaAquecimento || 0
  };
};

// ✅ Função para registrar follow-ups no sistema de relatórios
export const registrarFollowUp = (clientePath: string, registro: DisparoRegistro) => {
  const registroFollowUp = { ...registro, tipo: 'followup' as const };
  return registrarDisparo(clientePath, registroFollowUp);
};

// ✅ Função para contar diferentes tipos de atividades do dia
export const contarAtividadesDoDia = (clientePath: string, dataRelatorio: Date) => {
  const dataString = format(dataRelatorio, 'yyyy-MM-dd');
  const registros = buscarRelatorios(clientePath, dataString, dataString);

  return {
    disparosIniciais: registros.filter(r => r.tipo !== 'followup').length,
    followUps: registros.filter(r => r.tipo === 'followup').length,
    disparosSucesso: registros.filter(r => r.status === true).length,
    disparosFalha: registros.filter(r => r.status === false).length,
    listasAtivas: new Set(registros.map(r => r.listaNome).filter(Boolean)).size,
    listaAtual: registros.length > 0 ? registros[registros.length - 1]?.listaNome : 'Nenhuma'
  };
};

// ✅ Função para rastrear conversas ativas (chats com interação recente)
export const rastrearConversasAtivas = async (clientePath: string): Promise<number> => {
  const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
  let conversasAtivas = 0;
  const hoje = new Date();
  const limiteAtividade = 7; // dias de atividade considerada "ativa"

  try {
    const chatIds = await fs.promises.readdir(pastaHistorico);

    for (const chatId of chatIds) {
      const caminhoChatId = path.join(pastaHistorico, chatId);

      try {
        const stats = await fs.promises.stat(caminhoChatId);
        if (!stats.isDirectory()) continue;

        const arquivoChat = path.join(caminhoChatId, `${chatId}.json`);
        try {
          await fs.promises.access(arquivoChat);
        } catch {
          continue;
        }

        const conteudoArquivo = await fs.promises.readFile(arquivoChat, 'utf-8');
        const mensagens = JSON.parse(conteudoArquivo);

        // Verifica se houve atividade recente
        const mensagensRecentes = mensagens.filter((msg: any) => {
          try {
            const [dia, mes, anoStr] = msg.date.split('/');
            const ano = anoStr.length === 2 ? parseInt(`20${anoStr}`) : parseInt(anoStr);
            const dataMsg = new Date(ano, parseInt(mes) - 1, parseInt(dia));

            const diffTempo = hoje.getTime() - dataMsg.getTime();
            const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

            return diffDias <= limiteAtividade;
          } catch {
            return false;
          }
        });

        if (mensagensRecentes.length > 0) {
          conversasAtivas++;
        }
      } catch (erro) {
        console.error(`Erro ao processar chat ${chatId} para rastreamento: ${erro}`);
      }
    }
  } catch (erro) {
    console.error(`Erro ao ler a pasta ${pastaHistorico} para rastreamento: ${erro}`);
  }

  return conversasAtivas;
};

// ✅ Função para coletar estatísticas das etapas do funil
export const coletarEstatisticasFunil = async (clientePath: string): Promise<{ [etapa: string]: number }> => {
  const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
  const estatisticasFunil: { [etapa: string]: number } = {};

  try {
    const chatIds = await fs.promises.readdir(pastaHistorico);

    for (const chatId of chatIds) {
      const caminhoChatId = path.join(pastaHistorico, chatId);

      try {
        const stats = await fs.promises.stat(caminhoChatId);
        if (!stats.isDirectory()) continue;

        const arquivoDados = path.join(caminhoChatId, 'Dados.json');
        try {
          await fs.promises.access(arquivoDados);

          const conteudoDados = await fs.promises.readFile(arquivoDados, 'utf-8');
          const dados = JSON.parse(conteudoDados);

          // Coletar estatísticas da etapa do funil
          if (dados.etapaFunil) {
            estatisticasFunil[dados.etapaFunil] = (estatisticasFunil[dados.etapaFunil] || 0) + 1;
          }
        } catch {
          // Arquivo Dados.json não existe, continua
        }
      } catch (erro) {
        console.error(`Erro ao processar chat ${chatId} para funil: ${erro}`);
      }
    }
  } catch (erro) {
    console.error(`Erro ao ler a pasta ${pastaHistorico} para funil: ${erro}`);
  }

  return estatisticasFunil;
};

// ✅ Função para coletar dados detalhados de conversas ativas do dia
export const coletarConversasAtivasDoDia = async (clientePath: string, dataRelatorio: Date): Promise<Array<{
  chatId: string;
  etapaFunil: string;
  historico: string;
}>> => {
  const dataAlvoString = format(dataRelatorio, 'dd/MM/yyyy');
  const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
  const conversasAtivas: Array<{
    chatId: string;
    etapaFunil: string;
    historico: string;
  }> = [];

  try {
    const chatIds = await fs.promises.readdir(pastaHistorico);

    for (const chatId of chatIds) {
      const caminhoChatId = path.join(pastaHistorico, chatId);

      try {
        const stats = await fs.promises.stat(caminhoChatId);
        if (!stats.isDirectory()) continue;

        const arquivoChat = path.join(caminhoChatId, `${chatId}.json`);
        const arquivoDados = path.join(caminhoChatId, 'Dados.json');

        try {
          await fs.promises.access(arquivoChat);
          await fs.promises.access(arquivoDados);
        } catch {
          continue;
        }

        // Ler dados do chat
        const conteudoArquivo = await fs.promises.readFile(arquivoChat, 'utf-8');
        const mensagens: any[] = JSON.parse(conteudoArquivo);

        // Filtrar mensagens do dia
        const historicoDoDia = mensagens
          .filter(msg => {
            try {
              const [dia, mes, anoStr] = msg.date.split('/');
              const ano = anoStr.length === 2 ? parseInt(`20${anoStr}`) : parseInt(anoStr);
              if (!dia || !mes || !ano) return false;
              const dataMsg = new Date(ano, parseInt(mes) - 1, parseInt(dia));
              return format(dataMsg, 'dd/MM/yyyy') === dataAlvoString;
            } catch {
              return false;
            }
          })
          .map(msg => `${msg.type} (${msg.time}): ${msg.message}`)
          .join('\n');

        if (historicoDoDia.trim().length > 0) {
          // Ler dados do contato
          const dadosConteudo = await fs.promises.readFile(arquivoDados, 'utf-8');
          const dados = JSON.parse(dadosConteudo);

          conversasAtivas.push({
            chatId,
            etapaFunil: dados.etapaFunil || 'Não definida',
            historico: historicoDoDia
          });
        }
      } catch (erro) {
        console.error(`Erro ao processar chat ${chatId} para conversas ativas: ${erro}`);
      }
    }
  } catch (erro) {
    console.error(`Erro ao ler a pasta ${pastaHistorico} para conversas ativas: ${erro}`);
  }

  return conversasAtivas;
};
import fs from 'node:fs/promises'; // Usar promises para async/await
import path from 'node:path';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns'; // Funções de data úteis
import { ptBR } from 'date-fns/locale'; // Locale para português brasileiro
import dotenv from 'dotenv';
import { buscarRelatorios, contarAtividadesDoDia, rastrearConversasAtivas, coletarEstatisticasFunil, coletarConversasAtivasDoDia } from './registroDisparo.ts'; // Importa funções de análise
import { createLogger } from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

const logger = createLogger({
  categoria: 'relatorio-diario',
  fonte: 'src/backend/relatorio/relatorioDiario.ts'
});
// Tipos podem ser definidos aqui ou importados se existirem
// interface DisparoRegistro { /* ... */ }
// interface ChatMessage { date: string; time: string; type: 'User' | 'IA'; message: string; }

interface ResumoIndividual {
  chatId: string;
  resumo: string;
  etapaFunil: string;
}

// Conta as conversas ativas
// Função Refatorada para contar conversas respondidas em um dia específico
async function contarConversasRespondidas(clientePath: string, dataRelatorio: Date): Promise<number> {
  const dataAlvoString = format(dataRelatorio, 'dd/MM/yyyy'); // Formato consistente para comparação
  const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
  let conversasRespondidas = 0;

  try {
    const chatIds = await fs.readdir(pastaHistorico);

    for (const chatId of chatIds) {
      const caminhoChatId = path.join(pastaHistorico, chatId);
      try {
        const stats = await fs.stat(caminhoChatId);
        if (!stats.isDirectory()) continue; // Pula se não for diretório

        const arquivoChat = path.join(caminhoChatId, `${chatId}.json`); // Assume nome do arquivo = chatId.json
        try {
          await fs.access(arquivoChat); // Verifica se o arquivo existe e é acessível
        } catch {
          continue; // Pula se não existe ou não acessível
        }

        const conteudoArquivo = await fs.readFile(arquivoChat, 'utf-8');
        const mensagens: any[] = JSON.parse(conteudoArquivo); // Usar tipo ChatMessage[] se definido

        let iaEnviouPrimeiro = false;
        let userRespondeuNoDia = false;

        for (const msg of mensagens) {
          // Tenta parsear a data da mensagem (assumindo formato dd/MM/yyyy ou dd/MM/yy)
          let dataMsg: Date | null = null;
          try {
            const [dia, mes, anoStr] = msg.date.split('/');
            const ano = anoStr.length === 2 ? parseInt(`20${anoStr}`) : parseInt(anoStr); // Converte ano de 2 dígitos
            if (dia && mes && ano) {
               // Cuidado com mês (0-11)
               dataMsg = new Date(ano, parseInt(mes) - 1, parseInt(dia));
            }
          } catch (parseError) {
             console.warn(`Erro ao parsear data "${msg.date}" no chat ${chatId}`);
             continue; // Pula mensagem com data inválida
          }

          // Verifica se a mensagem é do dia do relatório
          if (dataMsg && format(dataMsg, 'dd/MM/yyyy') === dataAlvoString) {
            if (msg.type === 'IA') {
              iaEnviouPrimeiro = true; // Marca que a IA iniciou (ou continuou) a conversa no dia
            } else if (msg.type === 'User' && iaEnviouPrimeiro) {
              // Se o usuário respondeu DEPOIS da IA no mesmo dia
              userRespondeuNoDia = true;
              break; // Já sabemos que houve resposta neste chat, podemos ir para o próximo
            }
          }
        }

        if (userRespondeuNoDia) {
          conversasRespondidas++;
        }
      } catch (erro) {
        // Loga erro específico do chat, mas continua processando outros
        console.error(`Erro ao processar chat ${chatId} para relatório: ${erro}`);
      }
    }
    console.log(`Relatório ${dataAlvoString}: Conversas respondidas encontradas: ${conversasRespondidas}`);
  } catch (erro) {
    // Erro ao ler o diretório principal de histórico
    console.error(`Erro ao ler a pasta ${pastaHistorico} para relatório: ${erro}`);
  }
  return conversasRespondidas;
}

// Função para verificar se uma conversa foi ativa no dia (IA enviou e usuário respondeu)
async function conversaAtivaNoDia(clientePath: string, chatId: string, dataRelatorio: Date): Promise<boolean> {
  const dataAlvoString = format(dataRelatorio, 'dd/MM/yyyy');
  const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
  const caminhoChatId = path.join(pastaHistorico, chatId);
  const arquivoChat = path.join(caminhoChatId, `${chatId}.json`);

  try {
    await fs.access(arquivoChat);
    const conteudoArquivo = await fs.readFile(arquivoChat, 'utf-8');
    const mensagens: any[] = JSON.parse(conteudoArquivo);

    let iaEnviouPrimeiro = false;
    let userRespondeuNoDia = false;

    for (const msg of mensagens) {
      let dataMsg: Date | null = null;
      try {
        const [dia, mes, anoStr] = msg.date.split('/');
        const ano = anoStr.length === 2 ? parseInt(`20${anoStr}`) : parseInt(anoStr);
        if (dia && mes && ano) {
          dataMsg = new Date(ano, parseInt(mes) - 1, parseInt(dia));
        }
      } catch {
        continue;
      }

      if (dataMsg && format(dataMsg, 'dd/MM/yyyy') === dataAlvoString) {
        if (msg.type === 'IA') {
          iaEnviouPrimeiro = true;
        } else if (msg.type === 'User' && iaEnviouPrimeiro) {
          userRespondeuNoDia = true;
          break;
        }
      }
    }

    return userRespondeuNoDia;
  } catch {
    return false;
  }
}

// Função para coletar resumos do dia dos Dados.json (apenas conversas ativas no dia)
async function coletarResumosDoDia(clientePath: string, dataRelatorio: Date): Promise<{ resumoGeral: string; resumosIndividuais: ResumoIndividual[] }> {
  const dataFormatada = format(dataRelatorio, 'dd/MM/yyyy');
  const pastaHistorico = path.join(clientePath, 'Chats', 'Historico');
  let resumosIndividuais: ResumoIndividual[] = [];
  let resumosTextos: string[] = [];

  try {
    const chatIds = await fs.readdir(pastaHistorico);

    for (const chatId of chatIds) {
      const caminhoChatId = path.join(pastaHistorico, chatId);
      const arquivoDados = path.join(caminhoChatId, 'Dados.json');

      try {
        // Primeiro verifica se a conversa foi ativa no dia
        const conversaAtiva = await conversaAtivaNoDia(clientePath, chatId, dataRelatorio);
        if (!conversaAtiva) {
          continue; // Pula conversas que não foram ativas no dia
        }

        await fs.access(arquivoDados); // Verifica se o arquivo existe
        const conteudoDados = await fs.readFile(arquivoDados, 'utf-8');
        const dados = JSON.parse(conteudoDados);

        if (dados.resumoParaAtendente) {
          resumosIndividuais.push({
            chatId: chatId,
            resumo: dados.resumoParaAtendente,
            etapaFunil: dados.etapaFunil || 'Não definida'
          });
          resumosTextos.push(dados.resumoParaAtendente);
        }
      } catch (erro) {
        // Pula se não existe ou erro ao ler
        continue;
      }
    }

    // Criar resumo geral concatenando os resumos individuais
    const resumoGeral = resumosTextos.length > 0
      ? `Resumos das conversas do dia ${dataFormatada}:\n\n${resumosTextos.join('\n\n')}`
      : `📭 Nenhum resumo disponível para ${dataFormatada}.`;

    return { resumoGeral, resumosIndividuais };
  } catch (erro) {
    console.error(`Erro ao coletar resumos do dia ${dataFormatada}: ${erro}`);
    return { resumoGeral: `📭 Erro ao coletar resumos para ${dataFormatada}.`, resumosIndividuais: [] };
  }
}

// Função para gerar o relatório diário
// Função Refatorada para criar e enviar o relatório diário
async function criarEnviarRelatorioDiario(client: any, clientePath: string, dataRelatorio: Date) {
  try {
    logger.info('Iniciando a geração do relatório diário', { clientePath, data: format(dataRelatorio, 'dd/MM/yyyy') });
    // Usa a data recebida como argumento
    const dataFormatada = format(dataRelatorio, 'dd/MM/yyyy');
    const mesAtual = format(dataRelatorio, 'MMMM', { locale: ptBR }); // Mês por extenso

    logger.debug('Carregando os prompts de relatório', { clientePath });
    const promptsPath = path.join(clientePath, 'config', 'relatorio', '.promptsRelatorios');
    let promptsRaw = '';
    try {
        promptsRaw = await fs.readFile(promptsPath, 'utf-8'); // Usa readFile assíncrono
    } catch (err) {
        console.error(`Erro ao ler arquivo de prompts ${promptsPath}: ${err}. Usando prompts vazios.`);
        // Lidar com erro - talvez retornar ou usar prompts padrão vazios
    }
    const prompts = promptsRaw.split('\n').map((linha: string) => linha.trim()); // Adiciona tipo

    const promptRelatorioDiario = prompts.find((linha: string) => linha.startsWith('RELATORIO_DIARIO='))?.split('=')[1] || ''; // Adiciona tipo
    const promptAnalisarConversas = prompts.find((linha: string) => linha.startsWith('ANALISAR_CONVERSAS='))?.split('=')[1] || ''; // Adiciona tipo

    console.log(`📊 Coletando dados detalhados de atividades para ${dataFormatada}...`);

    // ✅ Coletar estatísticas detalhadas usando a nova função
    const atividadesDoDia = contarAtividadesDoDia(clientePath, dataRelatorio);

    // ✅ Contar conversas ativas (últimos 7 dias)
    const conversasAtivas = await rastrearConversasAtivas(clientePath);

    // ✅ Coletar estatísticas das etapas do funil
    const estatisticasFunil = await coletarEstatisticasFunil(clientePath);

    // ✅ Coletar conversas ativas do dia com detalhes da etapa do funil
    const conversasAtivasDetalhadas = await coletarConversasAtivasDoDia(clientePath, dataRelatorio);

    console.log(`✅ Atividades do dia ${dataFormatada}:`);
    console.log(`   - Disparos iniciais: ${atividadesDoDia.disparosIniciais}`);
    console.log(`   - Follow-ups: ${atividadesDoDia.followUps}`);
    console.log(`   - Conversas ativas: ${conversasAtivas}`);
    console.log(`   - Lista atual: ${atividadesDoDia.listaAtual}`);
    console.log(`   - Etapas do funil: ${Object.keys(estatisticasFunil).length} diferentes`);

    // Log detalhado das etapas do funil
    console.log(`📊 Estatísticas das etapas do funil:`);
    Object.entries(estatisticasFunil).forEach(([etapa, quantidade]) => {
      console.log(`   - ${etapa}: ${quantidade}`);
    });

    // A lógica de disparoTotal foi removida, pois não parece útil no relatório diário
    // e a forma de cálculo anterior estava incorreta.

    console.log(`Contando conversas respondidas para ${dataFormatada}...`);
    const conversasRespondidas = await contarConversasRespondidas(clientePath, dataRelatorio);
    console.log(`Conversas respondidas: ${conversasRespondidas}`);

    console.log(`Coletando resumos dos Dados.json para ${dataFormatada}...`);
    // Chama a função para coletar resumos dos Dados.json
    const { resumoGeral: resumoGeralIA, resumosIndividuais: resumosIndividuaisIA } = await coletarResumosDoDia(clientePath, dataRelatorio);
    console.log(`Resumos coletados. Resumo Geral: ${resumoGeralIA ? 'OK' : 'Falhou/Vazio'}`);

    console.log('📋 Montando o texto do relatório detalhado...');
    // Monta a mensagem do relatório
    const nomeCliente = path.basename(clientePath);

    // ✅ Calcular progresso da lista atual (se houver)
    const progressoLista = atividadesDoDia.disparosIniciais > 0 ?
      `${atividadesDoDia.disparosIniciais}/${atividadesDoDia.disparosIniciais + atividadesDoDia.followUps} (${Math.round((atividadesDoDia.disparosIniciais / (atividadesDoDia.disparosIniciais + atividadesDoDia.followUps)) * 100)}%)` :
      'Nenhuma atividade';

    let relatorioTexto = `📊 *RELATÓRIO DIÁRIO - ${nomeCliente}*\n📅 *${dataFormatada}*\n\n`;

    // ✅ Seção de atividades detalhadas
    relatorioTexto += `🚀 *ATIVIDADES DO DIA:*\n`;
    relatorioTexto += `📋 *Lista Atual:* ${atividadesDoDia.listaAtual || 'Nenhuma'}\n`;
    relatorioTexto += `📊 *Disparos da Lista:* ${atividadesDoDia.disparosIniciais}\n`;
    relatorioTexto += `🤖 *Follow-ups Disparados:* ${atividadesDoDia.followUps}\n`;
    relatorioTexto += `🚀 *Total Disparos Hoje:* ${atividadesDoDia.disparosIniciais + atividadesDoDia.followUps}\n`;
    relatorioTexto += `💬 *Conversas Respondidas:* ${conversasRespondidas}\n`;
    relatorioTexto += `💬 *Conversas Ativas (7 dias):* ${conversasAtivas}\n`;

    if (atividadesDoDia.disparosFalha > 0) {
        relatorioTexto += `❌ *Falhas:* ${atividadesDoDia.disparosFalha}\n`;
    }
    relatorioTexto += `\n`;

    // ✅ Seção de etapas do funil
    relatorioTexto += `🔄 *ETAPAS DO FUNIL:*\n`;
    if (Object.keys(estatisticasFunil).length > 0) {
        Object.entries(estatisticasFunil).forEach(([etapa, quantidade]) => {
            relatorioTexto += `📊 *${etapa}:* ${quantidade}\n`;
        });
    } else {
        relatorioTexto += `📭 *Nenhuma etapa definida no momento.*\n`;
    }
    relatorioTexto += `\n`;

    // ✅ Seção de resumos das conversas
    relatorioTexto += `🤖 *RESUMOS DAS CONVERSAS:*\n`;
    relatorioTexto += `${resumoGeralIA || '📭 Sem resumos disponíveis para hoje.'}\n\n`;
    // Opcional: Adicionar resumos individuais com etapa do funil
    if (resumosIndividuaisIA && resumosIndividuaisIA.length > 0) {
        relatorioTexto += `\n*Resumos Individuais:*\n`;
        resumosIndividuaisIA.forEach((r: ResumoIndividual) => {
            const chatIdSimple = r.chatId.split('@')[0]; // Mostra só o número
            relatorioTexto += `\n_${chatIdSimple}_:\n`;
            relatorioTexto += `📊 *Etapa do funil:* ${r.etapaFunil}\n`;
            relatorioTexto += `${r.resumo}\n`;
        });
    }

    console.log('💾 Salvando o relatório mensal no arquivo JSON...');

    // ✅ Arquivo único organizado: config/relatorios/relatorios_mensais.json
    const relatorioSalvoPath = path.join(clientePath, 'config', 'relatorios');
    const relatorioMensalFile = path.join(relatorioSalvoPath, 'relatorios_mensais.json');

    // ✅ Criar diretório se não existir
    await fs.mkdir(relatorioSalvoPath, { recursive: true });

    // ✅ Ler estrutura existente ou criar estrutura organizada por ano/mês/dia
    let estruturaMensal: any = {};
    try {
        const data = await fs.readFile(relatorioMensalFile, 'utf8');
        estruturaMensal = JSON.parse(data);
    } catch (error: unknown) {
        // Arquivo não existe ou erro de leitura - iniciar com estrutura vazia
        estruturaMensal = {};
    }

    // ✅ Garantir que ano/mês existem na estrutura
    const ano = format(dataRelatorio, 'yyyy');
    const mes = format(dataRelatorio, 'MM');
    if (!estruturaMensal[ano]) {
        estruturaMensal[ano] = {};
    }
    if (!estruturaMensal[ano][mes]) {
        estruturaMensal[ano][mes] = {};
    }

    // ✅ Adiciona os dados detalhados do dia na estrutura mensal
    estruturaMensal[ano][mes][dataFormatada] = {
        // ✅ Dados detalhados de atividades
        listaAtual: atividadesDoDia.listaAtual,
        disparosIniciais: atividadesDoDia.disparosIniciais,
        followUps: atividadesDoDia.followUps,
        disparosSucesso: atividadesDoDia.disparosSucesso,
        disparosFalha: atividadesDoDia.disparosFalha,
        conversasRespondidas,
        conversasAtivas,
        progressoLista,

        // ✅ Dados de resumos das conversas
        resumoGeral: resumoGeralIA || null,
        resumosIndividuais: resumosIndividuaisIA && resumosIndividuaisIA.length > 0 ? resumosIndividuaisIA : null
    };

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    const clientId = path.basename(clientePath);
    try {
      await syncManager.saveClientData(clientId, {
        relatoriosMensais: estruturaMensal
      });
      console.log(`[Relatorio Diario] Relatorios mensais salvos no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[Relatorio Diario] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    // ✅ Salvar estrutura mensal atualizada
    try {
        await fs.writeFile(relatorioMensalFile, JSON.stringify(estruturaMensal, null, 2));
        console.log(`✅ Relatório mensal salvo em ${relatorioMensalFile}`);
    } catch (error) {
        console.error(`❌ Erro ao salvar relatório mensal: ${error}`);
    }

// Carregar targetChatId de infoCliente.json
const infoPath = path.join(clientePath, 'config', 'infoCliente.json');
let targetChatId = '';
try {
    const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));
    targetChatId = infoConfig.TARGET_CHAT_ID || '';
    if (targetChatId && !targetChatId.endsWith('@c.us') && !targetChatId.endsWith('@g.us')) {
        if (targetChatId.includes('-')) { targetChatId += '@g.us'; }
        else { targetChatId += '@c.us'; }
    }
} catch (error) {
    console.error(`Erro ao ler infoCliente.json para TARGET_CHAT_ID: ${error}`);
}

    // Envia o relatório se targetChatId foi definido
    if (targetChatId) {
        console.log(`Enviando relatório para ${targetChatId}...`);
        try {
          await client.sendText(targetChatId, relatorioTexto);
          console.log(`✅ Relatório enviado com sucesso para o chatId: ${targetChatId}`);
        } catch (error) {
          console.error(`❌ Erro ao enviar o relatório para ${targetChatId}: ${error}`);
          // Tenta notificar o erro via log
          try {
            const errorMessage = `⚠️ *ERRO NO ENVIO DO RELATÓRIO DIÁRIO*\n\nCliente: ${nomeCliente}\nData: ${dataFormatada}\nErro: ${error instanceof Error ? error.message : String(error)}\n\nO relatório foi salvo localmente mas não foi possível enviar via WhatsApp.`;
            await client.sendText(targetChatId, errorMessage);
          } catch (notificationError) {
            console.error(`❌ Erro ao enviar notificação de erro: ${notificationError}`);
          }
        }
    } else {
        console.log("⚠️ TARGET_CHAT_ID não configurado no .env do cliente, relatório não enviado via WhatsApp.");
    }

    console.log('Relatório diário gerado e enviado com sucesso!');
  } catch (error) {
    console.error(`Erro ao gerar relatório diário: ${error}`);
  }
}

// Remove funções auxiliares antigas que não são mais necessárias
// function getSemanaDoMes(data: Date): number { ... }
// function lerHorarioRelatorio(clientePath: string): string { ... }
// function houveDisparoHoje(clientePath: string): boolean { ... }
// function horaDeExecutarRelatorio(horarioRelatorio: string): boolean { ... }

// Exporta a função principal refatorada
export { criarEnviarRelatorioDiario };

// A função 'dispararRelatorioDiario' foi removida pois a lógica de gatilho está em disparo.ts

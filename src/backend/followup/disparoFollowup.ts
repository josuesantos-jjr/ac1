import * as fsSync from 'node:fs';
import path from 'node:path';
import { format, getDay, setHours, isWithinInterval, parseISO, addDays } from 'date-fns';
import { gerarMensagemFollowUp } from './gerarMensagemFollowUp.ts';
import { getFollowUpConfig } from '../followup/config.ts';
import { getPasta } from '../disparo/disparo.ts';
import * as fs from 'node:fs/promises';
import { analisarNecessidadeFollowUp, removerFollowUp, updateFollowUpEntry } from './analise.ts';
import { processTriggers } from '../service/braim/gatilhos.ts';
import { registrarFollowUp } from '../relatorio/registroDisparo.ts';
import { splitMessages, sendMessagesWithDelay, getIsSendingMessages, isValidWid, sanitizeWid } from '../util/index.ts';
import { syncManager } from '../../database/sync.ts';

// ✅ NOVO: Sistema de verificação de duplicatas para follow-ups
const DUPLICATE_PROTECTION_ENABLED = true;
const recentMessagesCache = new Map<string, { message: string; timestamp: number }[]>();
const CACHE_DURATION = 30000; // 30 segundos
const MAX_CACHED_MESSAGES = 5;

// ✅ NOVO: Função para verificar duplicatas em follow-ups
function isRecentDuplicateFollowup(chatId: string, message: string): boolean {
  if (!DUPLICATE_PROTECTION_ENABLED) return false;

  try {
    const now = Date.now();
    const chatCache = recentMessagesCache.get(chatId) || [];

    // Remove mensagens antigas do cache
    const recentMessages = chatCache.filter(
      item => (now - item.timestamp) < CACHE_DURATION
    );

    // Verifica se a mensagem é idêntica e recente
    const isDuplicate = recentMessages.some(
      item => item.message.trim().toLowerCase() === message.trim().toLowerCase()
    );

    if (isDuplicate) {
      console.log(`🚫 Mensagem duplicada detectada para follow-up ${chatId}, ignorando envio`);
      return true;
    }

    // Adiciona mensagem atual ao cache
    recentMessages.push({ message: message.trim(), timestamp: now });

    // Mantém apenas as mensagens mais recentes
    if (recentMessages.length > MAX_CACHED_MESSAGES) {
      recentMessages.shift();
    }

    recentMessagesCache.set(chatId, recentMessages);
    return false;

  } catch (error) {
    console.error(`Erro na verificação de duplicata para follow-up ${chatId}:`, error);
    return false; // Em caso de erro, permite o envio
  }
}


export const dispararFollowupsAgendados = async (client: any, clienteIdCompleto: string, __dirname: string) => {
  console.log(((`[dispararFollowupsAgendados] Iniciando...`)));

  const clientePath = getPasta(clienteIdCompleto);
  if (!clientePath) {
    console.log(`[dispararFollowupsAgendados] Caminho inválido para cliente ${clienteIdCompleto}`);
    return;
  }

  // Verifica se o follow-up está ativo na configuração
  const configFollowUp = await getFollowUpConfig(clientePath);
  if (!configFollowUp.ativo) {
    console.info(`[dispararFollowupsAgendados] Follow-up está desativado para ${clienteIdCompleto}. Pulando disparo.`);
    return;
  }

  await analisarNecessidadeFollowUp(clienteIdCompleto);

  try {
    const regrasFilePath = path.join(getPasta(clienteIdCompleto), 'config', 'regrasDisparo.json');
    let regras;
    try {
      const regrasContent = fsSync.readFileSync(regrasFilePath, 'utf-8');
      regras = JSON.parse(regrasContent);
    } catch (err) {
      console.log(`[dispararFollowupsAgendados] Erro ao ler regras de disparo para ${clienteIdCompleto}:`, err);
      return;
    }

    // === VERIFICAÇÃO DE LIMITE DIÁRIO COMPARTILHADO ===
    const limiteCompartilhado = await verificarLimiteDiarioCompartilhado(clienteIdCompleto, regras);
    if (!limiteCompartilhado.podeEnviar) {
      console.log(`[dispararFollowupsAgendados] Limite diário compartilhado atingido para ${clienteIdCompleto}. Pulando follow-ups.`);
      return;
    }

    let horarioValido = false;
    if (regras && regras.DIA_INICIAL && regras.DIA_FINAL && regras.HORARIO_INICIAL && regras.HORARIO_FINAL) {
       horarioValido = diaDaSemanaValido(regras.DIA_INICIAL, regras.DIA_FINAL) && await dentroDoHorario(regras.HORARIO_INICIAL, regras.HORARIO_FINAL);
    } else {
        console.warn(((`[dispararFollowupsAgendados] Regras de dia/horário incompletas para ${clienteIdCompleto}. Pulando verificação de horário.`)));
        return;
    }

    if (!horarioValido) {
      console.log(((`[dispararFollowupsAgendados] Fora do dia da semana ou horário permitido para ${clienteIdCompleto}. Pulando disparo de followups.`)));
      return;
    }

    // Carrega followups do arquivo followups.json
    const followupsFilePath = path.join(clientePath, 'config', 'followups.json');
    let followups: any[] = [];
    try {
      if (fsSync.existsSync(followupsFilePath)) {
        const followupsContent = fsSync.readFileSync(followupsFilePath, 'utf-8');
        followups = JSON.parse(followupsContent);
      } else {
        console.log(((`[dispararFollowupsAgendados] Arquivo followups.json não encontrado. Criando um novo.`)));
        fsSync.writeFileSync(followupsFilePath, '[]', 'utf-8');
        followups = [];
      }
    } catch (err) {
      console.log(`[dispararFollowupsAgendados] Erro ao ler/criar arquivo de followups para ${clienteIdCompleto}:`, err);
      return;
    }

    
    for (const followup of followups) {
      const { chatid: chatId, nivel_followup: nivelAtual } = followup;
      
      const dadosFilePath = path.join(clientePath, 'Chats', 'Historico', chatId, 'Dados.json');
      let dados;
      let configFollowUp;

      try {
        const dadosContent = fsSync.readFileSync(dadosFilePath, 'utf-8');
        dados = JSON.parse(dadosContent);
        configFollowUp = await getFollowUpConfig(clientePath);
      } catch (err) {
        console.log(`[dispararFollowupsAgendados] Erro ao ler dados do chat ${chatId}:`, err);
        continue;
      }

      // Verifica o interesse do cliente
      if (dados?.interesse === 'não' || dados?.interesse === false || dados?.interesse === 'false') {
        console.info(`[dispararFollowupsAgendados] Interesse é '${dados.interesse}' para ${chatId}. Removendo follow-up.`);
        await removerFollowUp(clientePath, chatId);
        continue;
      }
      // Verifica se o nível de follow-up é válido
      if (!nivelAtual) {
        console.warn(`[dispararFollowupsAgendados] Nível de follow-up não definido para ${chatId}. Pulando disparo.`);
        continue;
      }

      // Obtém o intervalo de dias para o nível atual
      const intervaloDias = configFollowUp.intervalosDias?.[nivelAtual - 1];
      if (intervaloDias === undefined) {
        console.warn(`[dispararFollowupsAgendados] Intervalo de dias não definido para o nível ${nivelAtual} para ${chatId}. Pulando disparo.`);
        continue;
      }

      // Calcula a data de disparo
      if (!dados.data_ultima_mensagem_enviada) {
        console.log(((`[dispararFollowupsAgendados] data_ultima_mensagem_enviada não definida para ${chatId}.`)));
        continue;
      }

      const dataUltimaMensagem = new Date(dados.data_ultima_mensagem_enviada);
      const dataDisparo = addDays(dataUltimaMensagem, intervaloDias);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas as datas

      if (dataDisparo > hoje) {
        console.log(((`[dispararFollowupsAgendados] Ainda não é dia de disparar follow-up para ${chatId}. Próximo disparo em ${dataDisparo}.`)));
        continue;
      }


      // Pega o histórico do chat
      const conversationHistory = await readLocalConversationHistory(clientePath, chatId);

      // Pega o prompt do nível
      let promptBase = '';
      if (configFollowUp.promptGeral) {
        promptBase = configFollowUp.prompt || '';
      } else if (configFollowUp.promptsPorNivel && configFollowUp.promptsPorNivel[nivelAtual - 1]) {
        promptBase = configFollowUp.promptsPorNivel[nivelAtual - 1];
      } else {
        console.log(`[dispararFollowupsAgendados] Prompt não encontrado para o nível ${nivelAtual} para ${chatId}.`);
        continue;
      }

      // Gera a mensagem de follow-up
      let mensagemParaEnviar = await gerarMensagemFollowUp(clienteIdCompleto, chatId, nivelAtual, conversationHistory);

      if (!mensagemParaEnviar) {
        console.warn(((`[dispararFollowupsAgendados] IA não gerou mensagem para ${chatId} (Nível ${nivelAtual}). Usando mensagem genérica.`)));
        mensagemParaEnviar = "Olá, tudo bem? Passando para saber se você ainda tem interesse em comprar imoveis.";
      }

      if (mensagemParaEnviar) {
         console.log(((`[dispararFollowupsAgendados] Mensagem final para ${chatId}: ${mensagemParaEnviar.substring(0, 100)}...`)));

         // ✅ NOVO: Validação de formato de WID antes do envio
         if (!isValidWid(chatId)) {
           console.error(`[dispararFollowupsAgendados] WID inválido detectado: ${chatId}`);

           // Tenta sanitizar o WID
           const sanitizedWid = sanitizeWid(chatId);
           if (sanitizedWid) {
             console.log(`[dispararFollowupsAgendados] WID sanitizado: ${chatId} → ${sanitizedWid}`);
             // Remove entrada inválida e continua com a sanitizada
             await removerFollowUp(clientePath, chatId);
             await updateFollowUpEntry(clientePath, sanitizedWid, nivelAtual);
             continue; // Pula este ciclo e tenta novamente no próximo
           } else {
             console.error(`[dispararFollowupsAgendados] Não foi possível sanitizar WID inválido: ${chatId}`);
             await removerFollowUp(clientePath, chatId);
             continue; // Remove entrada inválida e continua
           }
         }

         try {
            // ✅ NOVO: Verificação de duplicata ANTES do envio em follow-ups
            if (DUPLICATE_PROTECTION_ENABLED && isRecentDuplicateFollowup(chatId, mensagemParaEnviar)) {
              console.log(`🚫 Mensagem duplicada detectada para follow-up ${chatId}, pulando envio`);
              continue; // Pula este follow-up
            }

            // Divide a mensagem usando o mesmo sistema do disparo
            const mensagensDivididas = splitMessages(mensagemParaEnviar);
            console.log(`[dispararFollowupsAgendados] Mensagens divididas:`, mensagensDivididas);

            // Verifica se já está enviando mensagens para evitar conflitos
            const isCurrentlySending = getIsSendingMessages();
            if (await isCurrentlySending) {
                console.log(`[dispararFollowupsAgendados] Sistema já está enviando mensagens, aguardando conclusão...`);
            }

            if (mensagensDivididas.length === 0) {
                console.log(`[dispararFollowupsAgendados] Nenhuma mensagem para enviar após divisão`);
                await client.sendText(chatId, mensagemParaEnviar);
                console.log(((`[dispararFollowupsAgendados] Mensagem enviada diretamente (fallback) para ${chatId}.`)));
            } else {
                try {
                    console.log(`[dispararFollowupsAgendados] Iniciando sendMessagesWithDelay`);
                    await sendMessagesWithDelay({
                        messages: mensagensDivididas,
                        client: client,
                        targetNumber: chatId,
                        __dirname: clientePath,
                        clienteIdCompleto: clientePath,
                        clientePath: clientePath,
                        logger: { info: (msg: string) => console.log(`[FollowUp] ${msg}`), error: (msg: string) => console.error(`[FollowUp ERROR] ${msg}`) }
                    });
                    console.log(`[dispararFollowupsAgendados] sendMessagesWithDelay concluído com sucesso`);
                } catch (error) {
                    console.error(`[dispararFollowupsAgendados] Erro no sendMessagesWithDelay:`, error);
                    console.log(`[dispararFollowupsAgendados] Usando método direto`);
                    // Fallback para o método direto
                    await client.sendText(chatId, mensagemParaEnviar);
                    console.log(((`[dispararFollowupsAgendados] Mensagem enviada (fallback) para ${chatId}.`)));
                }
            }

            // Verifica se tem gatilhos para enviar junto da mensagem
            await processTriggers(client, chatId, mensagemParaEnviar, __dirname);

           // ✅ Registrar follow-up no sistema de relatórios (não usar await para não interromper fila)
           try {
             registrarFollowUp(clientePath, {
               data: new Date().toISOString(),
               numeroTelefone: chatId.split('@')[0],
               status: true,
               etapaAquecimento: 0, // Follow-ups não usam aquecimento
               quantidadeDisparada: 1,
               limiteDiario: regras?.QUANTIDADE_LIMITE || 100,
               tipo: 'followup',
               listaNome: 'Follow-up'
             });
             console.log(((`[dispararFollowupsAgendados] Follow-up registrado no sistema de relatórios.`)));
           } catch (registroError) {
             console.error(`[dispararFollowupsAgendados] Erro ao registrar follow-up:`, registroError);
           }

           // Atualiza o updateLastSentMessageDate no dados.json
           // Atualiza a data da última mensagem enviada diretamente no objeto dados
           dados.data_ultima_mensagem_enviada = new Date().toISOString();
           console.log(((`[dispararFollowupsAgendados] data_ultima_mensagem_enviada atualizada para ${chatId}.`)));

           // Salva a mensagem no histórico
           await saveMessageToFile(clientePath, chatId, mensagemParaEnviar, 'IA');
           console.log(((`[dispararFollowupsAgendados] Histórico local salvo para ${chatId}.`)));

           // Atualiza o nível de follow-up
           const proximoNivel = nivelAtual + 1;
           dados.nivel_followup = proximoNivel.toString();

           // 🔄 SALVAR NO SQLITE (sincronização automática)
           const clientId = clienteIdCompleto;
           try {
             await syncManager.saveClientData(clientId, {
               followups: followups,
               chats: { [chatId]: dados }
             });
             console.log(`[Disparo Followup] Dados salvos no SQLite para ${clientId}`);
           } catch (sqliteError) {
             console.error(`[Disparo Followup] Erro ao salvar no SQLite:`, sqliteError);
             // Continua com o salvamento JSON mesmo se SQLite falhar
           }

           // 📄 SALVAR NO JSON (manter funcionalidade original)
           await fs.writeFile(dadosFilePath, JSON.stringify(dados, null, 2), 'utf-8');

           // 🔄 SALVAR NO SQLITE (sincronização automática) - followups atualizados
           try {
             await syncManager.saveClientData(clientId, {
               followups: followups
             });
             console.log(`[Disparo Followup] Followups salvos no SQLite para ${clientId}`);
           } catch (sqliteError) {
             console.error(`[Disparo Followup] Erro ao salvar followups no SQLite:`, sqliteError);
             // Continua mesmo se SQLite falhar
           }

           // ✅ NOVO: Atualiza o nível de follow-up usando função segura
           await updateFollowUpEntry(clientePath, chatId, proximoNivel);

        } catch (sendError) {
          console.log(`[dispararFollowupsAgendados] Erro ao enviar mensagem para ${chatId}:`, sendError);
        }
      } else {
        console.warn(((`[dispararFollowupsAgendados] Nenhuma mensagem para enviar para ${chatId}. Pulando disparo.`)));
      }
    }
  } catch (error) {
    console.log('[dispararFollowupsAgendados] Erro geral ao verificar e disparar followups:', error);
  }
};

function diaDaSemanaValido(diaInicial: string, diaFinal: string): boolean {
  const diasDaSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const hoje = getDay(new Date());

  const indexDiaInicial = diasDaSemana.indexOf(diaInicial.toLowerCase());
  const indexDiaFinal = diasDaSemana.indexOf(diaFinal.toLowerCase());

  if (indexDiaInicial === -1 || indexDiaFinal === -1) {
    console.log("Dias inicial ou final inválidos nas regras de disparo.");
    return false;
  }

  if (indexDiaInicial <= indexDiaFinal) {
    return hoje >= indexDiaInicial && hoje <= indexDiaFinal;
  } else {
    return hoje >= indexDiaInicial || hoje <= indexDiaFinal;
  }
}

async function dentroDoHorario(horarioInicial: string, horarioFinal: string): Promise<boolean> {
  const agora = new Date();
  const inicio = new Date(agora);
  const fim = new Date(agora);

  let [horaInicialNum, minutoInicialNum] = horarioInicial.split(':').map(Number);
  let [horaFinalNum, minutoFinalNum] = horarioFinal.split(':').map(Number);

  inicio.setHours(horaInicialNum, minutoInicialNum, 0, 0);
  fim.setHours(horaFinalNum, minutoFinalNum, 59, 999);

  if (fim < inicio) {
    return agora >= inicio || agora <= fim;
  } else {
    return agora >= inicio && agora <= fim;
  }
}

async function readLocalConversationHistory(clientePath: string, chatId: string): Promise<string> {
    const filePath = path.join(clientePath, `Chats`, `Historico`, chatId, `${chatId}.json`);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const messagesFromFile = JSON.parse(fileContent);
        if (Array.isArray(messagesFromFile)) {
            return messagesFromFile.map(m => `${m.type}: ${m.message}`).join('\n');
        }
        console.warn(((`[readLocalConversationHistory] Conteúdo de ${filePath} não é um array de mensagens.`)));
        return '';
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(((`[readLocalConversationHistory] Arquivo de histórico local não encontrado em ${filePath}.`)));
            return '';
        }
        console.log(`[readLocalConversationHistory] Erro ao ler histórico local ${filePath}:`, error);
        return '';
    }
}

async function saveMessageToFile(clientePath: string, chatId: string, message: string, type: `User` | `IA`) {
  const chatDir = path.join( clientePath, `Chats`, `Historico`, chatId);
  const fileName = `${chatId}.json`;
  const filePath = path.join(clientePath, `Chats`, `Historico`, `${chatId}`, `${chatId}.json`);

  try {
    await fs.mkdir(chatDir, { recursive: true });

    const dadosFilePath = path.join( clientePath, `Chats`, `Historico`, `${chatId}`, `Dados.json`);
    if (!fsSync.existsSync(dadosFilePath)) {
      console.log(`Criando arquivo Dados.json para o chatId:`, chatId);
      await fs.writeFile(dadosFilePath, `{}`, `utf-8`);
    }

    const now = new Date();
    const date = now.toLocaleDateString(`pt-BR`);
    const time = now.toLocaleTimeString(`pt-BR`, { hour: `2-digit`, minute: `2-digit`, second: `2-digit` });

    const messageData = {
      date: date,
      time: time,
      type: type,
      message: message,
    };

    let messages: any[] = [];
    if (fsSync.existsSync(filePath)) {
      try {
          const fileContent = await fs.readFile(filePath, `utf-8`);
          messages = JSON.parse(fileContent);
          if (!Array.isArray(messages)) {
              console.warn(((`Conteúdo de ${filePath} não era um array, resetando.`)));
              messages = [];
          }
      } catch (e) {
          console.log(`Erro ao ler/parsear ${filePath}, resetando. Erro: ${e}`);
          messages = [];
      }
    }

    messages.push(messageData);

    try {
      await fs.writeFile(filePath, JSON.stringify(messages, null, 2), `utf-8`);
    } catch (e) {
        console.log(`Erro ao escrever em ${filePath}: ${e}`);
    }
  } catch (dirError) {
      console.log(`Erro ao criar diretório ou arquivo para chatId ${chatId}:`, dirError);
  }
}

/**
 * Verifica o limite diário compartilhado entre disparo e follow-up
 */
async function verificarLimiteDiarioCompartilhado(clienteId: string, regras: any): Promise<{ podeEnviar: boolean; mensagensEnviadasHoje: number; limiteDiario: number }> {
  try {
    const clientePath = getPasta(clienteId);
    const hoje = new Date().toLocaleDateString('pt-BR', { dateStyle: 'short' });

    // Conta mensagens de listas (disparo normal)
    let mensagensListasHoje = 0;
    const listasConfigPath = path.join(clientePath, 'config', 'listas');

    if (fsSync.existsSync(listasConfigPath)) {
      const arquivosLista = fsSync.readdirSync(listasConfigPath).filter(file => file.toLowerCase().endsWith('.json'));
      for (const arquivoLista of arquivosLista) {
        const listaFilePath = path.join(listasConfigPath, arquivoLista);
        try {
          const listaContent = fsSync.readFileSync(listaFilePath, 'utf8');
          const lista = JSON.parse(listaContent);
          if (Array.isArray(lista.contatos)) {
            mensagensListasHoje += lista.contatos.filter((c: any) =>
              c.disparo === "sim" && c.data_1_contato?.startsWith(hoje)
            ).length;
          }
        } catch { /* Ignora erros */ }
      }
    }

    // Conta mensagens de follow-up (arquivo de relatórios)
    let mensagensFollowupHoje = 0;
    const relatoriosPath = path.join(clientePath, 'config', 'relatorios', 'disparos.json');

    if (fsSync.existsSync(relatoriosPath)) {
      try {
        const relatoriosContent = fsSync.readFileSync(relatoriosPath, 'utf8');
        const relatorios = JSON.parse(relatoriosContent);

        if (Array.isArray(relatorios)) {
          mensagensFollowupHoje = relatorios.filter((r: any) => {
            if (r.tipo !== 'followup') return false;

            const dataRegistro = r.data ? new Date(r.data).toLocaleDateString('pt-BR', { dateStyle: 'short' }) : '';
            return dataRegistro === hoje;
          }).length;
        }
      } catch { /* Ignora erros */ }
    }

    const mensagensEnviadasHoje = mensagensListasHoje + mensagensFollowupHoje;
    const limiteDiario = regras?.QUANTIDADE_LIMITE || 100;

    const podeEnviar = mensagensEnviadasHoje < limiteDiario;

    console.log(`[Limite Compartilhado] ${clienteId}: ${mensagensEnviadasHoje}/${limiteDiario} mensagens hoje (Listas: ${mensagensListasHoje}, Follow-up: ${mensagensFollowupHoje})`);

    return {
      podeEnviar,
      mensagensEnviadasHoje,
      limiteDiario
    };

  } catch (error) {
    console.error(`[Limite Compartilhado] Erro ao verificar limite para ${clienteId}:`, error);
    return {
      podeEnviar: true, // Em caso de erro, permite envio
      mensagensEnviadasHoje: 0,
      limiteDiario: regras?.QUANTIDADE_LIMITE || 100
    };
  }
}
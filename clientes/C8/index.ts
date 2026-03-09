import wppconnect from '@wppconnect-team/wppconnect';
import { initializeNewAIChatSession } from '../../src/backend/service/openai.ts';
import { splitMessages, sendMessagesWithDelay, setCancelCurrentSending, getIsSendingMessages, handleMessageSplitting } from '../../src/backend/util/index.ts';
import { generateQRCode } from './config/qrcode.ts';
import logger from '../../src/backend/util/logger.ts';
import { mainGoogleBG } from '../../src/backend/service/googleBG.ts';
import { mainGoogleChat } from '../../src/backend/service/googlechat.ts';
import { syncManager } from '../../src/database/sync.ts';
import fs from 'node:fs';
import os from 'node:os';
import path, { resolve } from 'node:path';
import { dispararMensagens, getPasta, saveMessageToFile } from '../../src/backend/disparo/disparo.ts'; // Importando as funções
import { dispararFollowupsAgendados } from '../../src/backend/followup/disparoFollowup.ts'; // Importar a nova função
import { checkResposta } from '../../src/backend/service/automacoes/checkResposta.ts';
import { fileURLToPath } from 'node:url';
import { IgnoreLead, verificarChatBloqueado } from '../../src/backend/service/braim/stop.ts';
import { agendarLimpezaBloqueios } from '../../src/backend/service/braim/limpezaBloqueios.ts';
import { setTimeout, clearTimeout } from 'timers';
import { monitorarConversa } from '../../src/backend/analiseConversa/monitoramentoConversa.ts';
import { updateLastReceivedMessageDate, updateLastSentMessageDate, cleanChatId } from '../../src/backend/util/chatDataUtils.ts';
import { iniciarAgendamentoRelatorios } from '../../src/backend/relatorio/agendadorRelatorios.ts';

let geminiKeyIndex = 0;
async function tryGeminiWithRotation(prompt: string, chatId: string, clearHistory: boolean, __dirname: string): Promise<string> {
  const geminiKeys = [infoConfig.GEMINI_KEY, ...(infoConfig.GEMINI_KEY_RESERVA || [])];
  let lastError = null;

  for (let i = 0; i < geminiKeys.length; i++) {
    const key = geminiKeys[geminiKeyIndex % geminiKeys.length];
    geminiKeyIndex++;

    try {
      GEMINI_KEY = key.trim(); // Atualiza a chave global
      const response = await mainGoogleBG({ currentMessageBG: `${prompt}\n\n`, chatId, clearHistory, __dirname });
      return response;
    } catch (error: any) {
      logger.warn(`Tentativa com chave Gemini ${i + 1} falhou: ${error.message}`);
      lastError = error;
    }
  }

  logger.error(`Todas as chaves Gemini falharam: ${lastError}`);
  throw lastError; // Propaga o último erro
}

interface Contato {
  id: string;
  telefone: string;
  nome: string;
  clientId: string;
}
// Interfaces
interface ChatIdObject { // Renomeado para evitar conflito com variável chatId
  user: string;
}

interface MessageBufferEntry {
  messages: string[];
  answered: boolean;
}

// Type guard para verificar se é um objeto ChatIdObject
function isChatIdObject(value: unknown): value is ChatIdObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    'user' in value &&
    typeof (value as ChatIdObject).user === 'string'
  );
}

// Função formatChatId com type guard
function formatChatId(chatIdInput: string | ChatIdObject | unknown): string {
  if (isChatIdObject(chatIdInput)) {
    return chatIdInput.user;
  }
  if (typeof chatIdInput === 'string') {
    return chatIdInput.split('@')[0];
  }
  return String(chatIdInput);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



type AIOption = `GPT` | `GEMINI`;

const MESSAGE_BUFFER_FILE_PATH = path.join(__dirname, './config/messageBuffer.json');

// Carrega o buffer de mensagens do arquivo ao iniciar
let messageBufferPerChatId: Map<string, MessageBufferEntry[]> = new Map(); // Usa a interface
loadMessageBuffer();
const messageTimeouts = new Map<string, NodeJS.Timeout>();

// ✅ NOVO: Sistema de controle de duplicação seguro (backward compatible)
const DUPLICATE_PROTECTION_ENABLED = true;
const recentMessagesCache = new Map<string, { message: string; timestamp: number }[]>();
const CACHE_DURATION = 30000; // 30 segundos
const MAX_CACHED_MESSAGES = 5;

// ✅ NOVO: Controle de validações BG simultâneas (backward compatible)
const activeValidations = new Set<string>();
const VALIDATION_TIMEOUT = 10000; // 10 segundos máximo por validação

// Carrega as configurações de infoCliente.json
const infoPath = path.join(__dirname, 'config', 'infoCliente.json');
const infoConfig = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

// Extrai o clientId direto baseado no infoCliente.json (ex: 'C8')
// Usa o campo 'id' para o caminho da pasta, e 'CLIENTE' para display
const clienteIdCompleto = (() => {
    // Primeiro tenta usar o campo 'id' que é o identificador da pasta
    const clientId = infoConfig.id || '';
    if (clientId) {
        return clientId; // Retorna o ID do cliente (ex: 'C8')
    }
    // Fallback: se não tiver 'id', tenta usar o nome da pasta
    const pastaNome = path.basename(__dirname);
    if (pastaNome && pastaNome !== 'C8') {
        return pastaNome;
    }
    logger.error("Não foi possível determinar o clientId a partir do infoCliente.json");
    return null; // Retorna null se não conseguir determinar
})();

// Cria uma função para determinar o diretório correto do cliente (agora direto)
function getClienteDir(clientId: string): string {
    // clientId agora é apenas o nome do cliente (ex: "CMW")
    return path.join(process.cwd(), 'clientes', clientId);
}


const cliente = infoConfig.CLIENTE || '';
const AI_SELECTED: AIOption = infoConfig.AI_SELECTED || `GEMINI`;
const TARGET_CHAT_ID = infoConfig.TARGET_CHAT_ID || ``;
let GEMINI_KEY = infoConfig.GEMINI_KEY || ``;

logger.info(`Cliente ID Completo: ${clienteIdCompleto}`);
logger.info(`Cliente (Nome): ${cliente}`);
logger.info(`AI Selected: ${AI_SELECTED}`);
logger.info(`Target Chat ID: ${TARGET_CHAT_ID}`);
logger.info(`Gemini Key: ${GEMINI_KEY}`);

// Substitui getCliente para usar infoConfig
export const getCliente = (): string => {
  return infoConfig.CLIENTE || '';
};
const clientePath = __dirname;

logger.info(`Pasta cliente: ${clientePath}`);

// Configuração para retentativas
const MAX_RETRIES_START = 300; // Número máximo de retentativas para nome
const MAX_RETRIES_NAME = 10; // Número máximo de retentativas para nome
const MAX_RETRIES_INTEREST = 10; // Número máximo de retentativas para interesse
const MAX_RETRIES_ORÇAMENTO = 10; // Número máximo de retentativas para orçamento
const MAX_RETRIES_RESUMO = 10; // Número máximo de retentativas para orçamento
const MAX_RETRIES_LEAD = 5; // Definido aqui para uso em makeRequestWithRetryLead
const INITIAL_BACKOFF_MS = 1000 * Math.random() * (20 - 1) + 5; // Tempo de espera inicial em milissegundos

let leadCount = 1; // Contador de leads

if (AI_SELECTED === `GEMINI` && !GEMINI_KEY) {
  throw Error(
    `Você precisa colocar uma key do Gemini no .env! Crie uma gratuitamente em https://aistudio.google.com/app/apikey?hl=pt-br`
  );
}

if (
  AI_SELECTED === `GPT` &&
  (!infoConfig.OPENAI_KEY || !infoConfig.OPENAI_ASSISTANT)
) {
  throw Error(
    `Para utilizar o GPT você precisa colocar no .env a sua key da openai e o id do seu assistente.`
  );
}

// Função para atualizar o arquivo .env
// Função para atualizar infoCliente.json
async function updateInfoCliente(key: string, value: any) {
  try {
    const infoPath = path.join(__dirname, 'config', 'infoCliente.json');
    let infoConfig = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    infoConfig[key] = value;

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    try {
      if (clienteIdCompleto) {
        await syncManager.saveClientData(clienteIdCompleto, {
          infoCliente: infoConfig
        });
        console.log(`[CMW/Index] infoCliente salvo no SQLite para ${clienteIdCompleto}`);
      } else {
        console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
      }
    } catch (sqliteError) {
      console.error(`[CMW/Index] Erro ao salvar infoCliente no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    fs.writeFileSync(infoPath, JSON.stringify(infoConfig, null, 2), 'utf-8');
    logger.info(`Chave "${key}" atualizada em infoCliente.json.`);
  } catch (error) {
    logger.error(`Erro ao atualizar infoCliente.json:`, error);
  }
}

// --- FUNÇÕES AUXILIARES GERAIS (FORA DE START) ---

// Adiciona client como primeiro parâmetro
async function getMessages(client: wppconnect.Whatsapp, chatId: string, getMessagesParam = {}): Promise<any> {
  return client.getMessages(chatId, getMessagesParam);
}

/**
* Refatorado: Verifica/cria contato principal, verifica/cria lead do cliente e inicia timer. (Definição Única)
*/

async function findOrCreateContatoPrincipal(telefone: string, nome: string, clientId: string): Promise<{ id: string; isNovo: boolean }> {
    const filePath = path.join(__dirname, 'config', 'contatos.json');
    let contatos: Contato[] = [];
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        if (data) {
            try {
                contatos = JSON.parse(data);
            } catch (error) {
                logger.error('Erro ao analisar o arquivo contatos.json, resetando arquivo:', error);
                contatos = [];
                fs.writeFileSync(filePath, JSON.stringify(contatos, null, 2), 'utf-8');
            }
        }
    } else {
        // Cria o arquivo se ele não existir
        fs.writeFileSync(filePath, JSON.stringify(contatos, null, 2), 'utf-8');
        logger.info(`Arquivo ${filePath} criado.`);
    }

    let contato = contatos.find((c: any) => c.telefone === telefone);
    if (contato) {
        return { id: contato.id, isNovo: false };
    } else {
        const novoContato = { id: Math.random().toString(36).substring(2, 15), telefone, nome, clientId };
        contatos.push(novoContato);

        // 🔄 SALVAR NO SQLITE (sincronização automática)
        try {
          if (clienteIdCompleto) {
            await syncManager.saveClientData(clienteIdCompleto, {
              contatos: contatos
            });
            console.log(`[CMW/Index] Contatos salvos no SQLite para ${clienteIdCompleto}`);
          } else {
            console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
          }
        } catch (sqliteError) {
          console.error(`[CMW/Index] Erro ao salvar contatos no SQLite:`, sqliteError);
          // Continua com o salvamento JSON mesmo se SQLite falhar
        }

        // 📄 SALVAR NO JSON (manter funcionalidade original)
        fs.writeFileSync(filePath, JSON.stringify(contatos, null, 2), 'utf-8');
        return { id: novoContato.id, isNovo: true };
    }
}

async function findLeadByChatId(clientId: string, chatId: string): Promise<any | undefined> {
    const filePath = path.join(__dirname, 'config', 'leads.json');
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        if (data && data.trim()) {
            try {
                const leadsData = JSON.parse(data);
                // Verifica se é um array (estrutura nova) ou objeto (estrutura antiga)
                const leads = Array.isArray(leadsData) ? leadsData : [];

                if (leads.length > 0) {
                    return leads.find((lead: any) => lead.chatId === chatId && lead.clientId === clientId);
                }
            } catch (error) {
                logger.error('Erro ao analisar o arquivo leads.json, resetando arquivo:', error);
                return undefined;
            }
        }
    } else {
        // Cria o arquivo se ele não existir
        fs.writeFileSync(filePath, '[]', 'utf-8');
        logger.info(`Arquivo ${filePath} criado.`);
        return undefined;
    }
    return undefined;
}

async function saveLead(contatoId: string, leadData: any): Promise<any | undefined> {
     const filePath = path.join(__dirname, 'config', 'leads.json');
     let leadsData: any = {};

     try {
         if (fs.existsSync(filePath)) {
             const data = fs.readFileSync(filePath, 'utf-8');
             if (data) leadsData = JSON.parse(data);
         }
     } catch (error) {
         logger.error(`Erro ao ler ou analisar ${filePath}, um novo arquivo será criado.`, error);
         leadsData = {};
     }

     const now = new Date();
     const year = now.getFullYear().toString();
     const month = (now.getMonth() + 1).toString().padStart(2, '0');
     const day = now.getDate().toString().padStart(2, '0');

     // Garante que a estrutura aninhada exista
     if (!leadsData[year]) leadsData[year] = {};
     if (!leadsData[year][month]) leadsData[year][month] = {};
     if (!leadsData[year][month][day]) leadsData[year][month][day] = [];

     const newLead = {
       id: Math.random().toString(36).substring(2, 15),
       clientId: infoConfig.CLIENTE, // Usa o nome do cliente do config
       contatoId,
       ...leadData,
       tipoLead: 'Novo Lead', // Campo para diferenciar Novo Lead vs Nova Conversão
       timestampIdentificacao: now.toISOString(),
       dataGeracaoLead: now.toLocaleString('pt-BR', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit'
       }),
       dataNotificacaoLead: null, // Será preenchido quando a notificação for enviada
     };

     leadsData[year][month][day].push(newLead);

     // 🔄 SALVAR NO SQLITE (sincronização automática)
     try {
       if (clienteIdCompleto) {
         await syncManager.saveClientData(clienteIdCompleto, {
           leads: leadsData
         });
         console.log(`[CMW/Index] Leads salvos no SQLite para ${clienteIdCompleto}`);
       } else {
         console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
       }
     } catch (sqliteError) {
       console.error(`[CMW/Index] Erro ao salvar leads no SQLite:`, sqliteError);
       // Continua com o salvamento JSON mesmo se SQLite falhar
     }

     try {
         // 📄 SALVAR NO JSON (manter funcionalidade original)
         fs.writeFileSync(filePath, JSON.stringify(leadsData, null, 2), 'utf-8');
         logger.info(`Novo lead salvo em ${filePath} com ID: ${newLead.id}`);
         return newLead;
     } catch (error) {
         logger.error(`Erro ao salvar o arquivo leads.json em ${filePath}:`, error);
         return undefined;
     }
}

async function updateLeadSummary(clientId: string, leadId: string, contatoId: string, summary: string): Promise<boolean> {
    const filePath = path.join(__dirname, 'config', 'leads.json');
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        if (data) {
            try {
                const leads = JSON.parse(data);
                const leadIndex = leads.findIndex((lead: any) => lead.id === leadId && lead.clientId === clientId);
                if (leadIndex !== -1) {
                   leads[leadIndex].summary = summary;

                   // 🔄 SALVAR NO SQLITE (sincronização automática)
                   try {
                     if (clienteIdCompleto) {
                       await syncManager.saveClientData(clienteIdCompleto, {
                         leads: leads
                       });
                       console.log(`[CMW/Index] Leads atualizados no SQLite para ${clienteIdCompleto}`);
                     } else {
                       console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
                     }
                   } catch (sqliteError) {
                     console.error(`[CMW/Index] Erro ao salvar leads no SQLite:`, sqliteError);
                     // Continua com o salvamento JSON mesmo se SQLite falhar
                   }

                    try {
                       // 📄 SALVAR NO JSON (manter funcionalidade original)
                       fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf-8');
                    } catch (error) {
                       logger.error('Erro ao salvar o arquivo leads.json:', error);
                       return false;
                    }
                   return true;
                } else {
                   logger.warn(`Lead com ID ${leadId} não encontrado para o cliente ${clientId}.`);
                   return false;
                }
            } catch (error) {
                logger.error('Erro ao analisar o arquivo leads.json:', error);
                return false;
            }
        }
    }
    return false;
}


async function saveChatMessage(clienteIdCompleto: string, chatId: string, messageData: any, clientePath: string): Promise<void> {
  // ✅ NOVO: Filtrar prompts internos para não salvar no histórico
  const internalPromptKeywords = [
      'CRITÉRIOS DE VALIDAÇÃO',
      'Gere APENAS',
      'Responda APENAS com JSON',
      'AVALIAÇÃO - Responda APENAS',
      'Analise a seguinte mensagem',
      'Identifique se há um agendamento',
      'Você é um analista de vendas',
      'ANALISE CRÍTICA DE RESPOSTA',
      'reestruture a mensagem'
  ];

  const messageString = typeof messageData === 'string' ? messageData : JSON.stringify(messageData);
  const isInternalPrompt = internalPromptKeywords.some(keyword => messageString.includes(keyword));

  if (isInternalPrompt) {
      logger.debug(`[saveChatMessage] Prompt interno detectado para ${chatId}, não salvando no histórico`);
      return; // Não salva prompts internos
  }
  const chatIdFormatted = cleanChatId(chatId).replace(/@c\.us$/, '');
  const dirPath = path.join(__dirname, 'Chats', 'Historico', `${chatIdFormatted}@c.us`);
   const filePathChat = path.join(dirPath, `${chatIdFormatted}.json`);
   const filePathDados = path.join(dirPath, 'dados.json');
   let messages = [];

   // Cria o diretório se não existir
   if (!fs.existsSync(dirPath)) {
       fs.mkdirSync(dirPath, { recursive: true });
   }

   // Salva no arquivo de chat

   if (fs.existsSync(filePathChat)) {
       const data = fs.readFileSync(filePathChat, 'utf-8');
       if (data) {
           try {
               messages = JSON.parse(data);
           } catch (error) {
               logger.error('Erro ao analisar o arquivo de histórico de mensagens:', error);
           }
       }
   }

   messages.push(messageData);

   // 🔄 SALVAR NO SQLITE (sincronização automática) - apenas para chats
   try {
     if (clienteIdCompleto) {
       await syncManager.saveClientData(clienteIdCompleto, {
         chats: {
           historico: {
             [chatId]: {
               [chatId]: messages
             }
           }
         }
       });
       console.log(`[CMW/Index] Chat salvo no SQLite para ${clienteIdCompleto}`);
     } else {
       console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
     }
   } catch (sqliteError) {
     console.error(`[CMW/Index] Erro ao salvar chat no SQLite:`, sqliteError);
     // Continua com o salvamento JSON mesmo se SQLite falhar
   }

   // 📄 SALVAR NO JSON (manter funcionalidade original)
   fs.writeFileSync(filePathChat, JSON.stringify(messages, null, 2), 'utf-8');

   // Salva no arquivo de dados (Dados.json)
   // Verifica se o arquivo Dados.json existe
   if (!fs.existsSync(filePathDados)) {
       // Se não existir, cria um novo objeto com a estrutura desejada
       const initialData = {
           name: 'Não identificado',
           number: chatId.split('@')[0],
           tags: [],
           listaNome: null,
       };
       // 🔄 SALVAR NO SQLITE (sincronização automática) - Dados iniciais
       try {
         if (clienteIdCompleto) {
           await syncManager.saveClientData(clienteIdCompleto, {
             chats: {
               historico: {
                 [chatId]: {
                   Dados: initialData
                 }
               }
             }
           });
           console.log(`[CMW/Index] Dados iniciais salvos no SQLite para ${clienteIdCompleto}`);
         } else {
           console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
         }
       } catch (sqliteError) {
         console.error(`[CMW/Index] Erro ao salvar dados iniciais no SQLite:`, sqliteError);
         // Continua com o salvamento JSON mesmo se SQLite falhar
       }

       // 📄 SALVAR NO JSON (manter funcionalidade original)
       fs.writeFileSync(filePathDados, JSON.stringify(initialData, null, 2), 'utf-8');
   }
}

async function handleLeadIdentification(client: wppconnect.Whatsapp, clientId: string, chatId: string, nome: string, telefone: string, listaOrigemId: string | null = null, listaOrigemNome: string | null = null, tagsIniciais: string[] = []): Promise<any | null> {
    logger.info("Iniciando identificação de lead para cliente " + clientId + ", chatId: " + chatId);
     await notifyLeadIdentified(client, clientId, chatId, 'Início da identificação de lead', 'Início da identificação de lead');
    try {
        const { id: contatoId, isNovo: isNewContato } = await findOrCreateContatoPrincipal(telefone, nome, clientId);
        if (!contatoId) {
            throw new Error("Falha ao obter ID do contato principal.");
        }
        logger.info("Contato principal " + (isNewContato ? 'criado' : 'encontrado') + ": " + contatoId);

        const existingLead = await findLeadByChatId(clientId, chatId);

        if (existingLead) {
            logger.info("Lead " + existingLead.id + " já existe para chatId: " + chatId + ".");
            return existingLead;
        }

        logger.info("Lead não encontrado para " + chatId + " neste cliente. Salvando novo lead...");
        const leadData = {
            chatId: chatId,
            nome: nome || 'Não identificado',
            telefone: telefone || chatId.split('@')[0],
            origem: listaOrigemNome || 'Contato Direto',
            tags: tagsIniciais,
        };

        // const newLeadId = await saveLead(contatoId, leadData);
        // if (newLeadId) {
        //    logger.info("Novo lead salvo com ID: " + newLeadId);
        //    // Retorna o objeto do lead recém-criado para a notificação
        //    return await findLeadByChatId(clientId, chatId);
        //} else {
        //    logger.error("Falha ao salvar novo lead para chatId: " + chatId);
        //    return null;
        //}
    } catch (error) {
        logger.error("Erro em handleLeadIdentification para " + chatId + ":", error);
        return null;
    }
}


async function notifyLeadIdentified(client: wppconnect.Whatsapp, clientId: string, chatId: string, leadId: string, summary: string) {
  try {
    if (TARGET_CHAT_ID) {
      const nomeClienteSimples = clienteIdCompleto || path.basename(clientePath);
      const leadAtualizado = await findLeadByChatId(clientId, chatId);
      const dadosFilePath = path.join(__dirname, 'Chats', 'Historico', chatId, 'Dados.json');
      const dadosFileContent = fs.readFileSync(dadosFilePath, 'utf-8');
      const dados = JSON.parse(dadosFileContent);

      // Adiciona data de notificação ao lead
      const now = new Date();
      if (leadAtualizado) {
        leadAtualizado.dataNotificacaoLead = now.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        // Atualiza o lead no arquivo
        await updateLeadSummary(clientId, leadAtualizado.id, leadAtualizado.contatoId, summary);
      }

      const tipoLeadDisplay = leadAtualizado?.tipoLead || 'Novo Lead';
      const insights = gerarInsightsParaLead(leadAtualizado);

      const mensagemNotificacao = `�� *${tipoLeadDisplay} Identificado!* ��\n\n` +
        `*Cliente:* ${nomeClienteSimples}\n` +
        `*Nome:* ${dados.name || 'Não identificado'}\n` +
        `*Telefone:* ${leadAtualizado?.telefone || chatId.split('@')[0]}\n` +
        `*Interesse:* ${dados.interesse || 'Não especificado'}\n` +
        `*Lead Score:* ${dados.leadScore || 'N/A'}/10\n` +
        `*Etapa do Funil:* ${dados.etapaFunil || 'Não identificada'}\n` +
        `*Tags:* ${dados.tags?.join(', ') || 'Nenhuma'}\n` +
        (leadAtualizado?.origem ? `*Origem:* ${leadAtualizado.origem}\n` : '') +
        `*Data de Identificação:* ${new Date(leadAtualizado?.timestampIdentificacao || Date.now()).toLocaleDateString('pt-BR')} ${new Date(leadAtualizado?.timestampIdentificacao || Date.now()).toLocaleTimeString('pt-BR')}\n\n` +
        `*📋 Resumo da Conversa:*\n${summary || 'Resumo não gerado.'}\n\n` +
        `*🎯 Insights para Abordagem:*\n${insights}`;

      logger.info(`Enviando notificação de novo lead para ${TARGET_CHAT_ID}`);
      await sendMessage(client, clientePath, TARGET_CHAT_ID, mensagemNotificacao);
      logger.info(`Notificação de novo lead enviada com sucesso para ${chatId}`);
    } else {
      logger.warn(`TARGET_CHAT_ID não configurado. Notificação de novo lead não enviada.`);
    }
  } catch (error) {
    logger.error(`Erro ao notificar novo lead para ${chatId}:`, error);
  }
}

/**
 * Nova função para notificar leads qualificados com informações completas
 */
async function notifyLeadQualificado(client: wppconnect.Whatsapp, clientId: string, chatId: string, analise: any, lead: any) {
  try {
    if (TARGET_CHAT_ID) {
      const nomeClienteSimples = cliente; // Usa o nome do cliente do config
      const nomePastaCliente = path.basename(clientePath);
      const tipoLead = analise.detalhes_agendamento?.[0]?.agendamento_identificado ? '🔥 LEAD QUENTE' : '⚡ LEAD MORNO';

      logger.info(`[notifyLeadQualificado] Enviando notificação para cliente: ${nomeClienteSimples} (pasta: ${nomePastaCliente})`);

      const mensagemNotificacao = `🎯 *Lead Qualificado Identificado!* 🎯\n\n` +
        `*Cliente:* ${nomeClienteSimples}\n` +
        `*Tipo de Lead:* ${tipoLead}\n` +
        `*Nome:* ${analise.nome || 'Não identificado'}\n` +
        `*Telefone:* ${chatId.split('@')[0]}\n` +
        `*Interesse:* ${analise.interesse || 'Não especificado'}\n` +
        `*Lead Score:* ${analise.leadScore}/10\n` +
        `*Etapa do Funil:* ${analise.etapaFunil || 'Não identificada'}\n` +
        `*Tags:* ${analise.tags?.join(', ') || 'Nenhuma'}\n` +
        `*Data de Identificação:* ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n` +
        `*📋 Resumo da Conversa:*\n${analise.resumoParaAtendente || 'Resumo não gerado.'}\n\n` +
        `*🎯 Insights para Abordagem:*\n${gerarInsightsParaLead(analise)}`;

      logger.info(`🚀 Enviando notificação de lead qualificado para ${TARGET_CHAT_ID} (cliente: ${nomeClienteSimples}, pasta: ${nomePastaCliente})`);
      await sendMessage(client, clientePath, TARGET_CHAT_ID, mensagemNotificacao);
      logger.info(`✅ Notificação de lead qualificado enviada com sucesso para ${chatId} (cliente: ${nomeClienteSimples})`);
    } else {
      logger.warn(`TARGET_CHAT_ID não configurado. Notificação de lead qualificado não enviada para cliente ${cliente}.`);
    }
  } catch (error) {
    logger.error(`Erro ao notificar lead qualificado para ${chatId}:`, error);
  }
}

/**
 * Gera insights personalizados para o lead
 */
function gerarInsightsParaLead(analise: any): string {
  const insights = [];

  if (analise.leadScore >= 8) {
    insights.push('• Lead com alta probabilidade de conversão');
    insights.push('• Recomenda-se contato imediato para não perder oportunidade');
  } else if (analise.leadScore >= 6) {
    insights.push('• Lead morno com bom potencial');
    insights.push('• Acompanhar nos próximos dias para amadurecer interesse');
  }

  if (analise.detalhes_agendamento?.[0]?.agendamento_identificado) {
    insights.push('• Cliente demonstrou interesse real marcando agendamento');
    insights.push('• Preparar apresentação detalhada do imóvel');
  }

  if (analise.tags?.includes('interesse-apartamento')) {
    insights.push('• Foco em benefícios de apartamentos (segurança, praticidade)');
  }

  if (analise.tags?.includes('interesse-casa')) {
    insights.push('• Foco em benefícios de casas (espaço, privacidade)');
  }

  if (analise.precisaAtendimentoHumano) {
    insights.push('• ⚠️ INTERVENÇÃO HUMANA NECESSÁRIA');
    insights.push('• Sistema automatizado não está sendo eficaz');
  }

  return insights.length > 0 ? insights.join('\n') : '• Analisar perfil do cliente para abordagem personalizada';
}


// Função formatChatId já definida no topo com type guard

// Funções de buffer local (mantidas)
function loadMessageBuffer() {
  try {
    if (fs.existsSync(MESSAGE_BUFFER_FILE_PATH)) {
      const data = fs.readFileSync(MESSAGE_BUFFER_FILE_PATH, 'utf-8');
      if (data && data.trim().startsWith('{') && data.trim().endsWith('}')) {
          messageBufferPerChatId = new Map(Object.entries(JSON.parse(data)));
      } else if (data) {
           logger.warn('Arquivo de buffer parece corrompido. Iniciando buffer vazio.');
           messageBufferPerChatId = new Map();
           fs.writeFileSync(MESSAGE_BUFFER_FILE_PATH, '{}', 'utf-8');
      } else {
           messageBufferPerChatId = new Map();
      }
    }
  } catch (error) {
    logger.error('Erro ao carregar o buffer de mensagens:', error);
    messageBufferPerChatId = new Map();
  }
}

function saveMessageBuffer() {
  try {
    const dataToSave: { [key: string]: MessageBufferEntry[] } = {}; // Adiciona tipo explícito
    messageBufferPerChatId.forEach((value, key) => {
      dataToSave[key] = value;
    });
    fs.writeFileSync(
      MESSAGE_BUFFER_FILE_PATH,
      JSON.stringify(dataToSave, null, 2),
      'utf-8'
    );
  } catch (error) {
    logger.error('Erro ao salvar o buffer de mensagens local:', error);
  }
}

// ✅ NOVO: Sistema de verificação de duplicatas seguro
function isRecentDuplicate(chatId: string, message: string): boolean {
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
      console.log(`🚫 Mensagem duplicada detectada para ${chatId}, ignorando envio`);
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
    console.error(`Erro na verificação de duplicata para ${chatId}:`, error);
    return false; // Em caso de erro, permite o envio
  }
}

// ✅ NOVO: Função para limpar cache periodicamente
function cleanupRecentMessagesCache() {
  if (!DUPLICATE_PROTECTION_ENABLED) return;

  try {
    const now = Date.now();
    for (const [chatId, messages] of recentMessagesCache.entries()) {
      const recentMessages = messages.filter(
        item => (now - item.timestamp) < CACHE_DURATION
      );

      if (recentMessages.length === 0) {
        recentMessagesCache.delete(chatId);
      } else {
        recentMessagesCache.set(chatId, recentMessages);
      }
    }
  } catch (error) {
    console.error('Erro na limpeza do cache de mensagens:', error);
  }
}

function markMessagesAsAnswered(chatId: string) {
    const messages = messageBufferPerChatId.get(chatId);
    if (messages) {
        messages.forEach(m => m.answered = true);
        saveMessageBuffer();
    }
}

// Função para remover emojis (mantida)
function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]/gu, ``) // Emoticons
               .replace(/[\u{1F300}-\u{1F5FF}]/gu, ``) // Símbolos e pictogramas
               .replace(/[\u{1F680}-\u{1F6FF}]/gu, ``) // Transporte e símbolos de mapa
               .replace(/[\u{1F700}-\u{1F77F}]/gu, ``) // Símbolos alfanuméricos
               .replace(/[\u{1F780}-\u{1F7FF}]/gu, ``) // Símbolos geométricos
               .replace(/[\u{1F800}-\u{1F8FF}]/gu, ``) // Símbolos suplementares
               .replace(/[\u{1F900}-\u{1F9FF}]/gu, ``) // Símbolos e pictogramas suplementares
               .replace(/[\u{1FA00}-\u{1FA6F}]/gu, ``) // Símbolos adicionais
               .replace(/[\u{1FA70}-\u{1FAFF}]/gu, ``) // Símbolos adicionais
               .replace(/[\u{2600}-\u{26FF}]/gu, ``)   // Diversos símbolos e pictogramas
               .replace(/[\u{2700}-\u{27BF}]/gu, ``);  // Dingbats
}

// Função para enviar mensagem (Definição Única e Exportada)
async function sendMessage(client: wppconnect.Whatsapp, clientePath: string, chatId: string, message: string) {
  try {
    await client.sendText(chatId, message);
    logger.info(`Mensagem enviada para ${chatId}: ${message}`);
    // Atualiza a data da última mensagem enviada
    await updateLastSentMessageDate(clientePath, chatId);
  } catch (error) {
    logger.error(`Erro ao enviar mensagem para ${chatId}:`, error);
  }
}
export { sendMessage };

// --- INICIALIZAÇÃO ---

// Verifica se o Chrome está instalado corretamente (Diagnóstico para Docker vs Nixpacks)
const chromePath = '/usr/bin/google-chrome-stable';
if (fs.existsSync(chromePath)) {
  logger.info(`[CMW] ✅ Google Chrome encontrado em: ${chromePath}`);
} else {
  logger.error(`[CMW] ❌ Google Chrome NÃO encontrado em: ${chromePath}`);
  logger.error(`[CMW] ⚠️ O sistema provavelmente está rodando via Nixpacks (Ubuntu) em vez do Dockerfile.`);
  logger.error(`[CMW] ⚠️ Configure o 'Build Pack' para 'Dockerfile' no Coolify para corrigir.`);
}

wppconnect
  .create({
    session: clienteIdCompleto || cliente, // Usa o ID do cliente (C8) para nome da sessão
    headless: `new` as any,
    autoClose: 0, // Desativa o auto-close para manter a sessão ativa
    puppeteerOptions: {
      protocolTimeout: 120000, // Aumenta o tempo limite do protocolo para 120 segundos
      args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--no-zygote'],
      executablePath: chromePath, // Usa a variável definida acima
    },
    catchQR: async (base64Qrimg, asciiQR, attempts, urlCode) => {
      logger.info(`Terminal qrcode: `, asciiQR);
      console.log(`[CMW] catchQR called with urlCode: ${urlCode}`);
      
      if (urlCode) {
        console.log(`[CMW] Updating QR_CODE in infoCliente.json`);
        await updateInfoCliente('QR_CODE', urlCode);
        
        try {
          console.log(`[CMW] Calling generateQRCode with urlCode: ${urlCode}`);
          const qrCodePath = await generateQRCode(urlCode);
          console.log(`[CMW] QR Code generated and saved at: ${qrCodePath}`);
          logger.info('QR Code gerado e salvo em:', qrCodePath);
        } catch (error) {
          console.error(`[CMW] Error generating QR Code:`, error);
          logger.error('Erro ao gerar QR Code:', error);
        }
      } else {
        console.log(`[CMW] No urlCode provided in catchQR`);
      }
    },
    statusFind: async (statusSession, session) => {
      logger.info(`Status Session: `, statusSession);
      logger.info(`Session name: `, session);
      if (statusSession) {
        await updateInfoCliente('STATUS_SESSION', statusSession);
        
        // Verifica se o status indica falha na autenticação ou sucesso
        if (statusSession === 'qrReadError' || statusSession === 'qrReadFail' || statusSession === 'inChat') {
          const qrcodePath = path.join(__dirname, 'config', 'qrcode', 'qrcode.png');

          // Verifica se o arquivo QR code existe antes de tentar apagar
          if (fs.existsSync(qrcodePath)) {
            try {
              fs.unlinkSync(qrcodePath);
              logger.info(`Arquivo QR code apagado: ${qrcodePath}`);
            } catch (error) {
              logger.error(`Erro ao apagar arquivo QR code ${qrcodePath}:`, error);
            }
          }

          // Apaga o estado.json para forçar para reiniciar o periodo de aquecimento
          const estadoPath = path.join(__dirname, 'config', 'estado.json');
          if (fs.existsSync(estadoPath)) {
            try {
              fs.unlinkSync(estadoPath);
              logger.info(`Arquivo estado.json apagado: ${estadoPath}`);
            } catch (error) {
              logger.error(`Erro ao apagar arquivo estado.json ${estadoPath}:`, error);
            }
          }
        }
      }
    }
  })
  .then(async client => { // Chama a função start passando o objeto client
    // Verifica se o cliente está conectado antes de chamar start
    if (client && typeof client.isConnected === 'function') {
      try {
        const isConnected = await client.isConnected();
        logger.info(`[WppConnect] Cliente conectado: ${isConnected}`);
        
        if (isConnected) {
          start(client);
        } else {
          logger.warn(`[WppConnect] Cliente não está conectado, tentando iniciar...`);
          start(client);
        }
      } catch (connError) {
        logger.warn(`[WppConnect] Erro ao verificar conexão: ${connError}, tentando iniciar...`);
        start(client);
      }
    } else {
      // Se não conseguir verificar conexão, tenta iniciar mesmo assim
      logger.warn(`[WppConnect] Cliente criado mas verificação de conexão não disponível`);
      start(client);
    }
  })
  .catch((erro: any) => {
    logger.error(`[WppConnect Error] Erro na inicialização do WppConnect:`, erro); // Log mais explícito no catch
    
    // Verifica se é especificamente o erro "Auto Close Called"
    const errorMessage = erro?.message || erro?.toString() || '';
    const isAutoCloseError = errorMessage.includes('Auto Close Called') ||
                            errorMessage.includes('auto close') ||
                            errorMessage.toLowerCase().includes('auto close');
    
    // Se for Auto Close, tenta iniciar mesmo assim (pode estar conectado)
    if (isAutoCloseError) {
      logger.warn(`[WppConnect] Auto Close detectado - tentando iniciar mesmo assim...`);
      // Não encerra a aplicação neste caso
      // O código pode continuar porque a sessão pode estar ativa
    } else {
      // Para outros tipos de erro, encerra a aplicação
      logger.error(`[WppConnect] Erro não relacionado ao Auto Close - encerrando`);
      
      // Atualiza status da sessão para indicar encerramento por erro
      const updateStatusAndExit = async () => {
        try {
          await updateInfoCliente('STATUS_SESSION', 'error');
          await updateInfoCliente('QR_CODE', null);
        } catch (updateError) {
          logger.error(`[WppConnect] Erro ao atualizar status antes do encerramento:`, updateError);
        } finally {
          setTimeout(() => {
            logger.info(`[WppConnect] Encerrando aplicação por erro`);
            process.exit(1);
          }, 2000);
        }
      };
      
      updateStatusAndExit();
    }
  });

  
// --- FUNÇÃO PRINCIPAL DE PROCESSAMENTO DE MENSAGENS ---
async function start(client: wppconnect.Whatsapp): Promise<void> {
  logger.info(`[Script Start] Função start iniciada.`); // Log no início da função start

  // Inicia o agendamento dos relatórios
  iniciarAgendamentoRelatorios(client, clientePath);

  // Inicia limpeza periódica de bloqueios (a cada 60 minutos)
  agendarLimpezaBloqueios(__dirname, 60);

  // ✅ NOVO: Inicia limpeza periódica do cache de mensagens (a cada 5 minutos)
  setInterval(() => {
    cleanupRecentMessagesCache();
  }, 5 * 60 * 1000); // 5 minutos

  // Chame a função dispararMensagens (disparo inicial)
  dispararMensagens(client, clientePath)
      .then(() => logger.info(`Disparo inicial de mensagens concluído!`))
      .catch((error) => logger.error(`Erro no disparo inicial de mensagens:`, error));

  // Agendar verificação e disparo de followups a cada 60 minutos
  setInterval(async () => {
      logger.info(`Verificando e disparando followups agendados...`);
      try {
          // Use clienteIdCompleto para o ID do cliente
          if (clienteIdCompleto) {
              await dispararFollowupsAgendados(client, clienteIdCompleto, __dirname); // Chama a nova função
              logger.info(`Verificação e disparo de followups concluído.`);
          } else {
              logger.error(`clienteIdCompleto não definido. Não é possível disparar followups.`);
          }
      } catch (error) {
          logger.error(`Erro na verificação/disparo de followups:`, error);
      }
  }, 6 * 60 * 1000); // 60 minutos em milissegundos

  // ✅ NOVO: Função para buscar e processar mensagens não lidas de todos os chats
  async function fetchUnreadMessages(client: wppconnect.Whatsapp): Promise<void> {
    try {
      logger.info(`[Unread Messages] Iniciando busca de mensagens não lidas...`);

      // Buscar todos os chats
      const allChats = await client.getAllChats();
      logger.info(`[Unread Messages] Encontrados ${allChats.length} chats no total`);

      // Filtrar apenas chats com mensagens não lidas
      const chatsWithUnread = allChats.filter(chat => chat.unreadCount && chat.unreadCount > 0);
      logger.info(`[Unread Messages] ${chatsWithUnread.length} chats possuem mensagens não lidas`);

      if (chatsWithUnread.length === 0) {
        logger.info(`[Unread Messages] Nenhum chat com mensagens não lidas encontrado`);
        return;
      }

      // Processar cada chat com mensagens não lidas
      for (const chat of chatsWithUnread) {
        try {
          const chatId = formatChatId(chat.id); // Usar a função formatChatId existente
          const unreadCount = chat.unreadCount;

          logger.info(`[Unread Messages] Processando chat ${chatId} com ${unreadCount} mensagens não lidas`);

          // Buscar as mensagens não lidas do chat
          // Tentar buscar exatamente a quantidade de mensagens não lidas
          const unreadMessages = await getMessages(client, chatId, { count: unreadCount });

          logger.info(`[Unread Messages] Recuperadas ${unreadMessages.length} mensagens não lidas do chat ${chatId}`);

          // Processar cada mensagem não lida como se fosse uma nova mensagem
          for (const message of unreadMessages) {
            try {
              await processUnreadMessageAsNew(client, message, chatId);
              logger.debug(`[Unread Messages] Mensagem ${message.id} do chat ${chatId} processada com sucesso`);
            } catch (messageError) {
              logger.error(`[Unread Messages] Erro ao processar mensagem ${message.id} do chat ${chatId}:`, messageError);
              // Continua processando outras mensagens mesmo se uma falhar
            }
          }

        } catch (chatError) {
          logger.error(`[Unread Messages] Erro ao processar chat ${formatChatId(chat.id)}:`, chatError);
          // Continua processando outros chats mesmo se um falhar
        }
      }

      logger.info(`[Unread Messages] Busca de mensagens não lidas concluída`);

    } catch (error) {
      logger.error(`[Unread Messages] Erro crítico na busca de mensagens não lidas:`, error);
      // Não lança erro para não interromper a inicialização do sistema
    }
  }

  // ✅ NOVO: Função auxiliar para processar uma mensagem não lida como se fosse nova
  async function processUnreadMessageAsNew(client: wppconnect.Whatsapp, message: any, chatId: string): Promise<void> {
    logger.debug(`[Unread Message] Processando mensagem ${message.id} como nova para ${chatId}`);

    // Verificar se atendimento já está em andamento pelo celular
    const atendimentoCelular = await IgnoreLead(chatId, __dirname);
    if (atendimentoCelular) {
      logger.info(`[Unread Message] Atendimento detectado pelo celular para ${chatId}, ignorando mensagem ${message.id}`);
      return; // Não processa mais esta mensagem
    }

    // Lógica de bloqueio inteligente baseada na configuração
    const estaBloqueado = await verificarChatBloqueado(chatId, __dirname);
    if (estaBloqueado) {
      logger.info(`[Unread Message] Chat ${chatId} bloqueado - armazenando mensagem ${message.id} mas não processando resposta`);

      // Continua armazenando mensagens mesmo bloqueado
      await saveChatMessage(clienteIdCompleto || '', chatId, message, clientePath);
      logger.info(`[Unread Message] Mensagem ${message.id} de ${chatId} salva localmente (bloqueado)`);
      await updateLastReceivedMessageDate(clientePath, chatId);

      return; // Não processa resposta, mas armazena mensagem
    }

    // Processar mensagem como se fosse nova (reutilizando lógica do onMessage)
    let currentMessageBody = '';
    let isAudio = false;

    if (message.type === 'ptt' && !message.isGroupMsg || message.type === 'audio') {
      isAudio = true;
      try {
        logger.info(`[Unread Message] Mensagem de áudio recebida em ${chatId}!`);
        const audioDir = path.join(__dirname, 'config', 'transcrever');
        if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

        // Para mensagens não lidas, precisamos baixar o arquivo primeiro
        const audioPath = path.join(audioDir, `${message.id.id || Date.now()}.mp3`);
        await client.decryptAndSaveFile(message, audioPath);
        logger.info(`[Unread Message] Áudio salvo em: ${audioPath}`);

        const transcribeModule = await import('../../src/backend/tollsIA/transcrever_audio.cjs');
        const transcribeAudio = transcribeModule.default;
        currentMessageBody = await transcribeAudio(audioPath, clientePath);
        logger.info(`[Unread Message] Transcrição do áudio: ${currentMessageBody}`);
      } catch (error) {
        logger.error(`[Unread Message] Erro ao processar áudio ${message.id} em ${chatId}:`, error);
        await sendMessage(client, clientePath, chatId, "O áudio não está carregando aqui. Consegue escrever?");
        return;
      }
    } else if (message.type === 'chat' && !message.isGroupMsg && message.chatId !== 'status@broadcast') {
      currentMessageBody = message.body || '';
    } else {
      // Ignorar outros tipos de mensagem
      return;
    }

    // Salvar a mensagem
    saveMessageToFile(clienteIdCompleto || '', clientePath, chatId, currentMessageBody, 'User');
    logger.info(`[Unread Message] Mensagem ${message.id} de ${chatId} salva localmente`);

    await updateLastReceivedMessageDate(clientePath, chatId);

    // Adicionar ao buffer (mesma lógica do onMessage)
    if (!messageBufferPerChatId.has(chatId)) {
      messageBufferPerChatId.set(chatId, []);
    }
    messageBufferPerChatId.get(chatId)!.push({ messages: [currentMessageBody], answered: false });
    // 🔄 SALVAR NO SQLITE (sincronização automática) - buffer de mensagens
    try {
      if (clienteIdCompleto) {
        await syncManager.saveClientData(clienteIdCompleto, {
          messageBuffer: messageBufferPerChatId
        });
        console.log(`[CMW/Index] Buffer de mensagens salvo no SQLite para ${clienteIdCompleto}`);
      } else {
        console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
      }
    } catch (sqliteError) {
      console.error(`[CMW/Index] Erro ao salvar buffer de mensagens no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    saveMessageBuffer();

    // Configurar timeout para resposta (mesma lógica do onMessage)
    if (messageTimeouts.has(chatId)) {
      clearTimeout(messageTimeouts.get(chatId));
    }

    logger.info(`[Unread Message] Aguardando timeout para resposta em ${chatId}...`);

    // Configurar resposta com timeout (reutilizando lógica do onMessage)
    messageTimeouts.set(
      chatId,
      setTimeout(async () => {
        const allMessages = messageBufferPerChatId.get(chatId) || [];
        const unansweredMessages = allMessages.filter(m => !m.answered);
        if (unansweredMessages.length === 0) return;

        const groupedMessages = unansweredMessages.map(m => m.messages.join('\n')).join('\n');
        const historicoPath = path.join(__dirname, `Chats`, `Historico`, `${chatId}`, `${chatId}.json`);
        const conversation = fs.existsSync(historicoPath) ? fs.readFileSync(historicoPath, 'utf-8') : '';
        const messageToGemini = `${conversation}\n\n${groupedMessages}`;

        // Mesmo fluxo de análise e resposta do onMessage
        try {
          // 1. Monitorar conversa
          const chatDadosPath = path.join(__dirname, `Chats`, `Historico`, chatId, `Dados.json`);
          let chatData: any = {};
          if (fs.existsSync(chatDadosPath)) {
            chatData = JSON.parse(fs.readFileSync(chatDadosPath, 'utf-8'));
          }
          await monitorarConversa(clientePath, chatId, chatData.listaNome || null, client);

          // 2. Responder ao Chat
          const mockMessage = { ...message, body: groupedMessages, from: chatId };
          await responderChat(client, mockMessage, chatId, messageToGemini);

        } catch (error) {
          logger.error(`[Unread Message] Erro no processamento de resposta para ${chatId}:`, error);
        }
      }, (Math.random() * (20 - 15) + 15) * 1000)
    );
  }

  // ✅ NOVO: Função para processar mensagens não respondidas com timeout
  async function processUnansweredMessagesWithTimeout(client: wppconnect.Whatsapp, chatId: string, unansweredMessages: MessageBufferEntry[], timeoutMs: number): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout no processamento de ${chatId}`)), timeoutMs);
    });

    const processPromise = processUnansweredMessages(client, chatId, unansweredMessages);

    try {
      await Promise.race([processPromise, timeoutPromise]);
    } catch (error) {
      logger.error(`[Buffer] Timeout ou erro no processamento de ${chatId}:`, error);
      throw error;
    }
  }

  // ✅ NOVO: Função para processar mensagens não respondidas com logging detalhado
  async function processUnansweredMessages(client: wppconnect.Whatsapp, chatId: string, unansweredMessages: MessageBufferEntry[]): Promise<void> {
    logger.info(`📝 [Buffer] Processando ${unansweredMessages.length} mensagens não respondidas para ${chatId}`);

    const groupedMessages = unansweredMessages
        .map(message => message.messages[0])
        .filter(msg => msg)
        .join('\n');
    const mockMessage = { body: groupedMessages, from: chatId };

    const filePath = path.join(__dirname, `Chats`, `Historico`, `${chatId}`, `${chatId}.json`);
    let conversation = '';
    if (fs.existsSync(filePath)) {
        conversation = fs.readFileSync(filePath, `utf-8`);
    }
    const messageToGemini = `${conversation}\n\n${groupedMessages}`;

    logger.info(`💬 [Buffer] Mensagens agrupadas para ${chatId}:`, groupedMessages.substring(0, 200) + '...');

    try {
      logger.info(`🤖 [Buffer] Chamando responderChat para ${chatId}`);
      await responderChat(client, mockMessage, chatId, messageToGemini);
      logger.info(`✅ [Buffer] responderChat concluído para ${chatId}`);
    } catch (error) {
      logger.error(`❌ [Buffer] Erro no responderChat para ${chatId}:`, error);
      throw error;
    }
  }

  // ✅ NOVO: Processamento seguro das mensagens não respondidas com timeout e fallback
  logger.info(`🔄 [Buffer] Iniciando processamento de mensagens não respondidas...`);

  for (const [chatId, messages] of messageBufferPerChatId.entries()) {
    const unansweredMessages = messages.filter(m => !m.answered);

    if (unansweredMessages.length > 0) {
      logger.info(`📨 [Buffer] Processando ${chatId} - ${unansweredMessages.length} mensagens não respondidas`);

      try {
        // Verifica se o arquivo de histórico existe
        const filePath = path.join(__dirname, `Chats`, `Historico`, `${chatId}`, `${chatId}.json`);
        if (!fs.existsSync(filePath)) {
          logger.warn(`[Buffer] Arquivo de histórico não encontrado para ${chatId}, pulando`);
          markMessagesAsAnswered(chatId);
          continue;
        }

        // Processa as mensagens com timeout de 60 segundos
        await processUnansweredMessagesWithTimeout(client, chatId, unansweredMessages, 60000);

        logger.info(`✅ [Buffer] Processamento concluído para ${chatId}`);

      } catch (error) {
        logger.error(`❌ [Buffer] Erro crítico processando ${chatId}:`, error);
        // Marca como respondida mesmo em caso de erro para evitar loop infinito
        markMessagesAsAnswered(chatId);
        logger.info(`🔄 [Buffer] Marcado como respondido (fallback) para ${chatId}`);
      }
    }
  }

  logger.info(`✅ [Buffer] Processamento de mensagens não respondidas concluído`);

  // ✅ NOVO: Buscar e processar mensagens não lidas pendentes
  logger.info(`🔄 [Unread] Iniciando busca de mensagens não lidas pendentes...`);
  try {
    await fetchUnreadMessages(client);
    logger.info(`✅ [Unread] Busca de mensagens não lidas pendentes concluída`);
  } catch (error) {
    logger.error(`❌ [Unread] Erro na busca de mensagens não lidas pendentes:`, error);
    // Não interrompe a inicialização do sistema por erro nesta funcionalidade
  }

  // --- DEFINIÇÃO DO HANDLER onMessage DENTRO DE START ---
  client.onMessage(async (message) => {
    logger.info(`Mensagem recebida de ${message.chatId}: ${message.body}`, message.type) ;
    const chatId: string = message.chatId as string;

    if (await getIsSendingMessages()) {
        logger.warn(`Nova mensagem recebida de ${chatId} enquanto a IA estava enviando. Cancelando envio atual.`);
        logger.info(`[onMessage] setCancelCurrentSending(true) chamado para ${chatId}`);
        setCancelCurrentSending(true);
        if (messageTimeouts.has(chatId)) {
            clearTimeout(messageTimeouts.get(chatId));
            messageTimeouts.delete(chatId);
            logger.info(`Timeout de resposta para ${chatId} cancelado.`);
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        logger.info(`[onMessage] Aguardando 1500ms após cancelamento para ${chatId}`);
    }

    logger.info(`[onMessage] Verificando se está enviando mensagens: ${await getIsSendingMessages()}`);

    let currentMessageBody = '';
    let isAudio = false;

    if (message.type === 'ptt' && !message.isGroupMsg || message.type === 'audio') {
        isAudio = true;
        try {
            logger.info(`Mensagem de áudio recebida!`);
            await client.startTyping(chatId);
            const audioDir = path.join(__dirname, 'config', 'transcrever');
            if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
            const audioPath = path.join(audioDir, `${Date.now()}.mp3`);
            await client.decryptAndSaveFile(message, audioPath);
            logger.info(`Áudio salvo em: ${audioPath}`);
            const transcribeModule = await import('../../src/backend/tollsIA/transcrever_audio.cjs');
            const transcribeAudio = transcribeModule.default;
            currentMessageBody = await transcribeAudio(audioPath, clientePath);
            logger.info(`Transcrição do áudio: ${currentMessageBody}`);
        } catch (error) {
            logger.error('Erro ao processar mensagem de áudio:', error);
            await sendMessage(client, clientePath, chatId, "O áudio não está carregando aqui. Consegue escrever?");
            return;
        }
    } else if (message.type === 'chat' && !message.isGroupMsg && message.chatId !== 'status@broadcast') {
        currentMessageBody = message.body || '';
    } else {
        return; // Ignora outros tipos de mensagem
    }

    // Salva a mensagem (original ou transcrita)
    saveMessageToFile(clienteIdCompleto || '', clientePath, chatId, currentMessageBody, 'User');
    logger.info(`[Local Save] Mensagem de ${chatId} salva localmente.`);
    await updateLastReceivedMessageDate(clientePath, chatId);

    // Verifica se atendimento já está em andamento pelo celular
    const atendimentoCelular = await IgnoreLead(chatId, __dirname);
    if (atendimentoCelular) {
        logger.info(`[IgnoreLead] Atendimento detectado pelo celular para ${chatId}`);
        return; // Não processa mais esta mensagem
    }

    // Lógica de buffer
    if (!messageBufferPerChatId.has(chatId)) {
        messageBufferPerChatId.set(chatId, []);
    }
    messageBufferPerChatId.get(chatId)!.push({ messages: [currentMessageBody], answered: false });
    saveMessageBuffer();

    if (messageTimeouts.has(chatId)) {
        clearTimeout(messageTimeouts.get(chatId));
    }
    logger.info(`Aguardando novas mensagens do cliente ${chatId}...`);

    // Lógica de bloqueio inteligente baseada na configuração
    const estaBloqueado = await verificarChatBloqueado(chatId, __dirname);

    if (estaBloqueado) {
        logger.info(`ChatId ${chatId} bloqueado - pulando processamento de resposta, mas armazenando mensagens.`);

        // Continua armazenando mensagens mesmo bloqueado
        saveChatMessage(clienteIdCompleto || '', chatId, currentMessageBody, clientePath);
        logger.info(`[Bloqueado] Mensagem de ${chatId} salva localmente.`);
        await updateLastReceivedMessageDate(clientePath, chatId);

        return; // Não processa resposta, mas armazena mensagem
    } else {
        logger.info(`ChatId ${chatId} liberado para processamento.`);
    }

    // Inicia o timer para responder
    messageTimeouts.set(
        chatId,
        setTimeout(async () => {
            const allMessages = messageBufferPerChatId.get(chatId) || [];
            const unansweredMessages = allMessages.filter(m => !m.answered);
            if (unansweredMessages.length === 0) return;

            const groupedMessages = unansweredMessages.map(m => m.messages.join('\n')).join('\n');
            const historicoPath = path.join(__dirname, `Chats`, `Historico`, `${chatId}`, `${chatId}.json`);
            const conversation = fs.readFileSync(historicoPath, 'utf-8');
            const messageToGemini = `${conversation}\n\n${groupedMessages}`;

            // --- FLUXO DE ANÁLISE E RESPOSTA ---
            try {
                // 1. Monitorar (lógica que não depende da qualificação)
                const chatDadosPath = path.join(__dirname, `Chats`, `Historico`, chatId, `Dados.json`);
                let chatData: any = {};
                if (fs.existsSync(chatDadosPath)) {
                    chatData = JSON.parse(fs.readFileSync(chatDadosPath, 'utf-8'));
                }
                await monitorarConversa(clientePath, chatId, chatData.listaNome || null, client);

                // 2. Qualificar o Lead
//                logger.info(`[Análise] Iniciando qualificação de lead para ${chatId}`);
//                const analise = await qualificarLead(conversation, infoConfig, clientePath, chatId);
//
//                if (analise) {
//                    logger.info(`[Análise] ✅ Lead qualificado para ${chatId}:`);
//                    logger.info(`[Análise] Nome: ${analise.nome || 'Não identificado'}`);
//                    logger.info(`[Análise] Score: ${analise.leadScore}/10`);
//                    logger.info(`[Análise] Etapa: ${analise.etapaFunil}`);
//                    logger.info(`[Análise] Qualificado: ${analise.isLeadQualificado}`);
//                    logger.info(`[Análise] Tags: ${analise.tags?.join(', ') || 'Nenhuma'}`);
//
//                    await updateLeadData(chatId, {
//                        name: analise.nome,
//                        interest: analise.interesse,
//                        leadScore: analise.leadScore,
//                        etapaFunil: analise.etapaFunil,
//                        isLeadQualificado: analise.isLeadQualificado,
//                        resumoParaAtendente: analise.resumoParaAtendente,
//                        precisaAtendimentoHumano: analise.precisaAtendimentoHumano,
//                        tags: analise.tags,
//                    });
//
//                    logger.info(`[Análise] ✅ Processo de análise concluído para ${chatId}`);
//                    logger.info(`[Análise] 📊 Lead Score: ${analise.leadScore}/10`);
//                    logger.info(`[Análise] ✅ Qualificado: ${analise.isLeadQualificado}`);
//                    logger.info(`[Análise] 🚨 Atendimento Humano: ${analise.precisaAtendimentoHumano}`);
//
//                    // Verifica se dados anteriores existem para comparar
//                    const dadosAttPath = path.join(__dirname, `Chats`, `Historico`, chatId, `Dados.json`);
//                    let dadosAnteriores = null;
//                    if (fs.existsSync(dadosAttPath)) {
//                        try {
//                            dadosAnteriores = JSON.parse(fs.readFileSync(dadosAttPath, 'utf-8'));
//                        } catch (error) {
//                            logger.error(`Erro ao ler dados anteriores para ${chatId}:`, error);
//                        }
//                    }
//
//                    // Se o lead foi qualificado e não estava qualificado antes, envia notificação
//                    if (analise.isLeadQualificado && (!dadosAnteriores || !dadosAnteriores.isLeadQualificado)) {
//                        logger.info(`[Análise] 🎯 Lead recém-qualificado detectado para ${chatId}`);
//
//                        try {
//                            // Busca o lead recém-criado
//                            const lead = await findLeadByChatId(infoConfig.CLIENTE, chatId);
//                            if (lead && analise.resumoParaAtendente) {
//                                logger.info(`[Análise] 📊 Tipo: ${analise.detalhes_agendamento?.[0]?.agendamento_identificado ? 'Lead Quente (Agendamento)' : 'Lead Morno (Informações)'}`);
//
//                                // Enviar notificação imediata
//                                await notifyLeadIdentified(client, infoConfig.CLIENTE, chatId, lead.id, analise.resumoParaAtendente);
//                                logger.info(`[Análise] ✅ Notificação de lead qualificado enviada para ${chatId}`);
//                            } else {
//                                logger.warn(`[Análise] Lead não encontrado ou resumo não disponível para notificação em ${chatId}`);
//                            }
//                        } catch (error) {
//                            logger.error(`[Análise] Erro ao processar notificação de lead qualificado para ${chatId}:`, error);
//                        }
//                    }
//
//                    // Se precisar de atendimento humano, envia notificação
//                    if (analise.precisaAtendimentoHumano && analise.resumoParaAtendente) {
//                        await sendMessage(client, clientePath, TARGET_CHAT_ID, `*🚨 Atenção Humana Necessária!*\n\n*Lead:* ${analise.nome || chatId}\n*Resumo:* ${analise.resumoParaAtendente}`);
//                    }
//                }
                
                // 3. Responder ao Chat
                const mockMessage = { ...message, body: groupedMessages, from: chatId };
                await responderChat(client, mockMessage, chatId, messageToGemini);

            } catch (error) {
                logger.error(`[Fluxo Principal] Erro no fluxo de análise e resposta para ${chatId}:`, error);
            }
        }, (Math.random() * (20 - 15) + 15) * 1000)
    );
  }); // <-- FIM DO client.onMessage

  // --- DEFINIÇÃO DAS FUNÇÕES CHAMADAS PELO onMessage DENTRO DE START ---

  // Adiciona client como primeiro parâmetro
  async function responderChat(client: wppconnect.Whatsapp, message: any, chatId: string, messageToGemini: string) {
    logger.info(`🚀 [responderChat] ========== INICIANDO PROCESSAMENTO ==========`);
    logger.info(`🚀 [responderChat] ChatId: ${chatId}`);
    logger.info(`🚀 [responderChat] Tamanho da mensagem: ${messageToGemini.length} caracteres`);

    const intervalo_aleatorio = Math.random() * (10 - 5) + 5;
    logger.info(`⏳ [responderChat] Aguardando ${intervalo_aleatorio.toFixed(1)} segundos (intervalo aleatório)`);

    await new Promise((resolve) => setTimeout(resolve, intervalo_aleatorio * 1000));

    try {
      logger.info(`🤖 [responderChat] ========== CHAMANDO mainGoogleChat ==========`);
     logger.info(`📤 [responderChat] Enviando mensagem de ${messageToGemini.length} caracteres para mainGoogleChat`);
     let answer = await mainGoogleChat({ currentMessageChat: messageToGemini, chatId, clearHistory: true, __dirname });
     logger.info(`📥 [responderChat] Resposta recebida: ${answer.substring(0, 100)}... (${answer.length} chars)`);

     if (answer === `_fim` || answer === undefined) {
       logger.info(`🛑 [responderChat] Resposta '_fim' ou undefined recebida, retornando`);
       return;
     }

     // VALIDAÇÃO BG: Verifica se a resposta está adequada ao contexto
     logger.info(`🔍 [responderChat] ========== INICIANDO VALIDAÇÃO BG ==========`);
     logger.info(`🔍 [responderChat] Validando resposta BG para ${chatId}...`);
     const validation = await validateResponseWithBG(__dirname, chatId, messageToGemini, answer);
     logger.info(`✅ [responderChat] ========== VALIDAÇÃO BG CONCLUÍDA ==========`);

          if (!validation.isValid) {
            logger.warn(`[responderChat] Resposta inadequada detectada para ${chatId}. Problemas: ${validation.feedback}`);

            // Usa a resposta final da validação (que já passou pelo loop de tentativas)
            if (validation.finalResponse && validation.finalResponse !== answer) {
              logger.info(`[responderChat] Usando resposta validada pelo BG para ${chatId}`);
              answer = validation.finalResponse;
            }
          } else {
            logger.info(`[responderChat] ✅ Resposta validada pelo BG para ${chatId}`);
          }

          // Sempre remove emojis para evitar problemas
          logger.info(`[responderChat] Removendo emojis da resposta para ${chatId}.`);
          answer = removeEmojis(answer);

          let splitMessagesArray: string[];

          // Simplifica a lógica: sempre tenta dividir/processar a mensagem
          logger.debug(`[responderChat] Resposta da IA (${answer.length} chars): ${answer.substring(0, 100)}...`);

          try {
              splitMessagesArray = await handleMessageSplitting({
                client,
                originalMessage: answer,
                chatId,
                __dirname,
                AI_SELECTED,
                infoConfig,
                logger,
              });
              logger.info(`[responderChat] handleMessageSplitting processou ${splitMessagesArray.length} partes para ${chatId}`);
          } catch (error) {
              logger.error(`[responderChat] Erro no handleMessageSplitting para ${chatId}:`, error);
              // Fallback: usa mensagem original se houver erro
              splitMessagesArray = [answer];
              logger.info(`[responderChat] Usando mensagem original como fallback para ${chatId}`);
          }

          // Garante que sempre há pelo menos uma mensagem
          if (!splitMessagesArray || splitMessagesArray.length === 0) {
              splitMessagesArray = [answer];
              logger.warn(`[responderChat] Fila vazia detectada, usando mensagem original para ${chatId}`);
          }

          logger.info(`Enviando mensagens para ${chatId}...`);

          // ✅ NOVO: Verificação de duplicata ANTES do envio (backward compatible)
          if (DUPLICATE_PROTECTION_ENABLED && isRecentDuplicate(chatId, answer)) {
            logger.info(`🚫 Mensagem duplicada recente detectada para ${chatId}, pulando envio`);
            await markMessagesAsAnswered(chatId);
            return; // Não envia mensagem duplicada
          }

     logger.info(`📤 [responderChat] ========== ENVIANDO MENSAGENS ==========`);

     // ✅ Verificação de duplicata ANTES do envio final
     const fullMessage = splitMessagesArray.join('\n');
     if (isRecentDuplicate(chatId, fullMessage)) {
       logger.info(`🚫 Mensagem duplicada detectada para ${chatId}, pulando envio`);
       await markMessagesAsAnswered(chatId);
       return; // Não envia mensagem duplicada
     }

     logger.info(`📤 [responderChat] Enviando ${splitMessagesArray.length} mensagens para ${chatId}`);

     await sendMessagesWithDelay({ client, messages: splitMessagesArray, targetNumber: message.from, __dirname, clienteIdCompleto: clienteIdCompleto!, clientePath, logger });

     logger.info(`✅ [responderChat] ========== MENSAGENS ENVIADAS COM SUCESSO ==========`);
     await markMessagesAsAnswered(chatId);
     checkResposta(client, clientePath, chatId, answer); // Passa client
     await updateLastSentMessageDate(clientePath, chatId);

   } catch (error: any) {
     logger.error(`❌ [responderChat] ========== ERRO CRÍTICO ==========`);
     logger.error(`❌ [responderChat] Erro ao obter/enviar resposta da IA (chat) para ${chatId}:`, error);
           let retryCount = 0;
           const maxRetries = 3;
           while (retryCount < maxRetries) {
               try {
                   logger.info(`Tentando novamente (tentativa ${retryCount + 1} de ${maxRetries})...`);
                   let answerRetry = await mainGoogleChat({ currentMessageChat: messageToGemini, chatId, clearHistory: true, __dirname });
                   if (answerRetry === `_fim` || answerRetry === undefined) return;

                   // VALIDAÇÃO BG no retry também
                   logger.info(`[responderChat - Retry] Validando resposta BG para ${chatId}...`);
                   const retryValidation = await validateResponseWithBG(__dirname, chatId, messageToGemini, answerRetry);

                   if (!retryValidation.isValid) {
                     logger.warn(`[responderChat - Retry] Resposta inadequada no retry para ${chatId}. Problemas: ${retryValidation.feedback}`);
                     if (retryValidation.finalResponse && retryValidation.finalResponse !== answerRetry) {
                       logger.info(`[responderChat - Retry] Usando resposta validada pelo BG para ${chatId}`);
                       answerRetry = retryValidation.finalResponse;
                     }
                   } else {
                     logger.info(`[responderChat - Retry] ✅ Resposta validada pelo BG para ${chatId}`);
                   }

                   // Sempre remove emojis na tentativa
                   logger.info(`[responderChat - Retry] Removendo emojis da resposta para ${chatId}.`);
                   answerRetry = removeEmojis(answerRetry);

                   let splitMessagesArrayRetry: string[];
                   // A lógica de shouldSplitRetry foi removida. Agora, a decisão de dividir ou reformular
                   // é baseada diretamente na resposta da IA e no limite de partes.
                       if (answerRetry.toUpperCase().includes("***") || answerRetry.toUpperCase().includes("\n") || answerRetry.toUpperCase().includes("?") || answerRetry.toUpperCase().includes("!") || answerRetry.length > 1000) {
                       const filteredAnswerRetry = answerRetry;
                       logger.debug(`[responderChat - Retry] filteredAnswerRetry antes de handleMessageSplitting: ${filteredAnswerRetry.substring(0, 100)}...`);
                       splitMessagesArrayRetry = await handleMessageSplitting({
                         client,
                         originalMessage: filteredAnswerRetry,
                         chatId,
                         __dirname,
                         AI_SELECTED,
                         infoConfig,
                         logger,
                       });
                       logger.info(`Mensagem precisa ser dividida (retry), enviando para handleMessageSplitting para ${chatId}...`);
                   } else {
                       splitMessagesArrayRetry = [answerRetry];
                       logger.info(`Mensagem não precisa ser dividida (retry), enviando mensagem direta para ${chatId}...`);
                   }

                   // ✅ NOVO: Verificação de duplicata também no retry
                   if (DUPLICATE_PROTECTION_ENABLED && isRecentDuplicate(chatId, answerRetry)) {
                     logger.info(`🚫 Mensagem duplicada recente detectada no retry para ${chatId}, pulando envio`);
                     await markMessagesAsAnswered(chatId);
                     return; // Não envia mensagem duplicada mesmo no retry
                   }

                   // ✅ Verificação de duplicata antes do envio no retry
                   const fullMessageRetry = splitMessagesArrayRetry.join('\n');
                   if (isRecentDuplicate(chatId, fullMessageRetry)) {
                     logger.info(`🚫 Mensagem duplicada detectada no retry para ${chatId}, pulando envio`);
                     await markMessagesAsAnswered(chatId);
                     return; // Não envia mensagem duplicada
                   }

                   await sendMessagesWithDelay({ client, messages: splitMessagesArrayRetry, targetNumber: message.from, __dirname, clienteIdCompleto: clienteIdCompleto!, clientePath, logger });
                   await markMessagesAsAnswered(chatId);
                   checkResposta(client, clientePath, chatId, answerRetry); // Passa client
                   await updateLastSentMessageDate(clientePath, chatId);

                   logger.info(`Mensagens (retry) respondidas com sucesso para ${chatId}.`);
                   // checkResposta(client, clientePath, chatId, answerRetry); // Passa client - Removido pois já é chamado acima
                   break;
               } catch (retryError) {
                   retryCount++;
                   logger.error(`Erro na tentativa ${retryCount} para ${chatId}:`, retryError);
                   if (retryCount < maxRetries) {
                       const retryDelay = 5000 * retryCount;
                       logger.info(`Aguardando ${retryDelay / 1000} segundos antes da próxima tentativa...`);
                       await new Promise(resolve => setTimeout(resolve, retryDelay));
                   }
               }
           }
           if (retryCount === maxRetries) {
               logger.error(`Falha definitiva ao enviar a mensagem para ${chatId} após ${maxRetries} tentativas.`);
               try {
                   sendMessage(client, clientePath, TARGET_CHAT_ID, `⚠️ Falha definitiva ao enviar mensagem para ${chatId} do cliente ${cliente}. Verificar logs.`); // Passa client, clientePath
               } catch (sendError) {
                   logger.error("Erro ao enviar mensagem de erro para admin:", sendError);
               }
           }
       } finally {
           // Nenhuma ação específica no finally por enquanto
       }
   } // <-- FIM DE responderChat
   
 // ✅ NOVO: Verificação de validação simultânea (backward compatible)
 function canStartValidation(chatId: string): boolean {
   const validationKey = `${chatId}_validation`;
   if (activeValidations.has(validationKey)) {
     console.log(`🚫 Validação BG já em andamento para ${chatId}, ignorando`);
     return false;
   }
   return true;
 }

 function startValidation(chatId: string): void {
   const validationKey = `${chatId}_validation`;
   activeValidations.add(validationKey);

   // Remove automaticamente após timeout
   setTimeout(() => {
     activeValidations.delete(validationKey);
   }, VALIDATION_TIMEOUT);
 }

 function endValidation(chatId: string): void {
   const validationKey = `${chatId}_validation`;
   activeValidations.delete(validationKey);
 }

 // Função para validar resposta usando GoogleBG com loop de tentativas
 async function validateResponseWithBG(clientePath: string, chatId: string, contexto: string, resposta: string, maxAttempts: number = 3): Promise<{isValid: boolean, feedback?: string, finalResponse?: string}> {
   // ✅ NOVO: Verificação de validação simultânea ANTES de iniciar
   if (!canStartValidation(chatId)) {
     console.log(`✅ Pulando validação BG duplicada para ${chatId}`);
     return {
       isValid: true,
       feedback: 'Validação pulada (já em andamento)',
       finalResponse: resposta
     };
   }

   const attempts = [];
   let currentResponse = resposta;

   // ✅ NOVO: Marca validação como iniciada
   startValidation(chatId);

   try {
     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
       try {
       const validationPrompt = `
       ANALISE CRÍTICA DE RESPOSTA - TENTATIVA ${attempt}/${maxAttempts}:

       CONTEXTO DA CONVERSA:
       ${contexto}

       RESPOSTA A SER VALIDADA:
       "${currentResponse}"

       AVALIAÇÃO - Responda APENAS com JSON:
       {
         "isValid": boolean (true/false),
         "problemas": ["lista de problemas encontrados"],
         "suggestedResponse": "sugestão de resposta melhor se houver problemas",
         "justificativa": "explicação breve da avaliação"
       }

       CRITÉRIOS DE VALIDAÇÃO:
       1. CONTEXTO: Se o histórico mencionar imóvel específico (Barcelona, Iraema, etc.) e cliente demonstrou interesse, a resposta deve continuar com esse imóvel
       2. RESPOSTAS POSITIVAS: Se cliente disse "pode sim", "quero saber", etc., resposta deve fornecer informações do imóvel mencionado
       3. PROGRESSÃO: Deve avançar no funil (oferecer visita/ligação) quando apropriado
       4. RELEVÂNCIA: Não deve voltar para perguntas genéricas (cidade, quartos) se já há contexto específico
       5. OBJETIVO: Deve seguir o objetivo de agendar visita ou ligação

       ${attempt > 1 ? `PROBLEMAS ANTERIORES: ${attempts.slice(0, -1).map(a => a.problemas).join(', ')}` : ''}
       `;

       logger.info(`[Validação BG] Tentativa ${attempt}/${maxAttempts} para ${chatId}`);

       const validation = await mainGoogleBG({
       currentMessageBG: validationPrompt,
       chatId: cleanChatId(chatId),
       clearHistory: true,
       __dirname: clientePath
     });

       try {
         // Remove markdown code blocks antes de fazer parse
         let cleanValidation = validation.trim();

         // Remove ```json se presente no início
         if (cleanValidation.startsWith('```json')) {
           cleanValidation = cleanValidation.replace(/^```json\s*/, '');
         }

         // Remove ``` se presente no final
         if (cleanValidation.endsWith('```')) {
           cleanValidation = cleanValidation.replace(/\s*```$/, '');
         }

         // Remove linhas vazias no início e fim
         cleanValidation = cleanValidation.trim();

         // Se a resposta não for JSON, tenta extrair JSON de dentro do texto
         if (!cleanValidation.startsWith('{') || !cleanValidation.endsWith('}')) {
           logger.warn(`[Validação BG] Resposta não é JSON puro, tentando extrair JSON: ${cleanValidation.substring(0, 200)}...`);

           // Procura por padrões JSON na resposta
           const jsonMatch = cleanValidation.match(/\{[\s\S]*\}/);
           if (jsonMatch) {
             cleanValidation = jsonMatch[0];
           } else {
             // Se não conseguir extrair JSON, assume que é válida por padrão
             logger.warn(`[Validação BG] Não foi possível extrair JSON da resposta, assumindo válida`);
             return {
               isValid: true,
               feedback: 'Resposta considerada válida (não foi possível fazer parse)',
               finalResponse: currentResponse
             };
           }
         }

         // Sanitiza caracteres especiais que podem quebrar o JSON
         cleanValidation = cleanValidation
           .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
           .replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\') // Escapa backslashes
           .trim();

         // Tenta fazer parse com tratamento de erro mais detalhado
         let result;
         try {
           result = JSON.parse(cleanValidation);
         } catch (parseError: any) {
           logger.error(`[Validação BG] Erro no parse JSON: ${parseError.message}`);
           logger.error(`[Validação BG] Conteúdo que falhou no parse: ${cleanValidation}`);

           // Tenta corrigir problemas comuns de JSON
           cleanValidation = cleanValidation
             .replace(/,\s*}/g, '}') // Remove vírgula antes de chave fechada
             .replace(/,\s*]/g, ']') // Remove vírgula antes de colchete fechado
             .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Adiciona aspas em chaves não quoted

           try {
             result = JSON.parse(cleanValidation);
             logger.info(`[Validação BG] JSON corrigido com sucesso`);
           } catch (secondParseError) {
             logger.error(`[Validação BG] Falha na segunda tentativa de parse JSON`);
             // Assume válida se não conseguir fazer parse
             return {
               isValid: true,
               feedback: 'Resposta considerada válida (erro crítico no parse)',
               finalResponse: currentResponse
             };
           }
         }
         // Validação adicional dos campos obrigatórios
         if (typeof result.isValid !== 'boolean') {
           logger.warn(`[Validação BG] Campo isValid inválido: ${result.isValid}, assumindo false`);
           result.isValid = false;
         }

         if (!Array.isArray(result.problemas)) {
           logger.warn(`[Validação BG] Campo problemas inválido: ${result.problemas}, assumindo array vazio`);
           result.problemas = [];
         }

         attempts.push({
           response: currentResponse,
           problemas: result.problemas,
           justificativa: result.justificativa || 'Análise sem justificativa',
           isValid: result.isValid
         });

         // Se válida, retorna sucesso
         if (result.isValid) {
           logger.info(`[Validação BG] ✅ Resposta validada na tentativa ${attempt} para ${chatId}`);
           return {
             isValid: true,
             feedback: `Validada em ${attempt} tentativa(s)`,
             finalResponse: currentResponse
           };
         }

         // Se inválida e tem sugestão, tenta novamente com ela
         if (result.suggestedResponse && result.suggestedResponse !== currentResponse) {
           // Verifica se a resposta sugerida não é muito longa ou problemática
           if (result.suggestedResponse.length > 4000) {
             logger.warn(`[Validação BG] Resposta sugerida muito longa (${result.suggestedResponse.length} chars), truncando`);
             result.suggestedResponse = result.suggestedResponse.substring(0, 4000) + '...';
           }

           // Verifica se a resposta sugerida não está vazia ou contém apenas caracteres especiais
           if (result.suggestedResponse.trim().length < 10) {
             logger.warn(`[Validação BG] Resposta sugerida muito curta ou inválida, ignorando`);
           } else {
             logger.warn(`[Validação BG] ❌ Tentativa ${attempt} inadequada para ${chatId}. Problemas: ${result.problemas?.join(', ')}`);
             currentResponse = result.suggestedResponse;
             continue;
           }
         }

       } catch (parseError) {
         logger.warn(`[Validação BG] Erro ao fazer parse da validação BG para ${chatId}:`, parseError);
         attempts.push({
           response: currentResponse,
           problemas: ['Erro no parse da validação'],
           justificativa: 'Não foi possível interpretar resposta da validação',
           isValid: false
         });
       }

     } catch (error: any) {
       logger.error(`[Validação BG] Erro na tentativa ${attempt} para ${chatId}:`, error);

       // Classifica o tipo de erro para melhor tratamento
       let errorType = 'Erro técnico na validação';
       let isValidFallback = false;
       let problemas = ['Erro na validação BG'];

       if (error.message?.includes('rate limit') || error.message?.includes('429')) {
         errorType = 'Rate limit na validação BG';
         problemas = ['Rate limit excedido na validação'];
         isValidFallback = true; // Assume válida em caso de rate limit
       } else if (error.message?.includes('network') || error.message?.includes('ECONNRESET')) {
         errorType = 'Erro de conectividade na validação BG';
         problemas = ['Erro de conectividade na validação'];
         isValidFallback = true; // Assume válida em caso de problemas de rede
       } else if (error.message?.includes('timeout')) {
         errorType = 'Timeout na validação BG';
         problemas = ['Timeout na validação'];
         isValidFallback = true; // Assume válida em caso de timeout
       } else if (error.message?.includes('unauthorized') || error.message?.includes('403')) {
         errorType = 'Erro de autenticação na validação BG';
         problemas = ['Erro de autenticação na validação'];
         isValidFallback = false; // Assume inválida em caso de erro de auth
       }

       attempts.push({
         response: currentResponse,
         problemas,
         justificativa: errorType,
         isValid: isValidFallback
       });
       }
     }

     // Se chegou aqui, todas as tentativas falharam
     logger.error(`[Validação BG] ❌ Todas as ${maxAttempts} tentativas falharam para ${chatId}`);

     // Retorna a melhor resposta disponível (última tentativa)
     const bestAttempt = attempts.find(a => a.isValid) || attempts[attempts.length - 1];

     return {
       isValid: false,
       feedback: `Tentativas esgotadas (${maxAttempts}). Problemas: ${attempts.map(a => a.problemas).join('; ')}`,
       finalResponse: bestAttempt?.response || resposta
     };
   } finally {
     // ✅ NOVO: Sempre remove validação do controle ativo
     endValidation(chatId);
   }
 }

 // Função para atualizar os dados do lead no arquivo Dados.json
 async function updateLeadData(chatId: string, dataToUpdate: { [key: string]: any }) {
   const fileName = `Dados.json`;
   const filePath = path.join(__dirname, `Chats`, `Historico`, `${chatId}`, fileName);

   let fileData: any = {};
   try {
       if (fs.existsSync(filePath)) {
           const fileContent = fs.readFileSync(filePath, `utf-8`);
           fileData = JSON.parse(fileContent);
       } else {
         // Se não existir, inicializa com dados básicos
         fileData = {
             name: 'Não identificado',
             telefone: chatId.split('@')[0],
             tags: [],
             listaNome: null,
         };
       }
   } catch (error) {
       logger.error(`Erro ao ler/parsear Dados.json para ${chatId}, resetando para o básico:`, error);
       fileData = {
           name: 'Não identificado',
           telefone: chatId.split('@')[0],
           tags: [],
           listaNome: null,
       };
   }

   // Atualiza os campos no objeto, mesclando tags se existirem
   for (const key in dataToUpdate) {
       if (dataToUpdate.hasOwnProperty(key) && dataToUpdate[key] !== null && dataToUpdate[key] !== undefined) {
           if (key === 'tags' && Array.isArray(fileData.tags) && Array.isArray(dataToUpdate.tags)) {
               // Combina tags existentes com novas, sem duplicatas
               fileData.tags = Array.from(new Set([...fileData.tags, ...dataToUpdate.tags]));
           } else {
               fileData[key] = dataToUpdate[key];
           }
       }
   }

   try {
       // 🔄 SALVAR NO SQLITE (sincronização automática) - atualização de dados do chat
       try {
         if (clienteIdCompleto) {
           await syncManager.saveClientData(clienteIdCompleto, {
             chats: {
               historico: {
                 [chatId]: {
                   Dados: fileData
                 }
               }
             }
           });
           console.log(`[CMW/Index] Dados do chat atualizados no SQLite para ${clienteIdCompleto}`);
         } else {
           console.log(`[CMW/Index] clienteIdCompleto é null, pulando sincronização SQLite`);
         }
       } catch (sqliteError) {
         console.error(`[CMW/Index] Erro ao salvar dados do chat no SQLite:`, sqliteError);
         // Continua com o salvamento JSON mesmo se SQLite falhar
       }

       // 📄 SALVAR NO JSON (manter funcionalidade original)
       const updatedContent = JSON.stringify(fileData, null, 2);
       fs.writeFileSync(filePath, updatedContent, `utf-8`);
       logger.info(`Dados.json para ${chatId} atualizado com sucesso.`);
   } catch (error) {
       logger.error(`Erro ao escrever em Dados.json para ${chatId}:`, error);
   }
  }
}

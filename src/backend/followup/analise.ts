import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import path from 'node:path';
import { getPasta } from '../disparo/disparo.ts';
import { cleanChatId } from '../util/chatDataUtils.ts';
import { getFollowUpConfig } from './config.ts';
import { syncManager } from '../../database/sync.ts';

/**
 * Analisa a necessidade de follow-up para todos os chats de um cliente.
 * @param clienteId - O ID do cliente.
 */
export async function analisarNecessidadeFollowUp(clienteId: string): Promise<void> {
  const clientePath = getPasta(clienteId);
  if (!clientePath) {
    console.error(`[FollowUp Analise] Caminho inválido para cliente ${clienteId}`);
    return;
  }

  // Verifica se o follow-up está ativo na configuração
  const configFollowUp = await getFollowUpConfig(clientePath);
  if (!configFollowUp.ativo) {
    console.info(`[FollowUp Analise] Follow-up está desativado para ${clienteId}. Pulando análise.`);
    return;
  }

  const dadosDir = path.join(clientePath, 'Chats', 'Historico');
  try {
    const chatIds = await getChatIds(dadosDir);

    for (const chatId of chatIds) {
      const cleanId = cleanChatId(chatId);
      const dadosPath = path.join(dadosDir, cleanId, 'Dados.json');
      const followupPath = path.join(clientePath, 'config', 'followups.json');
      try {
        if (!fsSync.existsSync(dadosPath)) {
          console.warn(`[FollowUp Analise] Dados.json não encontrado para ${chatId}, pulando.`);
          continue;
        }
        const dadosContent = await fs.readFile(dadosPath, 'utf-8');
        const dados = JSON.parse(dadosContent);

        if (dados?.interesse === 'não' || dados?.interesse === false || dados?.interesse === 'false') {
          console.info(`[FollowUp Analise] Interesse é '${dados.interesse}' para ${chatId}. Removendo follow-up.`);
          await removerFollowUp(clientePath, chatId);
          continue;
        }

        if (!dados?.nivel_followup) {
          console.info(`[FollowUp Analise] Criando nivel_followup para ${chatId}.`);
          dados.nivel_followup = '1';
          await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf-8');

          // ✅ NOVO: Atualiza o arquivo followups.json com verificação de duplicação
          try {
            await updateFollowUpEntry(clientePath, chatId, 1);
            console.info(`[FollowUp Analise] Follow-up verificado/atualizado para ${chatId}.`);
          } catch (err) {
            console.error(`[FollowUp Analise] Erro ao atualizar followups.json para ${chatId}:`, err);
          }
        }

      } catch (err) {
        console.error(`[FollowUp Analise] Erro ao processar dados para ${chatId}:`, err);
      }
    }
  } catch (error) {
    console.error(`[FollowUp Analise] Erro ao listar ou processar chats para ${clienteId}:`, error);
  }
}

async function getChatIds(dadosDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dadosDir);
    return files.filter(file => fsSync.statSync(path.join(dadosDir, file)).isDirectory());
  } catch (error) {
    console.error("[FollowUp Analise] Erro ao ler diretório de chats:", error);
   return [];
 }
}

/**
 * ✅ NOVO: Atualiza entrada de follow-up com verificação de duplicação
 * Se o chatid já existir, atualiza o nível; caso contrário, cria nova entrada
 */
export async function updateFollowUpEntry(clientePath: string, chatId: string, nivel: number): Promise<void> {
  const followupPath = path.join(clientePath, 'config', 'followups.json');

  try {
    let followups: any[] = [];

    // Carrega followups existentes
    if (fsSync.existsSync(followupPath)) {
      const followupContent = await fs.readFile(followupPath, 'utf-8');
      followups = JSON.parse(followupContent);
    }

    // Busca se já existe entrada para este chatid
    const existingIndex = followups.findIndex(f => f.chatid === chatId);

    if (existingIndex >= 0) {
      // ✅ Atualiza nível existente
      const oldNivel = followups[existingIndex].nivel_followup;
      followups[existingIndex].nivel_followup = nivel;
      console.info(`[FollowUp Update] Chat ${chatId} atualizado: nível ${oldNivel} → ${nivel}`);
    } else {
      // ✅ Cria nova entrada
      const newFollowup = {
        chatid: chatId,
        nivel_followup: nivel,
      };
      followups.push(newFollowup);
      console.info(`[FollowUp Update] Nova entrada criada para ${chatId} (nível ${nivel})`);
    }

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    // clientId já é apenas o nome da pasta (ex: "CMW"), não precisa extrair do caminho
    const clientId = clientePath.split(/[\\/]/).pop() || 'default';
    try {
      await syncManager.saveClientData(clientId, {
        followups: followups
      });
      console.log(`[FollowUp Analise] Followups salvos no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[FollowUp Analise] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    await fs.writeFile(followupPath, JSON.stringify(followups, null, 2), 'utf-8');

  } catch (error) {
    console.error(`[FollowUp Update] Erro ao atualizar follow-up para ${chatId}:`, error);
    throw error;
  }
}

export async function removerFollowUp(clientePath: string, chatId: string): Promise<void> {
    const filePath = path.join(clientePath, 'config', 'followups.json');
    try {
        if (fsSync.existsSync(filePath)) {
            const data = await fs.readFile(filePath, 'utf-8');
            let followups = JSON.parse(data);
            followups = followups.filter((followup: any) => followup.chatId !== chatId);
            await fs.writeFile(filePath, JSON.stringify(followups, null, 2), 'utf-8');
            console.info(`[FollowUp Analise] Follow-up removido para ${chatId} em ${filePath}.`);
        } else {
            console.info(`[FollowUp Analise] Arquivo ${filePath} não encontrado.`);
        }
    } catch (error) {
        console.error(`[FollowUp Analise] Erro ao remover follow-up para ${chatId}:`, error);
    }
}

async function readLocalConversationHistory(clientePath: string, chatId: string): Promise<string> {
    const cleanId = cleanChatId(chatId);
    const filePath = path.join(clientePath, `Chats`, `Historico`, cleanId, `${cleanId}.json`);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const messagesFromFile = JSON.parse(fileContent);
        if (Array.isArray(messagesFromFile)) {
            return messagesFromFile.map(m => `${m.type}: ${m.message}`).join('\n');
        }
        console.warn(`[readLocalConversationHistory] Conteúdo de ${filePath} não é um array de mensagens.`);
        return '';
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.info(`[readLocalConversationHistory] Arquivo de histórico local não encontrado em ${filePath}.`);
            return '';
        }
        console.error(`[readLocalConversationHistory] Erro ao ler histórico local ${filePath}:`, error);
        return '';
    }
}

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import fs from 'node:fs';
import path from 'node:path';

// Interface para configuração de bloqueio
interface IgnorarContatoConfig {
  ativar: boolean;
  tempo: string; // em horas, "0" para permanente
}

async function readJsonFile(filePath: string): Promise<any> {
    try {
        if (!existsSync(filePath)) {
            // Cria o arquivo com um objeto vazio se não existir
            writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
            return [];
        }
        const fileContent = readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Erro ao ler ou criar o arquivo JSON:', error);
        return null;
    }
}

async function getLastSendMessage(messages: any[]): Promise<string | undefined> {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].fromMe === true) {
            return messages[i].content;
        }
    }
    return undefined;
}


async function checkForExistingMessage(lastSendMessage: string | undefined, chatMessages: any[]): Promise<boolean> {

    if (!chatMessages || chatMessages.length === 0) {
        return true; // Retorna true se o arquivo não existir ou estiver vazio
    }

    const iaMessages = chatMessages.filter((msg) => msg.type === "IA");

    if (iaMessages.length === 0) {
        return true; // Retorna true se não houver mensagens da IA
    }


    const lastIAMessage = iaMessages[iaMessages.length - 1].message.trim();

    if (lastSendMessage && !lastIAMessage.includes(lastSendMessage.trim())) {
        return false; // Retorna false apenas se houver mensagens da IA e lastSendMessage não estiver contida na última
    }
    return true;
}


export async function IgnoreLead(chatId: string, __dirname: string): Promise<string | undefined> {
    const messagesPath = join(__dirname, 'Chats', 'Historico', chatId, 'messagesCheck.json');
    const chatMessagesPath = join(__dirname, 'Chats', 'Historico', chatId, `${chatId}.json`);

    try {
        const messages = await readJsonFile(messagesPath);
        const chatMessages = await readJsonFile(chatMessagesPath);


        if (!chatMessages) {
            return undefined; // Retorna undefined se o arquivo de histórico não existir
        }

        const lastSendMessage = await getLastSendMessage(messages);
        const result = await checkForExistingMessage(lastSendMessage, chatMessages);

        if (result) {
            console.log("IA ainda esta atendendo o cliente ou arquivo não encontrado, ou sem mensagens IA");
            return undefined;

        } else {

            console.log("Atendimento já em andamento pelo celular!");
            await adicionarChatIdIgnorado(chatId, __dirname);
            console.log(chatId + " Lead ignorado!");
            return chatId + " Lead ignorado!";
        }

    } catch (error) {
        console.error('Erro ao ler os arquivos:', error);
        return undefined;
    }
}

/**
 * Carrega configuração de bloqueio do cliente
 */
async function carregarConfigBloqueio(__dirname: string): Promise<IgnorarContatoConfig> {
  try {
    const infoClientePath = path.join(__dirname, 'config', 'infoCliente.json');
    const infoCliente = JSON.parse(fs.readFileSync(infoClientePath, 'utf-8'));

    if (infoCliente.IGNORAR_CONTATO && Array.isArray(infoCliente.IGNORAR_CONTATO)) {
      return infoCliente.IGNORAR_CONTATO[0];
    }

    // Fallback para configuração antiga
    return {
      ativar: infoCliente.IGNORAR_CONTATO === 'sim',
      tempo: infoCliente.IGNORAR_CONTATO === 'sim' ? "0" : "0"
    };
  } catch (error) {
    console.error('Erro ao carregar configuração de bloqueio:', error);
    return { ativar: false, tempo: "0" };
  }
}

/**
 * Adiciona chat ao sistema de bloqueio com timer se necessário
 */
async function adicionarChatIdIgnorado(chatId: string, __dirname: string) {
  const ignoredChatIdsFilePath = path.join(__dirname, 'config', 'ignoredChatIds.json');
  let ignoredChatIds: any[] = [];

  try {
    // Carrega configuração de bloqueio
    const configBloqueio = await carregarConfigBloqueio(__dirname);

    if (!configBloqueio.ativar) {
      console.log(`Bloqueio desativado na configuração para ${chatId}`);
      return;
    }

    if (fs.existsSync(ignoredChatIdsFilePath)) {
      const ignoredChatIdsFileContent = fs.readFileSync(ignoredChatIdsFilePath, 'utf-8');
      ignoredChatIds = JSON.parse(ignoredChatIdsFileContent);
      console.log(`Arquivo ignoredChatIds.json carregado com sucesso!`);
    } else {
      // Cria o arquivo com estrutura atualizada
      fs.writeFileSync(ignoredChatIdsFilePath, JSON.stringify([], null, 2), 'utf-8');
      console.log(`Arquivo ignoredChatIds.json criado com sucesso!`);
    }

    const tempoBloqueio = parseInt(configBloqueio.tempo);

    // Verifica se já está bloqueado
    const bloqueioExistente = ignoredChatIds.find((item: any) =>
      typeof item === 'object' && item.chatId === chatId
    );

    if (bloqueioExistente) {
      // Atualiza timestamp se necessário
      bloqueioExistente.timestamp = new Date().toISOString();
      bloqueioExistente.tempoBloqueio = tempoBloqueio;

      if (tempoBloqueio > 0) {
        bloqueioExistente.expiracao = new Date(Date.now() + tempoBloqueio * 60 * 60 * 1000).toISOString();
        console.log(`Bloqueio temporário atualizado para ${chatId}: ${tempoBloqueio}h`);
      } else {
        console.log(`Bloqueio permanente mantido para ${chatId}`);
      }
    } else {
      // Cria novo bloqueio
      const novoBloqueio: any = {
        chatId: chatId,
        timestamp: new Date().toISOString(),
        origem: 'stop_system'
      };

      if (tempoBloqueio > 0) {
        novoBloqueio.tempoBloqueio = tempoBloqueio;
        novoBloqueio.expiracao = new Date(Date.now() + tempoBloqueio * 60 * 60 * 1000).toISOString();
        console.log(`Novo bloqueio temporário para ${chatId}: ${tempoBloqueio}h`);
      } else {
        console.log(`Novo bloqueio permanente para ${chatId}`);
      }

      ignoredChatIds.push(novoBloqueio);
    }

    fs.writeFileSync(ignoredChatIdsFilePath, JSON.stringify(ignoredChatIds, null, 2), 'utf-8');
    console.log(`ChatId ${chatId} adicionado ao sistema de bloqueio com sucesso!`);

  } catch (error) {
    console.error('Erro ao gerenciar sistema de bloqueio:', error);
  }
}

/**
 * Verifica se um chat está bloqueado
 */
export async function verificarChatBloqueado(chatId: string, __dirname: string): Promise<boolean> {
  try {
    const configBloqueio = await carregarConfigBloqueio(__dirname);

    if (!configBloqueio.ativar) {
      return false; // Bloqueio desativado
    }

    const ignoredChatIdsFilePath = path.join(__dirname, 'config', 'ignoredChatIds.json');

    if (!fs.existsSync(ignoredChatIdsFilePath)) {
      return false;
    }

    const ignoredChatIdsContent = fs.readFileSync(ignoredChatIdsFilePath, 'utf-8');
    const ignoredChatIds = JSON.parse(ignoredChatIdsContent);

    const bloqueio = ignoredChatIds.find((item: any) =>
      typeof item === 'object' && item.chatId === chatId
    );

    if (!bloqueio) {
      return false; // Não está bloqueado
    }

    // Se tem tempo de bloqueio definido
    if (bloqueio.tempoBloqueio && bloqueio.tempoBloqueio > 0) {
      const agora = new Date();
      const expiracao = new Date(bloqueio.expiracao);

      if (agora > expiracao) {
        // Bloqueio expirou, remove da lista
        await removerBloqueioExpirado(chatId, __dirname);
        console.log(`Bloqueio expirado para ${chatId}`);
        return false;
      }

      console.log(`Chat ${chatId} bloqueado até ${expiracao.toLocaleString('pt-BR')}`);
      return true;
    }

    // Bloqueio permanente
    console.log(`Chat ${chatId} bloqueado permanentemente`);
    return true;

  } catch (error) {
    console.error('Erro ao verificar bloqueio:', error);
    return false;
  }
}

/**
 * Remove bloqueio expirado
 */
async function removerBloqueioExpirado(chatId: string, __dirname: string): Promise<void> {
  try {
    const ignoredChatIdsFilePath = path.join(__dirname, 'config', 'ignoredChatIds.json');
    const ignoredChatIdsContent = fs.readFileSync(ignoredChatIdsFilePath, 'utf-8');
    let ignoredChatIds = JSON.parse(ignoredChatIdsContent);

    // Remove apenas bloqueios expirados
    ignoredChatIds = ignoredChatIds.filter((item: any) => {
      if (typeof item === 'object' && item.chatId === chatId && item.expiracao) {
        const agora = new Date();
        const expiracao = new Date(item.expiracao);
        return agora <= expiracao; // Mantém se ainda não expirou
      }
      return true; // Mantém outros itens
    });

    fs.writeFileSync(ignoredChatIdsFilePath, JSON.stringify(ignoredChatIds, null, 2), 'utf-8');
    console.log(`Bloqueio expirado removido para ${chatId}`);

  } catch (error) {
    console.error('Erro ao remover bloqueio expirado:', error);
  }
}

  

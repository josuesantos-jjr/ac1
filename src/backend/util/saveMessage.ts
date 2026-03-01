import * as fs from 'fs';
import * as path from 'path';
import { cleanChatId } from './chatDataUtils.ts';
import { syncManager } from '../../database/sync.ts';



export async function saveMessageToFile(chatId: string, message: string, type: `User` | `IA`, __dirname: string, clientId?: string): Promise<void> {
    const cleanId = cleanChatId(chatId);
    const chatDir = path.join(__dirname, `Chats`, `Historico`, cleanId);
    const fileName = `${cleanId}.json`;
    const filePath = path.join(__dirname, `Chats`, `Historico`, `${cleanId}`, `${cleanId}.json`);
  
    // Cria o diretório se ele não existir
    if (!fs.existsSync(chatDir)) {
      console.log(`Criando diretório para o chatId:`, chatId);
      fs.mkdirSync(chatDir, { recursive: true });
    }
  
    // Cria o arquivo Dados.json se ele não existir
    const dadosFilePath = path.join(__dirname, `Chats`, `Historico`, `${cleanId}`, `Dados.json`);
    if (!fs.existsSync(dadosFilePath)) {
      console.log(`Criando arquivo Dados.json para o chatId:`, chatId);
      fs.writeFileSync(dadosFilePath, `{}`, `utf-8`); // Cria um arquivo vazio
    }
  
    // Formata a data e a hora
    const now = new Date();
    const date = now.toLocaleDateString(`pt-BR`);
    const time = now.toLocaleTimeString(`pt-BR`, { hour: `2-digit`, minute: `2-digit`, second: `2-digit` });
  
    // Formata a mensagem
    const formattedMessage = `${type === `User` ? `User` : `Model`} ${time}: ${message}`;

    // Cria o objeto JSON da mensagem
    const messageData = {
      date: date,
      time: time,
      type: type,
      message: message,
    };

    // 🔄 SALVAR NO SQLITE (se clientId fornecido)
    if (clientId) {
      try {
        // Preparar dados da mensagem para SQLite
        const sqliteMessageData = {
          chat_id: chatId,
          client_id: clientId,
          message_type: type === 'User' ? 'user' : 'bot',
          message_content: message,
          message_date: date,
          message_time: time,
          message_data: JSON.stringify(messageData)
        };

        // Usar syncManager para salvar no SQLite e manter sincronia
        await syncManager.saveClientData(clientId, {
          chats: {
            [chatId]: {
              messages: [messageData]
            }
          }
        });

        console.log(`✅ Mensagem salva no SQLite para chat ${chatId} (cliente: ${clientId})`);
      } catch (sqliteError) {
        console.error(`❌ Erro ao salvar mensagem no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    let messages: any[] = [];
    if (fs.existsSync(filePath)) {
      console.log(`Arquivo já existe, lendo conteúdo...`);

      const fileContent = fs.readFileSync(filePath, `utf-8`);
      messages = JSON.parse(fileContent);
    }

    // Adiciona a nova mensagem ao array
    messages.push(messageData);

    // Escreve o array JSON no arquivo
    console.log(`Escrevendo mensagem no arquivo JSON:`);
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), `utf-8`);
  }
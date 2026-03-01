import fs from 'node:fs';
import path from 'node:path';
import { syncManager } from '../../database/sync.ts';

/**
 * Limpa o chatId removendo prefixos e sufixos indesejados e garante formato correto.
 * @param chatId O chatId original (ex: 5519988675879@c.us_validation_1).
 * @returns O chatId limpo (ex: 5519988675879@c.us).
 */
export function cleanChatId(chatId: string): string {
  const baseChatId = chatId
    .replace(/^validation_/, '') // Remove prefixo validation_
    .replace(/_validation_\d+$/, '') // Remove sufixos _validation_1, _validation_2, etc.
    .replace(/@c\.us$/, ''); // Remove sufixo @c.us se presente
  return `${baseChatId}@c.us`;
}

/**
 * Atualiza a data da última mensagem recebida no arquivo dados.json de um chat.
 * @param clientePath O caminho base da pasta do cliente (ex: clientes/ativos/GlobalTur).
 * @param chatId O ID do chat (ex: 5511999999999@c.us).
 */
export async function updateLastReceivedMessageDate(clientePath: string, chatId: string): Promise<void> {
    const chatIdFormatted = cleanChatId(chatId).replace(/@c\.us$/, '');
    const dirPath = path.join(clientePath, 'Chats', 'Historico', `${chatIdFormatted}@c.us`);
    const filePathDados = path.join(dirPath, 'dados.json');

    try {
        // Verifica se o diretório e o arquivo dados.json existem
        if (!fs.existsSync(dirPath)) {
            console.warn(`[updateLastReceivedMessageDate] Diretório não encontrado para chatId: ${chatId}. Criando...`);
            fs.mkdirSync(dirPath, { recursive: true });
        }

        let dados = {};
        if (fs.existsSync(filePathDados)) {
            const data = fs.readFileSync(filePathDados, 'utf-8');
            if (data) {
                try {
                    dados = JSON.parse(data);
                } catch (error) {
                    console.error(`[updateLastReceivedMessageDate] Erro ao analisar dados.json para ${chatId}:`, error);
                    // Em caso de erro de parse, inicializa com um objeto básico para não perder tudo
                    dados = {
                        name: 'Não identificado',
                        number: chatId.split('@')[0],
                        tags: [],
                        listaNome: null,
                    };
                }
            }
        } else {
             console.log(`[updateLastReceivedMessageDate] Arquivo dados.json não encontrado para chatId: ${chatId}. Criando...`);
             // Se não existir, cria um novo objeto com a estrutura desejada
             dados = {
                 name: 'Não identificado',
                 number: chatId.split('@')[0],
                 tags: [],
                 listaNome: null,
             };
        }

        // Atualiza a data da última mensagem recebida
        (dados as any).data_ultima_mensagem_recebida = new Date().toISOString();

        // 🔄 SALVAR NO SQLITE (sincronização automática)
        // Extrair o nome do cliente do caminho de forma compatível com Windows
        let clientId = 'default';
        if (clientePath.includes('clientes')) {
          // Para caminhos como C:\Users\Usuario\Desktop\AC-pc\clientes\CMW
          // ou /home/user/AC-pc/clientes/CMW
          const pathParts = clientePath.split(/[\\/]/); // Suporta ambas as barras
          const clientesIndex = pathParts.findIndex(part => part === 'clientes');
          if (clientesIndex !== -1 && pathParts[clientesIndex + 1]) {
            clientId = pathParts[clientesIndex + 1];
          }
        } else {
          // Para caminhos diretos sem 'clientes'
          const pathParts = clientePath.split(/[\\/]/);
          clientId = pathParts[pathParts.length - 1] || 'default';
        }
        
        try {
          await syncManager.saveClientData(clientId, {
            chats: { [chatId]: { data_ultima_mensagem_recebida: (dados as any).data_ultima_mensagem_recebida } }
          });
          console.log(`[chatDataUtils] Dados de última mensagem recebida salvos no SQLite para ${clientId}:${chatId}`);
        } catch (sqliteError) {
          console.error(`[chatDataUtils] Erro ao salvar no SQLite:`, sqliteError);
          // Continua com o salvamento JSON mesmo se SQLite falhar
        }

        // 📄 SALVAR NO JSON (manter funcionalidade original)
        fs.writeFileSync(filePathDados, JSON.stringify(dados, null, 2), 'utf-8');
        // console.log(`[updateLastReceivedMessageDate] Data da última mensagem recebida atualizada para ${chatId}.`);

    } catch (error) {
        console.error(`[updateLastReceivedMessageDate] Erro ao atualizar dados.json para ${chatId}:`, error);
    }
}

/**
 * Atualiza a data da última mensagem enviada no arquivo dados.json de um chat.
 * @param clientePath O caminho base da pasta do cliente (ex: clientes/ativos/GlobalTur).
 * @param chatId O ID do chat (ex: 5511999999999@c.us).
 */
export async function updateLastSentMessageDate(clientePath: string, chatId: string): Promise<void> {
      const chatIdFormatted = cleanChatId(chatId).replace(/@c\.us$/, '');
      const dirPath = path.join(clientePath, 'Chats', 'Historico', `${chatIdFormatted}@c.us`);
      const filePathDados = path.join(dirPath, 'dados.json');

     try {
         // Verifica se o diretório e o arquivo dados.json existem
         if (!fs.existsSync(dirPath)) {
             console.warn(`[updateLastSentMessageDate] Diretório não encontrado para chatId: ${chatId}. Criando...`);
             fs.mkdirSync(dirPath, { recursive: true });
         }

         let dados = {};
         if (fs.existsSync(filePathDados)) {
             const data = fs.readFileSync(filePathDados, 'utf-8');
             if (data) {
                 try {
                     dados = JSON.parse(data);
                 } catch (error) {
                     console.error(`[updateLastSentMessageDate] Erro ao analisar dados.json para ${chatId}:`, error);
                     // Em caso de erro de parse, inicializa com um objeto básico para não perder tudo
                     dados = {
                         name: 'Não identificado',
                         number: chatId.split('@')[0],
                         tags: [],
                         listaNome: null,
                     };
                 }
             }
         } else {
              console.log(`[updateLastSentMessageDate] Arquivo dados.json não encontrado para chatId: ${chatId}. Criando...`);
              // Se não existir, cria um novo objeto com a estrutura desejada
              dados = {
                  name: 'Não identificado',
                  number: chatId.split('@')[0],
                  tags: [],
                  listaNome: null,
              };
         }

         // Atualiza a data da última mensagem enviada
         (dados as any).data_ultima_mensagem_enviada = new Date().toISOString();
 
         // 🔄 SALVAR NO SQLITE (sincronização automática)
         // Extrair o nome do cliente do caminho de forma compatível com Windows
         let clientId = 'default';
         if (clientePath.includes('clientes')) {
           // Para caminhos como C:\Users\Usuario\Desktop\AC-pc\clientes\CMW
           // ou /home/user/AC-pc/clientes/CMW
           const pathParts = clientePath.split(/[\\/]/); // Suporta ambas as barras
           const clientesIndex = pathParts.findIndex(part => part === 'clientes');
           if (clientesIndex !== -1 && pathParts[clientesIndex + 1]) {
             clientId = pathParts[clientesIndex + 1];
           }
         } else {
           // Para caminhos diretos sem 'clientes'
           const pathParts = clientePath.split(/[\\/]/);
           clientId = pathParts[pathParts.length - 1] || 'default';
         }
         
         try {
           await syncManager.saveClientData(clientId, {
             chats: { [chatId]: { data_ultima_mensagem_enviada: (dados as any).data_ultima_mensagem_enviada } }
           });
           console.log(`[chatDataUtils] Dados de última mensagem enviada salvos no SQLite para ${clientId}:${chatId}`);
         } catch (sqliteError) {
           console.error(`[chatDataUtils] Erro ao salvar no SQLite:`, sqliteError);
           // Continua com o salvamento JSON mesmo se SQLite falhar
         }
 
         // 📄 SALVAR NO JSON (manter funcionalidade original)
         fs.writeFileSync(filePathDados, JSON.stringify(dados, null, 2), 'utf-8');
         // console.log(`[updateLastSentMessageDate] Data da última mensagem enviada atualizada para ${chatId}.`);

     } catch (error) {
         console.error(`[updateLastSentMessageDate] Erro ao atualizar dados.json para ${chatId}:`, error);
     }
}
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const chatId = searchParams.get('chatId'); // Opcional - para filtrar chat específico

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    const clientPath = path.join(process.cwd(), 'clientes', clientId);
    const chatsHistoryPath = path.join(clientPath, 'Chats', 'Historico');

    console.log(`[API chat-history] Buscando conversas para cliente: ${clientId}`);

    // Verificar se o diretório de histórico existe
    if (!fs.existsSync(chatsHistoryPath)) {
      console.log(`[API chat-history] Diretório de histórico não encontrado para ${clientId}`);
      return NextResponse.json({
        conversations: [],
        message: 'Nenhuma conversa encontrada'
      });
    }

    const conversations = [];
    const chatDirs = fs.readdirSync(chatsHistoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`[API chat-history] Encontrados ${chatDirs.length} diretórios de chat`);

    for (const chatDir of chatDirs) {
      try {
        // Se chatId específico foi solicitado, pular outros
        if (chatId && !chatDir.includes(chatId.replace('@c.us', ''))) {
          continue;
        }

        const chatPath = path.join(chatsHistoryPath, chatDir);
        const messagesFile = path.join(chatPath, `${chatDir}.json`);
        const dadosFile = path.join(chatPath, 'Dados.json');

        // Verificar se o arquivo de mensagens existe
        if (!fs.existsSync(messagesFile)) {
          continue;
        }

        // Ler mensagens
        const messagesData = fs.readFileSync(messagesFile, 'utf-8');
        let messages = [];
        try {
          messages = JSON.parse(messagesData);
        } catch (parseError) {
          console.error(`[API chat-history] Erro ao fazer parse das mensagens ${chatDir}:`, parseError);
          continue;
        }

        // Ler dados do contato
        let contactInfo = {
          name: 'Não identificado',
          phone: chatDir.split('@')[0] || chatDir,
          avatar: null
        };

        if (fs.existsSync(dadosFile)) {
          try {
            const dadosData = fs.readFileSync(dadosFile, 'utf-8');
            const dados = JSON.parse(dadosData);
            contactInfo = {
              name: dados.name || contactInfo.name,
              phone: dados.number || contactInfo.phone,
              avatar: dados.avatar || null
            };
          } catch (dadosError) {
            console.warn(`[API chat-history] Erro ao ler dados do contato ${chatDir}:`, dadosError);
          }
        }

        // Processar mensagens para o formato adequado
        const processedMessages = messages.map((msg, index) => {
          // Combinar date e time para timestamp
          let timestamp = Date.now();
          if (msg.date && msg.time) {
            try {
              // Formato brasileiro DD/MM/YYYY + HH:MM:SS
              const dateParts = msg.date.split('/');
              if (dateParts.length === 3) {
                const dateStr = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}T${msg.time}`;
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                  timestamp = parsedDate.getTime();
                }
              }
            } catch (dateError) {
              console.warn(`[API chat-history] Erro ao fazer parse da data "${msg.date} ${msg.time}":`, dateError);
              // Mantém timestamp = Date.now()
            }
          }

          return {
            id: msg.id || `${chatDir}_${index}`,
            body: msg.body || msg.message || '',
            from: msg.type === 'User' ? 'User' : msg.type || 'IA',
            timestamp: timestamp,
            type: msg.type || 'chat',
            isFromClient: msg.type === 'User'
          };
        });

        // Ordenar mensagens por timestamp
        processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        conversations.push({
          chatId: chatDir,
          clientId: clientId,
          contactInfo: contactInfo,
          messages: processedMessages,
          messageCount: processedMessages.length,
          lastMessage: processedMessages.length > 0 ? processedMessages[processedMessages.length - 1] : null
        });

      } catch (chatError) {
        console.error(`[API chat-history] Erro ao processar chat ${chatDir}:`, chatError);
        // Continua processando outros chats
      }
    }

    // Ordenar conversas pela última mensagem (mais recente primeiro)
    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp) : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp) : 0;
      return bTime - aTime;
    });

    console.log(`[API chat-history] Retornando ${conversations.length} conversas`);

    return NextResponse.json({
      conversations: conversations,
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((total, conv) => total + conv.messageCount, 0)
    });

  } catch (error) {
    console.error('[API chat-history] Erro geral:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor ao buscar conversas',
      conversations: [],
      totalConversations: 0,
      totalMessages: 0
    }, { status: 500 });
  }
}
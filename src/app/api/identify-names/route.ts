import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { clientId, chatId } = await request.json();

    if (!clientId) {
      return NextResponse.json({
        error: 'clientId é obrigatório'
      }, { status: 400 });
    }

    console.log(`[API identify-names] Iniciando identificação de nome para cliente: ${clientId}, chatId: ${chatId || 'todos'}`);

    // Carregar dados da conversa para identificação
    const historicoPath = path.join(process.cwd(), 'clientes', clientId, 'Chats', 'Historico');

    if (!fs.existsSync(historicoPath)) {
      return NextResponse.json({
        error: `Diretório de histórico não encontrado: ${historicoPath}`
      }, { status: 404 });
    }

    const chatDirs = fs.readdirSync(historicoPath);
    let processedContacts = 0;
    let identifiedContacts = 0;

    for (const chatDir of chatDirs) {
      // Se chatId específico foi fornecido, processar apenas esse
      if (chatId && chatDir !== `${chatId}@c.us`) {
        continue;
      }

      const dadosPath = path.join(historicoPath, chatDir, 'Dados.json');
      const messagesPath = path.join(historicoPath, chatDir, 'messagesCheck.json');

      if (!fs.existsSync(dadosPath)) {
        console.log(`[API identify-names] Dados.json não encontrado para ${chatDir}`);
        continue;
      }

      try {
        const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));

        // Verificar se já tem nome identificado
        if (dados.nome_identificado && dados.nome_identificado !== 'Não identificado') {
          console.log(`[API identify-names] ${chatDir} já tem nome identificado: ${dados.nome_identificado}`);
          continue;
        }

        processedContacts++;

        // Carregar mensagens para análise
        let messages = [];
        if (fs.existsSync(messagesPath)) {
          try {
            const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
            messages = messagesData.messages || [];
          } catch (error: any) {
            console.log(`[API identify-names] Erro ao carregar mensagens de ${chatDir}:`, error?.message || error);
          }
        }

        // Usar IA para identificar nome
        const identifiedName = await identifyNameFromMessages(messages, dados.telefone);

        if (identifiedName && identifiedName !== 'Não identificado') {
          // Atualizar dados.json
          dados.nome_identificado = identifiedName;
          dados.nome = identifiedName;
          dados.data_ultima_analise = new Date().toISOString();

          // Salvar arquivo atualizado
          fs.writeFileSync(dadosPath, JSON.stringify(dados, null, 2));

          identifiedContacts++;
          console.log(`[API identify-names] Nome identificado para ${chatDir}: ${identifiedName}`);
        } else {
          console.log(`[API identify-names] Não foi possível identificar nome para ${chatDir}`);
        }

      } catch (error: any) {
        console.error(`[API identify-names] Erro ao processar ${chatDir}:`, error?.message || error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído. ${processedContacts} contatos processados, ${identifiedContacts} nomes identificados.`,
      stats: {
        processed: processedContacts,
        identified: identifiedContacts
      }
    });

  } catch (error) {
    console.error('[API identify-names] Erro geral:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: (error as any)?.message || String(error)
    }, { status: 500 });
  }
}

// Função para identificar nome nas mensagens usando análise simples
async function identifyNameFromMessages(messages: any[], telefone: string): Promise<string> {
  try {
    // Estratégias simples de identificação de nome:

    // 1. Procurar por saudações comuns
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'eae', 'e aí'];
    const namePatterns = [];

    for (const message of messages.slice(0, 20)) { // Analisar apenas primeiras 20 mensagens
      if (!message.body || !message.isFromClient) continue; // Apenas mensagens do cliente

      const body = message.body.toLowerCase().trim();

      // Procurar por padrões como "oi sou João", "me chamo Maria", etc.
      const nameMatches = body.match(/(?:oi|olá|ola|bom dia|boa tarde|boa noite|me chamo|sou|eu sou|e aí)\s+([A-Za-zÀ-ÿ\s]{2,30})/i);

      if (nameMatches && nameMatches[1]) {
        const potentialName = nameMatches[1].trim();
        // Validar se parece um nome (não é muito longo, não contém números, etc.)
        if (potentialName.length <= 30 && !/\d/.test(potentialName) && potentialName.split(' ').length <= 3) {
          namePatterns.push(potentialName);
        }
      }
    }

    // Contar frequência dos nomes encontrados
    const nameCount: { [key: string]: number } = {};
    namePatterns.forEach(name => {
      const cleanName = name.replace(/[^\w\sÀ-ÿ]/g, '').trim();
      if (cleanName.length >= 2) {
        nameCount[cleanName] = (nameCount[cleanName] || 0) + 1;
      }
    });

    // Retornar o nome mais frequente
    let bestName: string | null = null;
    let maxCount = 0;

    Object.keys(nameCount).forEach(name => {
      const count = nameCount[name];
      if (count > maxCount) {
        maxCount = count;
        bestName = name;
      }
    });

    // Se encontrou nome com frequência > 1, usar ele
    if (bestName && maxCount > 1) {
      const nameStr = String(bestName);
      return nameStr.charAt(0).toUpperCase() + nameStr.slice(1).toLowerCase();
    }

    // Fallback: usar primeira letra do telefone como placeholder
    return 'Não identificado';

  } catch (error) {
    console.error('[identifyNameFromMessages] Erro:', error);
    return 'Não identificado';
  }
}
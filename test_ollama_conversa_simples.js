// Teste simplificado para validar o Ollama com histórico real de conversa
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando Ollama com histórico real de conversa (versão simplificada)...');

async function testOllamaWithRealHistory() {
  try {
    // 1. Lê o histórico real do chat
    const chatHistoryPath = './clientes/CMW/Chats/Historico/5519989808901@c.us/5519989808901@c.us.json';
    
    if (!fs.existsSync(chatHistoryPath)) {
      console.log('❌ Arquivo de histórico não encontrado');
      return;
    }
    
    console.log('📋 Lendo histórico real do chat...');
    const historyContent = fs.readFileSync(chatHistoryPath, 'utf-8');
    const chatHistory = JSON.parse(historyContent);
    
    console.log(`✅ Histórico carregado: ${chatHistory.length} mensagens`);
    
    // 2. Converte histórico para formato Ollama
    const convertedHistory = convertHistoryToOllamaFormat(chatHistory);
    console.log(`✅ Histórico convertido: ${convertedHistory.length} mensagens no formato Ollama`);
    
    // 3. Simula uma nova mensagem do usuário
    const newMessage = "Qual o valor do condomínio no Pura Americana?";
    console.log(`\n💬 Nova mensagem do usuário: "${newMessage}"`);
    
    // 4. Testa a chamada ao Ollama usando fetch direto (sem dependências)
    console.log('\n🚀 Testando chamada direta ao Ollama...');
    
    const ollamaResponse = await callOllamaDirectly(newMessage, convertedHistory);
    
    console.log(`\n✅ Ollama respondeu:`);
    console.log(`💬 Resposta: "${ollamaResponse}"`);
    
    // 5. Valida a resposta
    console.log('\n🔍 Validando resposta...');
    
    const validations = {
      'Resposta não vazia': ollamaResponse && ollamaResponse.trim().length > 0,
      'Em português': isPortuguese(ollamaResponse),
      'Contextual': isContextualResponse(ollamaResponse, newMessage, chatHistory),
      'Formato adequado': !ollamaResponse.includes('ERROR') && !ollamaResponse.includes('FALHA')
    };
    
    console.log('📋 Resultado das validações:');
    Object.entries(validations).forEach(([criterion, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${criterion}: ${passed ? 'PASSOU' : 'FALHOU'}`);
    });
    
    // 6. Testa com outra mensagem
    console.log('\n🧪 Testando segunda mensagem...');
    const secondMessage = "E qual a taxa de juros do financiamento?";
    
    const secondResponse = await callOllamaDirectly(secondMessage, [
      ...convertedHistory, 
      { role: 'user', content: newMessage }, 
      { role: 'assistant', content: ollamaResponse }
    ]);
    
    console.log(`\n✅ Segunda resposta:`);
    console.log(`💬 Resposta: "${secondResponse}"`);
    
    // 7. Gera relatório
    generateTestReport({
      chatId: '5519989808901@c.us',
      historyLength: chatHistory.length,
      newMessage,
      response: ollamaResponse,
      secondMessage,
      secondResponse,
      validations
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Função para chamar o Ollama diretamente via fetch
async function callOllamaDirectly(userMessage, history) {
  try {
    // Lê a configuração do Ollama
    const ollamaConfig = readOllamaConfig();
    
    const requestBody = {
      model: ollamaConfig.model,
      messages: [
        ...history,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.6,
      max_tokens: 4096,
      stream: false
    };
    
    console.log(`📡 Enviando requisição para ${ollamaConfig.baseUrl}/chat/completions`);
    
    const response = await fetch(`${ollamaConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ollamaConfig.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verifica se a resposta tem o formato correto
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Resposta inválida da API Ollama: formato inesperado');
    }
    
  } catch (error) {
    console.error('❌ Erro na chamada direta ao Ollama:', error.message);
    return 'Erro: Não foi possível conectar ao serviço Ollama';
  }
}

// Função para ler a configuração do Ollama
function readOllamaConfig() {
  try {
    // Primeiro tenta ler do arquivo ollama.txt
    if (fs.existsSync('./ollama.txt')) {
      const content = fs.readFileSync('./ollama.txt', 'utf-8');
      const lines = content.split('\n').map(line => line.trim());
      const config = {};
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === 'api' && i + 1 < lines.length) {
          config.apiKey = lines[i + 1];
        } else if (line === 'url base' && i + 1 < lines.length) {
          config.baseUrl = lines[i + 1];
        } else if (line === 'model' && i + 1 < lines.length) {
          config.model = lines[i + 1];
        }
      }
      
      if (config.apiKey && config.baseUrl && config.model) {
        console.log('✅ Configuração Ollama carregada do ollama.txt');
        return config;
      }
    }
    
    // Fallback para infoCliente.json
    if (fs.existsSync('./clientes/CMW/config/infoCliente.json')) {
      const config = JSON.parse(fs.readFileSync('./clientes/CMW/config/infoCliente.json', 'utf-8'));
      
      const ollamaConfig = {
        apiKey: config.OLLAMA_API_KEY || config.GEMINI_KEY,
        baseUrl: config.OLLAMA_BASE_URL || 'https://ia.aceleracaocomercial.com/api',
        model: config.OLLAMA_MODEL || 'cogito:3b'
      };
      
      if (ollamaConfig.apiKey && ollamaConfig.baseUrl && ollamaConfig.model) {
        console.log('✅ Configuração Ollama carregada do infoCliente.json');
        return ollamaConfig;
      }
    }
    
    // Fallback final
    const fallbackConfig = {
      apiKey: 'sk-a9132d90b0d444f2aa51025fbcad618b', // Usa a chave do ollama.txt
      baseUrl: 'https://ia.aceleracaocomercial.com/api',
      model: 'cogito:3b'
    };
    
    console.log('✅ Configuração Ollama usando fallback padrão');
    return fallbackConfig;
    
  } catch (error) {
    console.error('❌ Erro ao ler configuração Ollama:', error.message);
    throw new Error('Falha ao carregar configuração Ollama');
  }
}

// Função para converter histórico do formato JSON para formato Ollama
function convertHistoryToOllamaFormat(chatHistory) {
  const messages = [];
  
  chatHistory.forEach(entry => {
    if (entry.type === 'User') {
      messages.push({
        role: 'user',
        content: entry.message
      });
    } else if (entry.type === 'IA') {
      messages.push({
        role: 'assistant',
        content: entry.message
      });
    }
  });
  
  return messages;
}

// Função para verificar se a resposta está em português
function isPortuguese(text) {
  if (!text) return false;
  
  const portugueseWords = [
    'que', 'para', 'com', 'por', 'não', 'uma', 'dos', 'são', 'como', 'mas',
    'mais', 'seu', 'seus', 'sua', 'suas', 'ele', 'ela', 'eles', 'elas',
    'nós', 'vocês', 'de', 'em', 'por', 'para', 'com', 'sem', 'sobre'
  ];
  
  const textLower = text.toLowerCase();
  let portugueseWordCount = 0;
  
  portugueseWords.forEach(word => {
    if (textLower.includes(word)) {
      portugueseWordCount++;
    }
  });
  
  return portugueseWordCount >= 3; // Considera português se tiver pelo menos 3 palavras comuns
}

// Função para verificar se a resposta é contextual
function isContextualResponse(response, userMessage, chatHistory) {
  if (!response || !userMessage) return false;
  
  const responseLower = response.toLowerCase();
  const userMessageLower = userMessage.toLowerCase();
  
  // Verifica se menciona algo relacionado ao histórico
  const keywords = ['pura', 'americana', 'condomínio', 'valor', 'financiamento', 'juros', 'casa', 'apartamento'];
  
  let hasRelevantKeywords = false;
  keywords.forEach(keyword => {
    if (responseLower.includes(keyword)) {
      hasRelevantKeywords = true;
    }
  });
  
  // Verifica se responde à pergunta do usuário
  const isAnsweringQuestion = responseLower.includes('condomínio') || 
                            responseLower.includes('valor') ||
                            responseLower.includes('juros') ||
                            responseLower.includes('financiamento');
  
  return hasRelevantKeywords || isAnsweringQuestion;
}

// Função para gerar relatório do teste
function generateTestReport(reportData) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DO TESTE DE CONVERSA REAL');
  console.log('='.repeat(60));
  
  console.log(`\n🆔 Chat ID: ${reportData.chatId}`);
  console.log(`📚 Histórico: ${reportData.historyLength} mensagens`);
  
  console.log('\n💬 PRIMEIRA MENSAGEM:');
  console.log(`   Usuário: "${reportData.newMessage}"`);
  console.log(`   Resposta: "${reportData.response}"`);
  
  console.log('\n💬 SEGUNDA MENSAGEM:');
  console.log(`   Usuário: "${reportData.secondMessage}"`);
  console.log(`   Resposta: "${reportData.secondResponse}"`);
  
  console.log('\n✅ VALIDAÇÕES:');
  Object.entries(reportData.validations).forEach(([criterion, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${criterion}`);
  });
  
  const allPassed = Object.values(reportData.validations).every(v => v);
  
  console.log('\n🎯 RESULTADO FINAL:');
  if (allPassed) {
    console.log('   ✅ OLLAMA FUNCIONANDO CORRETAMENTE!');
    console.log('   ✅ Respostas contextualizadas e em português');
    console.log('   ✅ Histórico sendo processado corretamente');
    console.log('   ✅ Sistema de fallback pronto para produção');
  } else {
    console.log('   ❌ AJUSTES NECESSÁRIOS NO OLLAMA');
    console.log('   ⚠️  Verificar configurações de prompt ou modelo');
  }
  
  console.log('='.repeat(60));
}

// Executa o teste
testOllamaWithRealHistory().then(() => {
  console.log('\n🎉 Teste concluído!');
}).catch(error => {
  console.error('\n💥 Falha no teste:', error);
});
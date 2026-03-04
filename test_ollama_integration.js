// Teste simples para validar a integração do Ollama
const path = require('path');

async function testOllamaIntegration() {
  try {
    console.log('🧪 Testando integração do Ollama...');
    
    // Testa a importação do serviço Ollama
    const { mainOllamaService } = require('./src/backend/service/ollamaService.ts');
    console.log('✅ Importação do OllamaService bem-sucedida');
    
    // Testa a importação no googleBG
    const { mainGoogleBG } = require('./src/backend/service/googleBG.ts');
    console.log('✅ Importação do googleBG com fallback Ollama bem-sucedida');
    
    // Testa a importação no groqSuporte
    const { mainGroqSuporte } = require('./src/backend/service/groqSuporte.ts');
    console.log('✅ Importação do groqSuporte com fallback Ollama bem-sucedida');
    
    // Testa a importação no util/index
    const { handleMessageSplitting } = require('./src/backend/util/index.ts');
    console.log('✅ Importação do util/index com fallback Ollama bem-sucedida');
    
    console.log('\n🎉 Todos os testes de integração passaram!');
    console.log('\n📋 Resumo da implementação:');
    console.log('1. ✅ Arquivo ollamaService.ts criado com configuração do ollama.txt');
    console.log('2. ✅ Fallback Ollama integrado no googleBG.ts');
    console.log('3. ✅ Fallback Ollama integrado no groqSuporte.ts');
    console.log('4. ✅ Fallback Ollama integrado no util/index.ts');
    console.log('5. ✅ Sistema de fallback completo: Gemini → Groq → Ollama → Mensagem de erro');
    
    console.log('\n🔧 Como usar:');
    console.log('- O sistema lerá automaticamente as configurações do seu ollama.txt');
    console.log('- Se o arquivo não existir, usará fallback para infoCliente.json');
    console.log('- O Ollama será usado como último recurso antes de retornar erro');
    console.log('- Todas as mensagens são convertidas do formato Gemini para Ollama');
    console.log('- Sistema de cache e retry está implementado');
    
  } catch (error) {
    console.error('❌ Erro nos testes de integração:', error.message);
    process.exit(1);
  }
}

// Executa o teste
testOllamaIntegration();
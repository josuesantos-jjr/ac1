import { exec } from 'child_process';
import net from 'net';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const PORT = 3000;
let ngrokInstance = null;

let nextProcess = null;
let ngrokProcess = null;
let ngrokStarted = false;

// Função para verificar se a porta está ativa
function checkPortActive(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ port: port, host: '127.0.0.1' }, () => {
      client.end();
      resolve(true);
    });
    client.on('error', () => {
      resolve(false);
    });
  });
}

// Função para aguardar a porta estar realmente pronta
async function waitForPortReady(port, maxAttempts = 60, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    const isActive = await checkPortActive(port);
    if (isActive) {
      // Aguardar mais um pouco para garantir que o servidor está respondendo
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Função para iniciar Next.js
async function startNext() {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
  console.log('Iniciando Next.js na porta 3000...');

  return new Promise((resolve, reject) => {
    nextProcess = exec('bun pm2 start src/next-app.js -f', (error, stdout, stderr) => {
      if (error) {
        console.error('Erro ao iniciar Next.js:', error);
        reject(error);
        return;
      }
      console.log('Next.js iniciado com sucesso');
    });

    nextProcess.stdout.on('data', (data) => {
      console.log('Next.js stdout:', data);
    });

    nextProcess.stderr.on('data', (data) => {
      console.error('Next.js stderr:', data);
    });

    // Aguardar até a porta estar ativa, com timeout de 60 segundos
    waitForPortReady(PORT, 60, 1000)
      .then((ready) => {
        if (ready) {
          console.log('✅ Next.js está rodando e porta 3000 está ativa');
          resolve();
        } else {
          reject(new Error('Timeout aguardando Next.js ficar pronto'));
        }
      })
      .catch(reject);
  });
}

// Função para iniciar Ngrok usando comando direto
async function startNgrok() {
  return new Promise(async (resolve, reject) => {
    if (ngrokStarted) {
      console.log('Ngrok já foi iniciado anteriormente, pulando...');
      resolve();
      return;
    }

    try {
      // Verificar se token está configurado
      const ngrokToken = process.env.NGROK_AUTH_TOKEN;
      if (!ngrokToken) {
        console.log('⚠️  Token do Ngrok não encontrado. Sistema funcionará localmente.');
        console.log('Para usar ngrok, configure NGROK_AUTH_TOKEN no arquivo .env');
        resolve();
        return;
      }

      console.log('Iniciando Ngrok na porta 3000...');
      
      // Verificar se a porta está acessível antes de iniciar o Ngrok
      const portActive = await checkPortActive(PORT);
      if (!portActive) {
        console.log('❌ Porta 3000 não está ativa. Aguardando Next.js...');
        const portReady = await waitForPortReady(PORT, 30, 1000);
        if (!portReady) {
          console.log('❌ Timeout aguardando porta 3000. Ngrok não será iniciado.');
          resolve();
          return;
        }
      }

      // Parar qualquer processo ngrok existente
      try {
        exec('pkill -f ngrok', (error) => {
          if (!error) {
            console.log('🔒 Processos ngrok anteriores terminados');
          }
        });
        // Aguardar um pouco para garantir que os processos foram terminados
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Ignorar erros de limpeza
      }

      console.log('🚀 Iniciando ngrok com comando direto...');
      
      // Configurar token primeiro
      const authCommand = `ngrok config add-authtoken ${ngrokToken}`;
      exec(authCommand, (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  Aviso ao configurar token:', error.message);
        } else {
          console.log('✅ Token Ngrok configurado');
        }
        
        // Agora iniciar ngrok na porta 3000
        ngrokProcess = exec('ngrok http 3000', (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Erro ao executar ngrok:', error);
            console.log('Sistema funcionará localmente sem ngrok.');
            resolve();
            return;
          }
        });

        ngrokProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('Ngrok stdout:', output.trim());
          
          // Procurar pela URL do túnel
          const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok\.io/);
          if (urlMatch && !ngrokStarted) {
            ngrokInstance = urlMatch[0];
            ngrokStarted = true;
            console.log(`🎉 Túnel Ngrok ativo: ${ngrokInstance}`);
          }
        });

        ngrokProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.log('Ngrok stderr:', error.trim());
          
          // Verificar se há erro de túnel inválido
          if (error.includes('invalid tunnel configuration')) {
            console.log('❌ Configuração de túnel inválida detectada');
          }
        });

        // Aguardar alguns segundos para o ngrok iniciar
        setTimeout(() => {
          if (!ngrokStarted) {
            console.log('⏳ Aguardando ngrok inicializar...');
          }
        }, 5000);

        resolve();
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar Ngrok:', error.message);
      console.log('Sistema funcionará localmente sem ngrok.');
      resolve();
    }
  });
}

// Função para parar processos
async function stopProcesses() {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
  if (ngrokProcess) {
    ngrokProcess.kill();
    ngrokProcess = null;
  }
  
  // Também tentar matar processos ngrok pelo nome
  try {
    exec('pkill -f ngrok', (error) => {
      if (!error) {
        console.log('🔒 Túnel Ngrok fechado');
      }
    });
  } catch (error) {
    console.error('Erro ao fechar túnel Ngrok:', error);
  }
  
  ngrokInstance = null;
}

// Função de monitoramento principal
async function monitor() {
  try {
    // Verificar se porta 3000 está ativa
    const portActive = await checkPortActive(PORT);
    if (!portActive) {
      console.log('Porta 3000 não está ativa. Reiniciando Next.js...');
      await startNext();
    } else {
      console.log('Porta 3000 está ativa.');
    }

  } catch (error) {
    console.error('Erro no monitoramento:', error);
  }
}

// Função principal
async function main() {
  console.log('Iniciando monitoramento de serviços...');

  try {
    // Iniciar Next.js primeiro e aguardar estar pronto
    console.log('🔄 Iniciando e aguardando Next.js ficar pronto...');
    await startNext();
    
    // Aguardar um pouco para Next.js estabilizar completamente
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Iniciar Ngrok apenas após Next.js estar pronto
    console.log('🔄 Iniciando Ngrok...');
    await startNgrok();

    // Verificação inicial e monitoramento contínuo a cada 30 segundos
    await monitor();
    setInterval(async () => {
      await monitor();
    }, 30000);

  } catch (error) {
    console.error('Erro na inicialização:', error);
    process.exit(1);
  }

  // Tratamento de sinais para parar processos
  process.on('SIGINT', async () => {
    console.log('Recebido SIGINT. Parando processos...');
    await stopProcesses();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM. Parando processos...');
    await stopProcesses();
    process.exit(0);
  });
}

// Iniciar
main().catch(console.error);

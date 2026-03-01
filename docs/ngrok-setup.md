# Script Único para Ngrok + Next.js

## Objetivo
Criar um único script que configure o Ngrok e inicie o Next.js na porta 3000.

## Implementação Proposta

```javascript
#!/usr/bin/env node

import ngrok from 'ngrok';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Carregar variáveis do .env
dotenv.config();

const port = process.env.PORT || 3000;
const token = process.env.NGROK_AUTH_TOKEN;

async function startServer() {
  try {
    // Verificar token
    if (!token) {
      console.error('❌ Token do Ngrok não encontrado no .env');
      process.exit(1);
    }

    // Configurar Ngrok
    await ngrok.authtoken(token);
    
    // Iniciar túnel
    const url = await ngrok.connect({
      addr: port,
      onStatusChange: (status) => {
        console.log(`📊 Status Ngrok: ${status}`);
      }
    });

    console.log(`🎉 Túnel Ngrok ativo: ${url}`);

    // Iniciar Next.js
    const next = spawn('next', ['start'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: port }
    });

    // Tratamento de erros e finalização
    next.on('close', async (code) => {
      console.log(`\n📴 Next.js finalizado (${code})`);
      await ngrok.kill();
      process.exit(code);
    });

    process.on('SIGINT', async () => {
      console.log('\n📴 Encerrando servidor...');
      await ngrok.kill();
      next.kill('SIGINT');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await ngrok.kill();
    process.exit(1);
  }
}

startServer();
```

## Como usar

1. Certifique-se que o token do Ngrok está no `.env`:
```env
NGROK_AUTH_TOKEN=seu_token_aqui
PORT=3000
```

2. Execute o script:
```bash
node src/scripts/start-ngrok.js
```

## Funcionalidades

- ✅ Lê token do arquivo .env
- ✅ Inicia túnel Ngrok na porta 3000
- ✅ Inicia servidor Next.js
- ✅ Monitora status do Ngrok
- ✅ Tratamento de erros
- ✅ Shutdown limpo (CTRL+C)

## Próximos Passos

1. Mudar para modo Code
2. Implementar o script conforme especificação acima
3. Testar execução
4. Verificar tratamento de erros
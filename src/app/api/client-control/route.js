import { NextResponse } from 'next/server';
import pm2 from 'pm2';
import path from 'path';
import fs from 'fs';

// Função para obter o nome real do cliente do infoCliente.json
function getClientName(clientId) {
  try {
    const infoClientePath = path.join(process.cwd(), 'clientes', clientId, 'config', 'infoCliente.json');
    if (fs.existsSync(infoClientePath)) {
      const infoClienteData = JSON.parse(fs.readFileSync(infoClientePath, 'utf-8'));
      return infoClienteData.CLIENTE || clientId; // Fallback para clientId se CLIENTE não existir
    }
  } catch (error) {
    console.warn(`Erro ao ler CLIENTE para ${clientId}:`, error.message);
  }
  return clientId; // Fallback
}

// Funções auxiliares para transformar os métodos do PM2 (que usam callback) em Promises
const pm2Connect = () => new Promise((resolve, reject) => {
    pm2.connect((err) => {
        if (err) return reject(err);
        resolve();
    });
});

const pm2List = () => new Promise((resolve, reject) => {
    pm2.list((err, list) => {
        if (err) return reject(err);
        resolve(list);
    });
});

const pm2Start = (options) => new Promise((resolve, reject) => {
    pm2.start(options, (err, apps) => {
        if (err) return reject(err);
        resolve(apps);
    });
});

const pm2Stop = (process) => new Promise((resolve, reject) => {
    pm2.stop(process, (err) => {
        if (err) return reject(err);
        resolve();
    });
});

const pm2Restart = (process) => new Promise((resolve, reject) => {
    pm2.restart(process, (err) => {
        if (err) return reject(err);
        resolve();
    });
});

const pm2Delete = (process) => new Promise((resolve, reject) => {
    pm2.delete(process, (err) => {
        if (err) return reject(err);
        resolve();
    });
});

const pm2Disconnect = () => {
    try {
        pm2.disconnect();
    } catch (e) {
        console.warn('PM2 disconnect error:', e);
    }
};

export async function POST(request) {
  let clientId;
  try {
    const body = await request.json();
    clientId = body.clientId;
    const action = body.action;

    // Obtém o nome real do cliente para usar como nome do processo PM2
    const processName = getClientName(clientId);

    console.log(`[API /api/client-control] Received - clientId: ${clientId}, processName: ${processName}, action: ${action}`);

    if (!clientId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // PROTEÇÃO: Impedir operações no processo principal do sistema
    // Verifica se o clientId ou processName corresponde ao nome do processo atual ou nomes conhecidos do sistema
    const currentProcessName = process.env.name || 'ac-online';
    const forbiddenNames = ['ac-online', 'front', 'archer', currentProcessName];

    if (forbiddenNames.includes(clientId) || forbiddenNames.includes(processName)) {
        console.warn(`[API] Bloqueada tentativa de ${action} no processo do sistema: ${clientId} (process: ${processName})`);
        return NextResponse.json({
            error: 'Operation forbidden on system process',
            details: `You cannot ${action} the main application process (${clientId}).`
        }, { status: 403 });
    }

    // 1. Conecta ao Daemon do PM2
    await pm2Connect();

    // 2. Verifica o status atual do processo
    const processList = await pm2List();
    const processFound = processList.find(p => p.name === processName);
    const status = processFound ? processFound.pm2_env.status : 'not_found';

    console.log(`[API /api/client-control] Current status for ${clientId} (process: ${processName}): ${status}`);

    let result = { success: true };

    if (action === 'start') {
      if (status === 'online' || status === 'launching') {
        console.log(`[API /api/client-control] Process ${clientId} already running.`);
        result = { success: true, status: status };
      } else {
        // Define caminhos absolutos
        const scriptPath = path.join(process.cwd(), 'clientes', clientId, 'index.ts');

        if (!fs.existsSync(scriptPath)) {
           throw new Error(`Script não encontrado em: ${scriptPath}`);
        }

        // Se o processo existir mas estiver parado/erro, deletamos para recriar limpo
        if (status !== 'not_found') {
            try { await pm2Delete(processName); } catch (e) { console.warn('Erro ao limpar processo antigo:', e.message); }
        }

        console.log(`[API /api/client-control] Starting process ${processName} for client ${clientId}...`);

        // Inicia usando a API
        await pm2Start({
            name: processName,
            script: scriptPath,
            interpreter: 'node',
            node_args: ['--experimental-strip-types'], // Executa TS nativamente no Node 22+
            cwd: process.cwd(),
            watch: false,
            autorestart: true,
            max_memory_restart: '500M' // Reinicia se passar de 500MB
        });
        
        // Verifica status final
        const finalList = await pm2List();
        const finalProc = finalList.find(p => p.name === processName);
        result = { success: true, status: finalProc ? finalProc.pm2_env.status : 'unknown' };
      }

    } else if (action === 'stop') {
      if (status !== 'not_found') {
        await pm2Stop(processName);
      }
    } else if (action === 'restart') {
      if (status !== 'not_found') {
        await pm2Restart(processName);
      } else {
        return NextResponse.json({ error: 'Process not found to restart' }, { status: 404 });
      }
    } else if (action === 'delete') {
      if (status !== 'not_found') {
        await pm2Delete(processName);
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Desconecta para liberar recursos
    pm2Disconnect();
    return NextResponse.json(result);

  } catch (error) {
    console.error('[API /api/client-control] Error:', error);
    pm2Disconnect(); // Garante desconexão em caso de erro
    return NextResponse.json({
      error: `Failed operation for client ${clientId}`,
      details: error.message || error.toString()
    }, { status: 500 });
  }
}

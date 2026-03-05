// src/app/api/create-client-functions/route.ts
import { NextResponse } from 'next/server';
import { getPasta } from '@/backend/disparo/disparo';
import * as fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import * as fsPromises from 'node:fs/promises'; // Importar fs com Promises
import { syncManager } from '../../../database/sync.ts';
 
// Caminho para o arquivo do contador local
const COUNTER_FILE_PATH = path.join(process.cwd(), 'clientCounter.json');
 
/**
 * Copia os arquivos do modelo para a pasta do novo cliente.
 */
async function copiarArquivosDoModelo(modeloId: string, nomeCliente: string) {
  const modeloPath = path.join(process.cwd(), 'clientes', 'modelos', modeloId);

  // Gerar nome numérico crescente para a pasta
  let currentCounter = 0;
  try {
      // Tenta ler o contador atual do arquivo local
      if (fs.existsSync(COUNTER_FILE_PATH)) {
          const counterContent = fs.readFileSync(COUNTER_FILE_PATH, 'utf-8');
          const counterData = JSON.parse(counterContent);
          currentCounter = counterData.lastId || 0;
      }
  } catch (readError) {
      console.error(`[API] Erro ao ler arquivo do contador local ${COUNTER_FILE_PATH}:`, readError);
      // Continua com 0 se houver erro de leitura
  }

  currentCounter += 1;
  const nomePastaCliente = `cliente${currentCounter}`;
  const novoClientePath = getPasta(nomePastaCliente);

  console.log(`[API] Copiando de ${modeloPath} para ${novoClientePath} (pasta: ${nomePastaCliente}, nome: ${nomeCliente})`);

  try {
    // Cria a pasta do novo cliente se não existir
    if (!fs.existsSync(novoClientePath)) {
      console.log(`[API] Criando pasta ${novoClientePath}`);
      fs.mkdirSync(novoClientePath, { recursive: true });
    }

    // Copia os arquivos do modelo para a pasta do novo cliente
    fs.cpSync(modeloPath, novoClientePath, { recursive: true });
    console.log(`[API] Arquivos copiados do modelo ${modeloId} para ${novoClientePath}`);

    // Salva o nome real do cliente no infoCliente.json
    const infoClientePath = path.join(novoClientePath, 'config', 'infoCliente.json');
    const infoClienteData = {
      id: nomePastaCliente, // id fixo (nome da pasta)
      CLIENTE: nomeCliente,     // nome de exibição
      STATUS: "ativo",
      AI_SELECTED: "GEMINI",
      // Outros campos padrão podem ser adicionados conforme necessário
    };

    await fsPromises.writeFile(infoClientePath, JSON.stringify(infoClienteData, null, 2), 'utf-8');
    console.log(`[API] infoCliente.json criado com CLIENTE: ${nomeCliente}`);

    try {
        // 🔄 SALVAR NO SQLITE (sincronização automática) - contador de clientes
        try {
          await syncManager.saveClientData('system', {
            clientCounter: { lastId: currentCounter }
          });
          console.log(`[API] Contador salvo no SQLite`);
        } catch (sqliteError) {
          console.error(`[API] Erro ao salvar contador no SQLite:`, sqliteError);
          // Continua com o salvamento JSON mesmo se SQLite falhar
        }

        // Salva o novo contador no arquivo local
        await fsPromises.writeFile(COUNTER_FILE_PATH, JSON.stringify({ lastId: currentCounter }, null, 2), 'utf-8');
        console.log(`[API] Contador local atualizado em ${COUNTER_FILE_PATH}`);
    } catch (writeError) {
        console.error(`[API] Erro ao escrever arquivo do contador local ${COUNTER_FILE_PATH}:`, writeError);
        // Continua mesmo se houver erro de escrita, o ID já foi gerado
    }

    const envPath = path.join(novoClientePath, 'config', '.env');
    let envData = {};

    if (fs.existsSync(envPath)) {
      console.log(`[API] Arquivo .env encontrado em ${envPath}. Atualizando CLIENTE_ID.`);
      let envContent = await fs.promises.readFile(envPath, 'utf-8');

      // Substituir ou adicionar CLIENTE_ID
      const lines = envContent.split('\n');
      let clientIdFound = false;
      const newLines = lines.map(line => {
        if (line.trim().startsWith('CLIENTE_ID=')) {
          clientIdFound = true;
          return `CLIENTE_ID="${currentCounter}"`;
        }
        return line;
      });

      if (!clientIdFound) {
        newLines.push(`CLIENTE_ID="${currentCounter}"`);
      }
      envContent = newLines.join('\n');

      await fs.promises.writeFile(envPath, envContent, 'utf-8');
      console.log(`[API] CLIENTE_ID atualizado no .env para ${currentCounter}`);

      // Lê o arquivo .env atualizado para retornar os dados corretos
      const parsedEnv = dotenv.config({ path: envPath }).parsed;
      if (parsedEnv) {
        envData = parsedEnv;
        console.log('[API] Dados lidos do .env atualizado:', envData);
      } else {
        console.log('[API] dotenv.config retornou parsed undefined ou null após atualização.');
      }

    } else {
      console.log(`[API] Arquivo .env NÃO encontrado em ${envPath}. Não foi possível adicionar CLIENTE_ID.`);
      // Se o .env não existe, envData permanece vazio como antes
    }
    // 🔄 SALVAR NO SQLITE (sincronização automática) - novo cliente
    try {
      await syncManager.saveClientData(nomePastaCliente, {
        infoCliente: infoClienteData
      });
      console.log(`[API] Cliente salvo no SQLite`);
    } catch (sqliteError) {
      console.error(`[API] Erro ao salvar cliente no SQLite:`, sqliteError);
    }

    return NextResponse.json({
      message: 'Cliente criado com sucesso',
      envData,
      clienteSequencialId: currentCounter,
      nomePasta: nomePastaCliente,
      nomeCliente: nomeCliente
    }, { status: 200 });

  } catch (error) {
    console.error(`[API] Erro ao copiar arquivos do modelo ${modeloId}:`, error);
    return NextResponse.json({ error: 'Erro ao copiar arquivos do modelo' }, { status: 500 });
  }
}

/**
 * Salva as configurações no arquivo infoCliente.json do cliente.
 */
async function salvarConfigNoEnv(clientId: string, config: any) {
  try {
    let infoClientePath;

    // Verificar se é formato antigo (folderType/clientName) ou novo (clientId direto)
    if (clientId) {
      // Formato antigo: "ativos/CMW"
      const clientName = clientId;
      infoClientePath = path.join(
        process.cwd(),
        'clientes',
        clientName,
        'config',
        'infoCliente.json'
      );
      console.log(`[API salvarConfigNoEnv] Usando formato antigo: ${clientId}`);
    } else {
      // Formato novo: "CMW" - clientId direto
      infoClientePath = path.join(
        process.cwd(),
        'clientes',
        clientId,
        'config',
        'infoCliente.json'
      );
      console.log(`[API salvarConfigNoEnv] Usando formato novo: ${clientId}`);
    }
 
    // Garante que o arquivo exista
    if (!fs.existsSync(infoClientePath)) {
      console.warn(`Arquivo infoCliente.json não encontrado em ${infoClientePath}. Criando.`);
      await fsPromises.writeFile(infoClientePath, '{}', 'utf-8');
    }
 
    // 🔄 SALVAR NO SQLITE (sincronização automática)
    try {
      await syncManager.saveClientData(clientId, {
        infoCliente: config
      });
      console.log(`[API] Configurações salvas no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[API] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // Salva a configuração no arquivo infoCliente.json
    await fsPromises.writeFile(infoClientePath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`[API] Configurações salvas no infoCliente.json para o cliente ${clientId}`);
    return { success: true, message: "Configurações salvas com sucesso no infoCliente.json" };
  } catch (error) {
    console.error(`[API] Erro ao salvar config no infoCliente.json para o cliente ${clientId}:`, error);
    return { success: false, error: `Erro desconhecido ao salvar no infoCliente.json: ${error instanceof Error ? error.message : String(error)}` };
  }
}
 
export async function POST(request: Request): Promise<NextResponse> {
  const { action, ...data } = await request.json();
  console.log(`[API] Recebida ação: ${action}`);
 
  switch (action) {
    case 'copiarArquivosDoModelo':
      return copiarArquivosDoModelo(data.modeloId, data.nomeCliente);
    case 'salvarDadosNoEnv': // Alterado de salvarDadosNoFirebase para salvarDadosNoEnv
      if (!data.novoClienteId) {
         console.error('[API] Erro: novoClienteId não fornecido para salvarDadosNoEnv:', data.novoClienteId);
         return NextResponse.json({ error: 'ID do cliente não fornecido.' }, { status: 400 });
      }
      // Removida validação que exigia "/", pois agora aceitamos clientId direto
      // Chama salvarConfigNoEnv diretamente
     {
       const result = await salvarConfigNoEnv(data.novoClienteId, data.dados);
       if (!result.success) {
           return NextResponse.json({ error: result.error }, { status: 500 });
       }
       return NextResponse.json({ message: 'Dados salvos no infoCliente.json com sucesso' }, { status: 200 });
     }
    default:
      console.log(`[API] Ação inválida recebida: ${action}`);
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }
}
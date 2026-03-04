import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import { getDatabase } from '../../../database/database';
import { ClienteCRUD } from '../../../database/crud';

const execAsync = promisify(exec);

// Função para verificar status do processo PM2 usando CLIENTE como nome
async function checkProcessStatus(clientName, infoCliente) {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    // Usa CLIENTE do JSON como nome do processo, com fallback para clientName
    const processName = infoCliente?.CLIENTE || clientName;
    const clientProcess = processes.find(p => p.name === processName);
    return clientProcess ? clientProcess.pm2_env.status === 'online' : false;
  } catch (error) {
    return false;
  }
}

// Função para ler o CLIENTE_ID do .env
function readClienteIdFromEnv(clientFolderPath) {
  const envPath = path.join(clientFolderPath, 'config', '.env');
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const parsedEnv = dotenv.parse(envContent);
      return parsedEnv.CLIENTE_ID || null;
    }
  } catch (error) {
    console.error(`Erro ao ler .env para ${clientFolderPath}:`, error);
  }
  return null;
}

// Função recursiva para encontrar todos os arquivos infoCliente.json com limite de profundidade
function findInfoClienteFiles(dir, fileList = [], maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return fileList;
  }

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && item !== 'node_modules' && !item.startsWith('.')) {
        // Recursivamente procurar em subdiretórios com limite
        findInfoClienteFiles(fullPath, fileList, maxDepth, currentDepth + 1);
      } else if (item === 'infoCliente.json') {
        fileList.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Erro ao acessar diretório ${dir}:`, error.message);
  }

  return fileList;
}

// Função para determinar categoria baseada no STATUS
function determineCategory(status) {
  if (!status) return 'ativos'; // padrão

  const statusLower = status.toLowerCase().trim();

  if (statusLower.includes('cancelado') ||
      statusLower.includes('canceled') ||
      statusLower.includes('inativo') ||
      statusLower.includes('inactive') ||
      statusLower.includes('desativado') ||
      statusLower.includes('disabled')) {
    return 'cancelados';
  }

  if (statusLower.includes('modelo') ||
      statusLower.includes('model') ||
      statusLower.includes('template') ||
      statusLower.includes('exemplo') ||
      statusLower.includes('sample')) {
    return 'modelos';
  }

  if (statusLower.includes('ativo') ||
      statusLower.includes('active') ||
      statusLower.includes('funcionando') ||
      statusLower.includes('working') ||
      statusLower.includes('operacional') ||
      statusLower.includes('operational')) {
    return 'ativos';
  }

  // Se não conseguir determinar, assume como ativo
  return 'ativos';
}

export async function POST() {
  try {
    console.log("[API listClientes] Iniciando busca por clientes na pasta clientes/...");

    const clientesPath = path.join(process.cwd(), 'clientes');

    if (!fs.existsSync(clientesPath)) {
      return new Response(JSON.stringify({ error: "Clientes directory not found" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Buscar todas as pastas em clientes/ (ignorar modelos/)
    const items = fs.readdirSync(clientesPath);
    const clientesPorCategoria = {
      ativos: [],
      cancelados: [],
      modelos: []
    };

    for (const item of items) {
      // Ignorar modelos
      if (item === 'modelos') continue;

      const clientePath = path.join(clientesPath, item);
      const infoClientePath = path.join(clientePath, 'config', 'infoCliente.json');

      if (fs.existsSync(infoClientePath)) {
        try {
          const infoClienteContent = fs.readFileSync(infoClientePath, 'utf-8');
          const infoCliente = JSON.parse(infoClienteContent);

          const clienteNome = item; // nome da pasta é o clientId
          const categoriaCorreta = determineCategory(infoCliente.STATUS);

          const clienteInfo = {
            id: clienteNome, // clientId direto (nome da pasta numérica)
            name: infoCliente.CLIENTE || clienteNome, // nome de exibição é o CLIENTE do JSON
            path: clienteNome, // caminho direto (nome da pasta)
            type: categoriaCorreta === 'ativos' ? 'active' : categoriaCorreta === 'cancelados' ? 'canceled' : 'model',
            folderType: categoriaCorreta, // categoria baseada no STATUS
            status: 'inactive', // manter compatibilidade
            infoCliente: infoCliente,
            caminhoFisico: clientePath,
            categoriaAtual: categoriaCorreta,
            categoriaCorreta: categoriaCorreta,
            statusOriginal: infoCliente.STATUS
          };

          clientesPorCategoria[categoriaCorreta].push(clienteInfo);

        } catch (error) {
          console.error(`[API listClientes] Erro ao processar cliente ${item}:`, error);
        }
      }
    }

    const todosClientes = [
      ...clientesPorCategoria.ativos,
      ...clientesPorCategoria.cancelados,
      ...clientesPorCategoria.modelos
    ];

    console.log("[API listClientes] Resumo final:");
    console.log("- Ativos:", clientesPorCategoria.ativos.length);
    console.log("- Cancelados:", clientesPorCategoria.cancelados.length);
    console.log("- Modelos:", clientesPorCategoria.modelos.length);
    console.log("- Total:", todosClientes.length);

    return new Response(JSON.stringify(todosClientes), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("[API listClientes] Error geral:", error);
    return new Response(JSON.stringify({ error: "Failed to list clients", details: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
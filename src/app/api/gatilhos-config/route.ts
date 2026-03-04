import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { type Gatilho } from '../../../backend/service/braim/gatilhos'; // Importar a interface Gatilho
import { syncManager } from '../../../database/sync.ts'; // Importar syncManager

// Helper function to get client config path
const getClientConfigPath = (clientId: string): string | null => {
  if (!clientId || typeof clientId !== 'string') {
    console.error(`[API Gatilhos] Invalid clientId: ${clientId}`);
    return null;
  }
  // Ajuste o caminho base conforme a estrutura do seu projeto
  const basePath = path.join(process.cwd(), 'clientes');
  const clientPath = path.join(basePath, clientId, 'config');
  return clientPath;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  console.log(`[API Gatilhos] Received clientId: ${clientId}`);

  if (!clientId || typeof clientId !== 'string') {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const clientConfigPath = getClientConfigPath(clientId);
  console.log(`[API Gatilhos] Generated clientConfigPath: ${clientConfigPath}`);

  if (!clientConfigPath) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
  }

  const configFilePath = path.join(clientConfigPath, 'gatilhos.json');

  try {
    let config: { ativar_funcao_gatilhos: boolean; gatilhos: Gatilho[] } = {
      ativar_funcao_gatilhos: false,
      gatilhos: [],
    };

    if (fs.existsSync(configFilePath)) {
      const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
      config = JSON.parse(configFileContent);
      // Garantir que cada gatilho tenha os novos campos com valores padrão se ausentes
      config.gatilhos = config.gatilhos.map((gatilho) => ({
          ...gatilho,
          varios_arquivos: gatilho.varios_arquivos ?? false,
          arquivos_midia: gatilho.arquivos_midia ?? [],
      }));
    } else {
      // 🔄 SALVAR NO SQLITE (sincronização automática) - estrutura padrão
      try {
        await syncManager.saveClientData(clientId, {
          config: {
            gatilhos: config
          }
        });
        console.log(`[API Gatilhos] Configuração padrão salva no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[API Gatilhos] Erro ao salvar configuração padrão no SQLite para ${clientId}:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      // Criar arquivo com estrutura padrão se não existir
      fs.mkdirSync(path.dirname(configFilePath), { recursive: true }); // Garante que a pasta config exista
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(`[API Gatilhos] Arquivo de configuração criado: ${configFilePath}`);
    }

    return NextResponse.json(config, { status: 200 });

  } catch (error: any) {
    console.error(`[API Gatilhos] Erro ao carregar configuração para ${clientId}:`, error);
    return NextResponse.json({ error: 'Failed to load gatilhos config', details: error.message }, { status: 500 });
  }
}

// Opcional: Adicionar outros métodos HTTP se necessário (POST, PUT, DELETE)
// export async function POST(request: Request) { ... }
// export async function PUT(request: Request) { ... }
// export async function DELETE(request: Request) { ... }
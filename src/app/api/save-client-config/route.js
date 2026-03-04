import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { syncManager } from '../../../database/sync.ts';

export async function POST(request) {
  console.log('[API save-client-config] POST request received.');
  try {
    // Lê o request body apenas uma vez para evitar ERR_BODY_ALREADY_USED
    const { clientId, config } = await request.json();
    console.log('[API save-client-config] Request body:', { clientId, config });

    if (!clientId || !config) {
      console.error('[API save-client-config] Dados incompletos para salvar configuração:', { clientId, config });
      return NextResponse.json(
        { error: 'ClientId e configuração são obrigatórios' },
        { status: 400 }
      );
    }

    let clientConfigDir, infoClientePath;

    // Verificar se é formato antigo (folderType/clientName) ou novo (clientId direto)
    if (clientId.includes('/')) {
      // Formato antigo: "ativos/CMW" - manter compatibilidade
      const [clientType, clientName] = clientId.split('/');
      if (!clientType || !clientName) {
         console.error('[API save-client-config] Formato de clientId inválido:', clientId);
         return NextResponse.json(
           { error: 'Formato de ClientId inválido' },
           { status: 400 }
         );
      }
      console.log(`[API save-client-config] Usando formato antigo: ${clientId}`);
      clientConfigDir = path.join(process.cwd(), 'clientes', clientType, clientName, 'config');
      infoClientePath = path.join(clientConfigDir, 'infoCliente.json');
    } else {
      // Formato novo: "CMW" - clientId direto
      console.log(`[API save-client-config] Usando formato novo: ${clientId}`);
      clientConfigDir = path.join(process.cwd(), 'clientes', clientId, 'config');
      infoClientePath = path.join(clientConfigDir, 'infoCliente.json');
    }

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    try {
      await syncManager.saveClientData(clientId, {
        infoCliente: config
      });
      console.log(`[API save-client-config] Configuração salva no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[API save-client-config] Erro ao salvar configuração no SQLite para ${clientId}:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // 📄 SALVAR NO JSON (manter funcionalidade original)
    // Garante que o diretório de configuração exista
    await fs.mkdir(clientConfigDir, { recursive: true });

    // Escreve a configuração no arquivo infoCliente.json
    await fs.writeFile(infoClientePath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`[API save-client-config] Configuração salva em ${infoClientePath}`);
 
    console.log('[API save-client-config] Configuração salva com sucesso.');
    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso (arquivo infoCliente.json)',
      timestamp: new Date().toISOString(),
    });
 
  } catch (error) {
    console.error('[API save-client-config] Erro geral ao salvar configuração do cliente:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao salvar configuração' },
      { status: 500 }
    );
  }
}
 
// Mantém o handler GET existente, modificado para ler do infoCliente.json
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'ClientId é obrigatório' },
        { status: 400 }
      );
    }

    let infoClientePath;

    // Verificar se é formato antigo (folderType/clientName) ou novo (clientId direto)
    if (clientId.includes('/')) {
      // Formato antigo: "ativos/CMW" - manter compatibilidade
      const [clientType, clientName] = clientId.split('/');
      if (!clientType || !clientName) {
        return NextResponse.json(
          { error: 'Formato de ClientId inválido' },
          { status: 400 }
        );
      }
      console.log(`[API save-client-config GET] Usando formato antigo: ${clientId}`);
      infoClientePath = path.join(process.cwd(), 'clientes', clientType, clientName, 'config', 'infoCliente.json');
    } else {
      // Formato novo: "CMW" - clientId direto
      console.log(`[API save-client-config GET] Usando formato novo: ${clientId}`);
      infoClientePath = path.join(process.cwd(), 'clientes', clientId, 'config', 'infoCliente.json');
    }
 
    try {
      const configFileContent = await fs.readFile(infoClientePath, 'utf-8');
      const config = JSON.parse(configFileContent);
 
      return NextResponse.json({
        success: true,
        config,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao ler a configuração do cliente do arquivo local (infoCliente.json):', error);
      return NextResponse.json(
        { error: 'Erro ao ler a configuração do cliente do arquivo local (infoCliente.json)' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar configuração do cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
}

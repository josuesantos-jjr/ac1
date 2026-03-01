import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { syncManager } from '../../../../database/sync.ts';

interface CrmConfig {
  spreadsheetId?: string;
  calendarId?: string;
  mappings: Array<{
    field: string;
    column: string;
    required: boolean;
    dataType: string;
  }>;
  autoSync: boolean;
  notifications: boolean;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({
        error: 'clientId é obrigatório'
      }, { status: 400 });
    }

    // Caminho para o arquivo de configuração CRM do cliente
    const configPath = path.join(process.cwd(), 'clientes', clientId, 'config', 'crm-config.json');

    // Verificar se o arquivo existe
    if (!fs.existsSync(configPath)) {
      // Retornar configuração padrão
      const defaultConfig: CrmConfig = {
        mappings: [
          { field: 'id', column: 'A', required: true, dataType: 'string' },
          { field: 'chatId', column: 'B', required: true, dataType: 'string' },
          { field: 'nome', column: 'C', required: true, dataType: 'string' },
          { field: 'telefone', column: 'D', required: true, dataType: 'string' },
          { field: 'etapaFunil', column: 'E', required: true, dataType: 'string' },
          { field: 'lead', column: 'F', required: false, dataType: 'string' },
          { field: 'email', column: 'G', required: false, dataType: 'string' },
          { field: 'tags', column: 'H', required: false, dataType: 'string' },
          { field: 'valorEstimado', column: 'I', required: false, dataType: 'number' },
          { field: 'resumoParaAtendente', column: 'J', required: false, dataType: 'string' },
          { field: 'dataCriacao', column: 'K', required: false, dataType: 'date' }
        ],
        autoSync: true,
        notifications: true,
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json(defaultConfig);
    }

    // Ler configuração existente
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config: CrmConfig = JSON.parse(configData);

    return NextResponse.json(config);

  } catch (error) {
    console.error('Erro ao carregar configuração CRM:', error);
    return NextResponse.json({
      error: 'Erro ao carregar configuração CRM',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, config } = await request.json();

    if (!clientId || !config) {
      return NextResponse.json({
        error: 'clientId e config são obrigatórios'
      }, { status: 400 });
    }

    // Caminho para o arquivo de configuração CRM do cliente
    const clientDir = path.join(process.cwd(), 'clientes', clientId, 'config');
    const configPath = path.join(clientDir, 'crm-config.json');

    // Criar diretório se não existir
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    // Adicionar timestamp de atualização
    const updatedConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    };

    // 🔄 SALVAR NO SQLITE (sincronização automática)
    try {
      await syncManager.saveClientData(clientId, {
        config: { crmConfig: updatedConfig }
      });
      console.log(`[API /api/crm/config POST] Configuração CRM salva no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[API /api/crm/config POST] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com o salvamento JSON mesmo se SQLite falhar
    }

    // Salvar configuração
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Configuração CRM salva com sucesso',
      config: updatedConfig
    });

  } catch (error) {
    console.error('Erro ao salvar configuração CRM:', error);
    return NextResponse.json({
      error: 'Erro ao salvar configuração CRM',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
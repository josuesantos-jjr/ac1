import { NextResponse } from 'next/server';
import * as fs from 'fs'; // Importar fs para existsSync
import * as fsPromises from 'fs/promises'; // Importar fs/promises para operações assíncronas
import path from 'path'; // Importar path
import { getPasta } from '@/backend/disparo/disparo'; // Importar getPasta
import { syncManager } from '../../../database/sync.ts'; // Importar syncManager

// GET /api/followup-config?clientId=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'ClientId é obrigatório' }, { status: 400 });
    }

    // --- Lógica de Carregamento Local ---
    const clienteFolderPath = getPasta(clientId);
    const localFollowUpPath = path.join(clienteFolderPath, 'config', 'followUpConfig.json');
    let localFollowUp = {};
    try {
        if (fs.existsSync(localFollowUpPath)) {
            const localContent = await fsPromises.readFile(localFollowUpPath, 'utf-8');
            localFollowUp = JSON.parse(localContent);
            console.log(`[API /api/followup-config GET] Configurações de follow-up carregadas localmente para ${clientId}`);
        } else {
            console.log(`[API /api/followup-config GET] Arquivo followUpConfig.json não encontrado para ${clientId}. Retornando objeto vazio.`);
        }
    } catch (localError) {
        console.error(`[API /api/followup-config GET] Erro ao carregar configurações de follow-up localmente para ${clientId}:`, localError);
        localFollowUp = {};
    }
    // --- Fim Lógica de Carregamento Local ---

    // Retorna o conteúdo do arquivo (localFollowUp) dentro de uma chave 'config', 
    // e um timestamp separado para a requisição GET.
    return NextResponse.json({ success: true, config: localFollowUp, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro ao buscar configuração de follow-up:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração de follow-up' },
      { status: 500 }
    );
  }
}

// PUT /api/followup-config - Atualizar configurações de follow-up localmente
export async function PUT(request) {
  try {
    const requestBody = await request.json();
    const { clientId: rawClientId, ...payloadConfigData } = requestBody;

    if (!rawClientId) {
      return NextResponse.json(
        { error: 'ClientId é obrigatório' },
        { status: 400 }
      );
    }

    if (Object.keys(payloadConfigData).length === 0) {
      return NextResponse.json(
        { error: 'Dados de configuração são obrigatórios' },
        { status: 400 }
      );
    }

    // --- Lógica de Salvamento Local ---
    const clientId = rawClientId; // Renomear para usar clientId
    const clienteFolderPath = getPasta(clientId);
    const localFollowUpPath = path.join(clienteFolderPath, 'config', 'followUpConfig.json');

    try {
        const configDir = path.dirname(localFollowUpPath);
        if (!fs.existsSync(configDir)) {
            await fsPromises.mkdir(configDir, { recursive: true });
            console.log(`[API /api/followup-config PUT] Diretório de configuração criado para ${clientId}`);
        }

        // Prepara o objeto de configuração final a ser salvo.
        // payloadConfigData representa os dados de configuração enviados pelo cliente.
        const configToSave = { ...payloadConfigData };

        // Remove a chave 'config' aninhada, se existir, para achatar a estrutura.
        if (Object.prototype.hasOwnProperty.call(configToSave, 'config')) {
            console.log(`[API /api/followup-config PUT] Removendo chave 'config' aninhada da configuração para ${clientId} antes de salvar.`);
            delete configToSave.config;
        }

        // Garante que o timestamp no arquivo seja sempre atualizado no salvamento.
        configToSave.timestamp = new Date().toISOString();

        // 🔄 SALVAR NO SQLITE (sincronização automática)
        try {
          await syncManager.saveClientData(clientId, {
            config: {
              followUpConfig: configToSave
            }
          });
          console.log(`[API /api/followup-config PUT] Configurações salvas no SQLite para ${clientId}`);
        } catch (sqliteError) {
          console.error(`[API /api/followup-config PUT] Erro ao salvar no SQLite para ${clientId}:`, sqliteError);
          // Continua com o salvamento JSON mesmo se SQLite falhar
        }

        // 📄 SALVAR NO JSON (manter funcionalidade original)
        // Salva as configurações localmente (sobrescreve o arquivo existente ou cria um novo)
        // com a estrutura achatada e timestamp atualizado.
        await fsPromises.writeFile(localFollowUpPath, JSON.stringify(configToSave, null, 2), 'utf-8');
        console.log(`[API /api/followup-config PUT] Configurações de follow-up salvas localmente para ${clientId} com estrutura achatada.`);
        
        return NextResponse.json({
          success: true,
          message: 'Configuração de follow-up salva com sucesso',
          config: configToSave, // Retorna a configuração que foi efetivamente salva
          timestamp: configToSave.timestamp, // Retorna o timestamp que foi salvo no arquivo
        });

    } catch (localError) {
        console.error(`[API /api/followup-config PUT] Erro ao salvar configurações de follow-up localmente para ${clientId}:`, localError);
        return NextResponse.json(
            { error: `Erro ao salvar configurações localmente: ${localError.message}` },
            { status: 500 }
        );
    }
    // --- Fim Lógica de Salvamento Local ---

  } catch (error) {
    console.error('Erro ao salvar configuração de follow-up:', error);
    // Adiciona verificação para erro de parsing de JSON (corpo da requisição inválido/vazio)
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Corpo da requisição inválido ou vazio' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Erro ao salvar configuração de follow-up' },
      { status: 500 }
    );
  }
}

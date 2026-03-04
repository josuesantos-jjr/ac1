import { NextResponse } from 'next/server';
// Importar o Firebase Admin SDK
import * as fs from 'fs'; // Importar fs para existsSync
import * as fsPromises from 'fs/promises'; // Importar fs/promises para operações assíncronas
import path from 'path'; // Importar path
import { getPasta } from '@/backend/disparo/disparo'; // Importar getPasta
import { syncManager } from '../../../database/sync.ts'; // Importar syncManager


// GET /api/regras-disparo?clientId=...
export async function GET(request) {
  try {

    const { searchParams } = new URL(request.url);
    let clientId = searchParams.get('clientId'); // Manter clientId para obter o caminho da pasta

    if (!clientId) {
      return NextResponse.json({ error: 'ClientId é obrigatório' }, { status: 400 });
    }

    // --- Lógica de Carregamento Local ---
    const clienteFolderPath = getPasta(clientId); // Usar clientId (tipo/nomePasta) para obter o caminho local
    const localRegrasPath = path.join(clienteFolderPath, 'config', 'regrasDisparo.json');

    // Define um objeto com os valores padrão para o backend
    const REGRAS_DEFAULT_BACKEND = {
      DISPARO_ESTRATEGIA: 'todas_ativas',
      DISPARO_LISTAS_SELECIONADAS: '',
      HORARIO_INICIAL: '08:00',
      HORARIO_FINAL: '18:00',
      DIA_INICIAL: 'segunda',
      DIA_FINAL: 'sexta',
      INTERVALO_DE: '30',
      INTERVALO_ATE: '60',
      QUANTIDADE_INICIAL: '10',
      DIAS_AQUECIMENTO: '7',
      QUANTIDADE_LIMITE: '100',
      QUANTIDADE_SEQUENCIA: '50',
    };

    let localRegras = {};
    try {
        if (fs.existsSync(localRegrasPath)) {
            const localContent = await fsPromises.readFile(localRegrasPath, 'utf-8');
            localRegras = JSON.parse(localContent);
            console.log(`[API /api/regras-disparo GET] Regras carregadas localmente para ${clientId}`);
        } else {
            console.log(`[API /api/regras-disparo GET] Arquivo de regras local não encontrado para ${clientId}. Usando padrões.`);
            localRegras = REGRAS_DEFAULT_BACKEND; // Usa padrões se o arquivo não existir
        }
    } catch (localError) {
        console.error(`[API /api/regras-disparo GET] Erro ao carregar regras localmente para ${clientId}:`, localError);
        localRegras = REGRAS_DEFAULT_BACKEND; // Usa padrões em caso de erro na leitura
    }
    // --- Fim Lógica de Carregamento Local ---

    return NextResponse.json({ success: true, regras: localRegras, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro ao buscar regras de disparo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar regras de disparo' },
      { status: 500 }
    );
  }
}


// PUT /api/regras-disparo - Atualizar regras de disparo localmente
export async function PUT(request) {
  try {
    const { clientId, regras } = await request.json(); // Extrai clientId

    if (!clientId || !regras) {
      return NextResponse.json(
        { error: 'ClientId e regras são obrigatórios' },
        { status: 400 }
      );
    }

    // --- Lógica de Salvamento Local ---
    const clienteFolderPath = getPasta(clientId); // Usa o clientId processado
    const localRegrasPath = path.join(clienteFolderPath, 'config', 'regrasDisparo.json');

    try {
        // 🔄 SALVAR NO SQLITE (sincronização automática)
        try {
            await syncManager.saveClientData(clientId, {
                config: {
                    regrasDisparo: regras
                }
            });
            console.log(`[API /api/regras-disparo PUT] Regras salvas no SQLite para ${clientId}`);
        } catch (sqliteError) {
            console.error(`[API /api/regras-disparo PUT] Erro ao salvar regras no SQLite para ${clientId}:`, sqliteError);
            // Continua com o salvamento JSON mesmo se SQLite falhar
        }

        // 📄 SALVAR NO JSON (manter funcionalidade original)
        await fsPromises.writeFile(localRegrasPath, JSON.stringify(regras, null, 2), 'utf-8');
        console.log(`[API /api/regras-disparo PUT] Regras salvas localmente para ${clientId}`);
    } catch (localError) {
        console.error(`[API /api/regras-disparo PUT] Erro ao salvar regras localmente para ${clientId}:`, localError);
        // Continuar, mas logar o erro
    }
    // --- Fim Lógica de Salvamento Local ---

    return NextResponse.json({
      success: true,
      message: 'Regras atualizadas com sucesso',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao atualizar regras de disparo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar regras de disparo' },
      { status: 500 }
    );
  }
}

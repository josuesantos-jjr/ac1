import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { syncManager } from '../../../database/sync.ts';

// Configuração removida - Next.js App Router não usa mais config exports

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const clientId = formData.get('clientId') as string;
    const gatilhoNome = formData.get('gatilhoNome') as string;
    const tipoMidia = formData.get('tipoMidia') as string; // Receber o tipo de mídia
    const files = formData.getAll('files') as File[];

    if (!clientId || !gatilhoNome || files.length === 0) {
      return NextResponse.json({ error: 'Missing clientId, gatilhoNome, or files' }, { status: 400 });
    }

    // Assumindo que clientId é no formato 'tipo/nomeCliente' ou apenas 'nomeCliente'
    const clientName = clientId.split('/').pop();
    if (!clientName) {
         return NextResponse.json({ error: 'Invalid clientId format' }, { status: 400 });
    }

    // Construir o caminho base para salvar os arquivos
    const baseDir = path.join(process.cwd(), 'clientes',  clientName, 'config', 'gatilhos', gatilhoNome);

    // Criar diretórios se não existirem
    await fs.mkdir(baseDir, { recursive: true });

    const uploadedFilePaths: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Gerar um nome de arquivo único para evitar colisões
      const uniqueFileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(baseDir, uniqueFileName);

      // Escrever o arquivo usando Uint8Array para compatibilidade
      await fs.writeFile(filePath, new Uint8Array(buffer));
      
      // Salva o caminho relativo a clientes/ativos/(nomeCliente)
      uploadedFilePaths.push(path.relative(path.join(process.cwd(), 'clientes',  clientName), filePath));
    }

    // 🔄 SALVAR NO SQLITE (sincronização automática) - mídia de gatilhos
    try {
      await syncManager.saveClientData(clientId, {
        gatilhoMedia: {
          gatilhoNome: gatilhoNome,
          uploadedFiles: uploadedFilePaths,
          tipoMidia: tipoMidia
        }
      });
      console.log(`[API Upload Gatilho Media] Mídia de gatilho salva no SQLite para ${clientId}`);
    } catch (sqliteError) {
      console.error(`[API Upload Gatilho Media] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com a funcionalidade mesmo se SQLite falhar
    }

    return NextResponse.json({ uploadedFilePaths, tipoMidia }); // Incluir tipoMidia na resposta

  } catch (error: any) {
    console.error('[API Upload Gatilho] Error uploading gatilho media:', error);
    return NextResponse.json({ error: 'Failed to upload gatilho media', details: error.message }, { status: 500 });
  }
}

// Adicionar um handler para outros métodos, se necessário, embora POST seja o principal para upload
export async function GET() {
    return NextResponse.json({ message: 'GET method not supported for this endpoint.' }, { status: 405 });
}
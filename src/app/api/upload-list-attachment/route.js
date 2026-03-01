import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { sanitizeFilename } from '../../../utils/sanitizeFilename.js';
import { syncManager } from '../../../database/sync.ts';

// Função para garantir que o diretório exista
async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    // Ignora o erro se o diretório já existir, mas lança outros erros
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function POST(request) {
  let formData; // Declara formData no escopo externo
  try {
    formData = await request.formData(); // Atribui valor
    const file = formData.get('file');
    const clientIdInput = formData.get('clientId');

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }
    if (!clientIdInput) {
      return NextResponse.json(
        { error: 'clientId não fornecido.' },
        { status: 400 }
      );
    }

    // Usa o clientIdInput diretamente como nome do cliente, assumindo o novo formato
    let clienteNome = clientIdInput;

    const basePath = path.join(
      process.cwd(),
      'clientes',
      clienteNome
    );
    const mediaDir = path.join(basePath, 'media');

    // Garante que o diretório base e o diretório media existam
    await ensureDirectoryExists(basePath);
    await ensureDirectoryExists(mediaDir);

    // Gera um nome de arquivo único e sanitizado
    const originalFilename = file.name || 'arquivo_anexo';
    const sanitizedOriginalName = sanitizeFilename(originalFilename); // Sanitiza o nome original
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedOriginalName}`;
    const filePath = path.join(mediaDir, uniqueFilename);

    // Lê o buffer do arquivo e salva no disco
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // 🔄 SALVAR NO SQLITE (sincronização automática) - anexo de lista
    try {
      await syncManager.saveClientData(clientIdInput, {
        listAttachment: {
          fileName: uniqueFilename,
          originalName: originalFilename,
          relativePath: `media/${uniqueFilename}`,
          size: buffer.length,
          uploadedAt: new Date().toISOString()
        }
      });
      console.log(`[API Upload List Attachment] Anexo salvo no SQLite para ${clientIdInput}`);
    } catch (sqliteError) {
      console.error(`[API Upload List Attachment] Erro ao salvar no SQLite:`, sqliteError);
      // Continua com a funcionalidade mesmo se SQLite falhar
    }

    // Retorna o caminho relativo para ser salvo no JSON da lista
    // Usar barras normais para compatibilidade web/JSON
    const relativePath = `media/${uniqueFilename}`;

    console.log(
      `Anexo salvo para cliente ${clienteNome}: ${relativePath}`
    );

    return NextResponse.json({ relativePath: relativePath }, { status: 200 });
  } catch (error) {
    console.error('Erro no upload do anexo da lista:', error);
    // Determina clienteNome novamente para a mensagem de erro, usando clientIdInput se disponível
    let clienteNome = formData.get('clientId') || 'desconhecido'; // Tenta obter de novo, ou usa placeholder


    // Verifica se é um erro com código
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          {
            error: `Diretório do cliente não encontrado (${clienteNome}). Verifique o clientId: ${error.path}`,
          },
          { status: 404 }
        );
      }
    }
    // Erro genérico
    return NextResponse.json(
      { error: `Erro interno do servidor ao salvar o anexo: ${error.message}` },
      { status: 500 }
    );
  }
}

// Adiciona uma rota GET ou OPTIONS básica se necessário para preflight requests ou testes
export async function GET() {
  return NextResponse.json({
    message:
      'API de upload de anexos de lista está ativa. Use POST para enviar arquivos.',
  });
}

export async function OPTIONS() {
  // Lida com preflight requests para CORS se necessário no futuro
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, GET, OPTIONS',
      // Adicionar cabeçalhos CORS se o frontend estiver em domínio diferente
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      // 'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

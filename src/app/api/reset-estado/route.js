import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    // Caminho para o arquivo estado.json do cliente
    const estadoPath = path.join(process.cwd(), 'clientes', clientId, 'config', 'estado.json');

    console.log(`[API reset-estado GET] Buscando estado para cliente: ${clientId}`);
    console.log(`[API reset-estado GET] Caminho do arquivo estado: ${estadoPath}`);

    // Verificar se o arquivo existe
    if (!fs.existsSync(estadoPath)) {
      console.log(`[API reset-estado GET] Arquivo estado.json não encontrado para ${clientId}`);
      return NextResponse.json({
        estado: null,
        message: `Arquivo estado.json não encontrado para o cliente ${clientId}`,
        clientId
      });
    }

    // Ler o conteúdo do arquivo estado.json
    try {
      const estadoContent = fs.readFileSync(estadoPath, 'utf-8');
      const estado = JSON.parse(estadoContent);

      console.log(`[API reset-estado GET] ✅ Estado carregado para ${clientId}`);

      return NextResponse.json({
        estado,
        message: `Estado encontrado para o cliente ${clientId}`,
        clientId
      });
    } catch (readError) {
      console.error(`[API reset-estado GET] Erro ao ler arquivo estado.json: ${readError.message}`);
      return NextResponse.json({
        error: `Erro ao ler arquivo estado: ${readError.message}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[API reset-estado GET] Erro geral:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor ao buscar estado'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    // Caminho para o arquivo estado.json do cliente
    const estadoPath = path.join(process.cwd(), 'clientes', clientId, 'config', 'estado.json');

    console.log(`[API reset-estado] Resetando estado para cliente: ${clientId}`);
    console.log(`[API reset-estado] Caminho do arquivo estado: ${estadoPath}`);

    // Verificar se o arquivo existe
    if (!fs.existsSync(estadoPath)) {
      console.log(`[API reset-estado] Arquivo estado.json não encontrado para ${clientId}, nada para resetar`);
      return NextResponse.json({
        message: `Estado do cliente ${clientId} já está limpo (arquivo não existia)`,
        clientId
      });
    }

    // Fazer backup do arquivo atual antes de deletar
    try {
      const backupPath = `${estadoPath}.backup_${Date.now()}`;
      fs.copyFileSync(estadoPath, backupPath);
      console.log(`[API reset-estado] Backup criado: ${backupPath}`);
    } catch (backupError) {
      console.warn(`[API reset-estado] Aviso: Não foi possível criar backup: ${backupError.message}`);
      // Continua mesmo se não conseguir fazer backup
    }

    // Deletar o arquivo estado.json
    try {
      fs.unlinkSync(estadoPath);
      console.log(`[API reset-estado] ✅ Arquivo estado.json deletado com sucesso para ${clientId}`);
    } catch (deleteError) {
      console.error(`[API reset-estado] ❌ Erro ao deletar arquivo estado.json: ${deleteError.message}`);
      return NextResponse.json({
        error: `Erro ao resetar estado: ${deleteError.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      message: `Estado do cliente ${clientId} foi resetado com sucesso. O sistema irá reiniciar o período de aquecimento na próxima execução.`,
      clientId
    });

  } catch (error) {
    console.error('[API reset-estado] Erro geral:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor ao resetar estado'
    }, { status: 500 });
  }
}
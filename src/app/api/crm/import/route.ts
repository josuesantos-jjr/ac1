import { NextRequest, NextResponse } from 'next/server';
import { crmDataService } from '../../../../backend/service/crmDataService';
import path from 'node:path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientePath } = body;

    if (!clientePath) {
      return NextResponse.json({
        error: 'Caminho do cliente é obrigatório'
      }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), clientePath);
    const importedCount = await crmDataService.importFromDadosJson(fullPath);

    return NextResponse.json({
      success: true,
      message: `${importedCount} contatos importados com sucesso`,
      importedCount
    });

  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
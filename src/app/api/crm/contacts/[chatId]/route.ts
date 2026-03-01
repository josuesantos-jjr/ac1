import { NextRequest, NextResponse } from 'next/server';
import { crmDataService } from '../../../../../backend/service/crmDataService';

interface RouteParams {
  params: Promise<{
    chatId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { chatId } = await params;
    const contact = await crmDataService.loadContact(decodeURIComponent(chatId));

    if (!contact) {
      return NextResponse.json({
        error: 'Contato não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { chatId } = await params;
    const updates = await request.json();

    await crmDataService.updateContact(decodeURIComponent(chatId), updates);

    return NextResponse.json({
      success: true,
      message: 'Contato atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { chatId } = await params;

    // Por enquanto, apenas marcamos como inativo
    // Em uma implementação completa, poderíamos deletar fisicamente
    await crmDataService.updateContact(decodeURIComponent(chatId), {
      status: 'Inativo'
    });

    return NextResponse.json({
      success: true,
      message: 'Contato removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover contato:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
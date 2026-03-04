import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsAuth } from '../../../../backend/service/googleSheetsAuth';

export async function GET() {
  try {
    // Verifica se já está autenticado
    if (googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        authenticated: true,
        message: 'Usuário já está autenticado'
      });
    }

    // Gera URL de autorização
    const authUrl = googleSheetsAuth.generateAuthUrl();

    return NextResponse.json({
      authenticated: false,
      authUrl,
      message: 'Redirecione o usuário para a URL de autorização'
    });

  } catch (error) {
    console.error('Erro na autenticação Google:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    googleSheetsAuth.logout();
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({
      error: 'Erro ao fazer logout',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
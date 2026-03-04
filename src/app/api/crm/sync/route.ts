import { NextRequest, NextResponse } from 'next/server';
import { crmDataService } from '../../../../backend/service/crmDataService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { direction, clientId } = body; // 'toSheets' ou 'fromSheets', clientId opcional

    if (!clientId) {
      return NextResponse.json({
        error: 'clientId é obrigatório para sincronização'
      }, { status: 400 });
    }

    if (direction === 'fromSheets') {
      await crmDataService.syncFromGoogleSheets(clientId);
      return NextResponse.json({
        success: true,
        message: 'Sincronização do Google Sheets concluída'
      });
    } else if (direction === 'toSheets') {
      // Sincronizar todos os contatos do cliente para Sheets
      const contacts = await crmDataService.listContacts({ clienteId: clientId });
      let syncedCount = 0;

      for (const contact of contacts) {
        try {
          await crmDataService.updateContact(contact.chatId, contact);
          syncedCount++;
        } catch (error) {
          console.error(`Erro ao sincronizar contato ${contact.chatId}:`, error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `${syncedCount} contatos sincronizados para Google Sheets`
      });
    } else {
      return NextResponse.json({
        error: 'Direção inválida. Use "fromSheets" ou "toSheets"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// Endpoint para verificar status da sincronização
export async function GET() {
  try {
    // Verificar se está autenticado no Google
    const isAuthenticated = false; // TODO: implementar verificação

    return NextResponse.json({
      authenticated: isAuthenticated,
      lastSync: null, // TODO: implementar tracking de última sync
      status: 'ready'
    });

  } catch (error) {
    console.error('Erro ao verificar status de sincronização:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
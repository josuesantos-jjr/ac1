import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { syncManager } from '../../../database/sync.ts';
import { clienteCRUD } from '../../../database/crud.ts';

export async function POST(request: Request) {
  try {
    const { clientId, newStatus } = await request.json();

    if (!clientId || !newStatus) {
      return NextResponse.json(
        { error: 'clientId e newStatus são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar status
    if (!['ativo', 'cancelado'].includes(newStatus.toLowerCase())) {
      return NextResponse.json(
        { error: 'Status deve ser "ativo" ou "cancelado"' },
        { status: 400 }
      );
    }

    const status = newStatus.toLowerCase();

    // Verificar se cliente existe
    const clientePath = path.join(process.cwd(), 'clientes', clientId);
    const infoClientePath = path.join(clientePath, 'config', 'infoCliente.json');

    if (!fs.existsSync(infoClientePath)) {
      return NextResponse.json(
        { error: `Cliente ${clientId} não encontrado` },
        { status: 404 }
      );
    }

    // Ler infoCliente.json atual
    const infoCliente = JSON.parse(fs.readFileSync(infoClientePath, 'utf-8'));

    // Atualizar STATUS
    infoCliente.STATUS = status;

    // Salvar arquivo
    fs.writeFileSync(infoClientePath, JSON.stringify(infoCliente, null, 2), 'utf-8');

    // Atualizar no banco de dados
    const dbUpdated = clienteCRUD.updateStatus(clientId, status);

    // Sincronizar dados completos (para manter consistência)
    try {
      await syncManager.saveClientData(clientId, {
        infoCliente: infoCliente
      });
      console.log(`[API update-client-status] Cliente ${clientId} atualizado para status: ${status}`);
    } catch (syncError) {
      console.error(`[API update-client-status] Erro na sincronização:`, syncError);
      // Não falhar a requisição por erro de sync
    }

    return NextResponse.json({
      success: true,
      message: `Status do cliente ${clientId} alterado para ${status}`,
      clientId,
      newStatus: status,
      dbUpdated
    });

  } catch (error: any) {
    console.error('[API update-client-status] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { crmDataService, CRMContact } from '../../../../backend/service/crmDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const etapaFunil = searchParams.get('etapaFunil') || undefined;
    const lead = searchParams.get('lead') as 'sim' | 'não' | undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Verificar se há contatos no banco
    const existingContacts = await crmDataService.listContacts({});

    // Se não há contatos, tentar importar automaticamente dos dados.json
    if (existingContacts.length === 0) {
      console.log(`[API crm/contacts] Banco vazio, tentando importar dados automaticamente do cliente: ${clientId}`);

      try {
        // Importar dados do cliente específico que está sendo acessado
        const fullPath = `clientes/${clientId}`;
        console.log(`[API crm/contacts] Caminho para importação: ${fullPath}`);

        // Verificar se o diretório existe antes de tentar importar
        const fs = require('fs');
        const pathModule = require('path');
        const historicoPath = pathModule.join(fullPath, 'Chats', 'Historico');
        console.log(`[API crm/contacts] Verificando diretório histórico: ${historicoPath}`);

        if (fs.existsSync(historicoPath)) {
          const chatDirs = fs.readdirSync(historicoPath);
          console.log(`[API crm/contacts] Encontrados ${chatDirs.length} diretórios de chat:`, chatDirs);

          const importedCount = await crmDataService.importFromDadosJson(fullPath);
          console.log(`[API crm/contacts] ${importedCount} contatos importados de ${clientId}`);
        } else {
          console.log(`[API crm/contacts] Diretório histórico não encontrado: ${historicoPath}`);
        }
      } catch (importError: any) {
        console.error('[API crm/contacts] Erro na importação automática:', importError?.message || importError);
      }
    } else {
      console.log(`[API crm/contacts] Já existem ${existingContacts.length} contatos no banco para cliente ${clientId}`);
    }

    const contacts = await crmDataService.listContacts({
      clienteId: clientId || undefined,
      etapaFunil,
      lead,
      status,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: contacts,
      total: contacts.length,
      autoImported: existingContacts.length === 0 && contacts.length > 0
    });

  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contactData = body;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const contact: CRMContact = {
      ...contactData,
      clienteId: clientId || 'unknown'
    };

    // Validações básicas
    if (!contact.chatId || !contact.telefone) {
      return NextResponse.json({
        error: 'Campos obrigatórios: chatId e telefone'
      }, { status: 400 });
    }

    await crmDataService.addContact(contact);

    return NextResponse.json({
      success: true,
      message: 'Contato criado com sucesso',
      data: contact
    });

  } catch (error) {
    console.error('Erro ao criar contato:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
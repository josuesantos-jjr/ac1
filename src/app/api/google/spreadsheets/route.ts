import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsAuth } from '../../../../backend/service/googleSheetsAuth';

export async function GET(request: NextRequest) {
  try {
    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const drive = await googleSheetsAuth.getDriveClient();

    // Busca planilhas no Google Drive do usuário
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id,name,createdTime,modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    const spreadsheets = response.data.files?.map(file => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime
    })) || [];

    return NextResponse.json({
      spreadsheets,
      authenticated: true
    });

  } catch (error) {
    console.error('Erro ao listar planilhas:', error);
    return NextResponse.json({
      error: 'Erro ao listar planilhas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!googleSheetsAuth.isAuthenticated()) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        authenticated: false
      }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({
        error: 'Nome da planilha é obrigatório'
      }, { status: 400 });
    }

    const sheets = await googleSheetsAuth.getSheetsClient();

    // Cria uma nova planilha
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: name
        },
        sheets: [{
          properties: {
            title: 'CRM Contacts',
            sheetType: 'GRID',
            gridProperties: {
              rowCount: 1000,
              columnCount: 15
            }
          }
        }]
      }
    });

    // Adiciona cabeçalhos padrão
    const headers = [
      'ID Chat',
      'Nome',
      'Email',
      'Telefone',
      'Etapa do Funil',
      'Data de Criação',
      'Última Atualização',
      'Notas',
      'Tags',
      'Status',
      'Valor Estimado',
      'Responsável',
      'Fonte',
      'Último Contato',
      'Próximo Follow-up'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.data.spreadsheetId!,
      range: 'CRM Contacts!A1:O1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    return NextResponse.json({
      spreadsheet: {
        id: spreadsheet.data.spreadsheetId,
        name: spreadsheet.data.properties?.title,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit`
      },
      authenticated: true
    });

  } catch (error) {
    console.error('Erro ao criar planilha:', error);
    return NextResponse.json({
      error: 'Erro ao criar planilha',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
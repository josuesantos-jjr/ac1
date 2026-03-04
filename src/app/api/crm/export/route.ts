import { NextRequest, NextResponse } from 'next/server';
import { crmDataService } from '../../../../backend/service/crmDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv ou json

    if (format === 'csv') {
      const csvContent = await crmDataService.exportToCSV();

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=crm-contacts.csv'
        }
      });
    } else if (format === 'json') {
      const contacts = await crmDataService.listContacts();

      return NextResponse.json(contacts, {
        headers: {
          'Content-Disposition': 'attachment; filename=crm-contacts.json'
        }
      });
    } else {
      return NextResponse.json({
        error: 'Formato não suportado. Use "csv" ou "json"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
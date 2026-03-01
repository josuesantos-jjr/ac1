import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Use process.cwd() para obter o diretório raiz do projeto
    const envPath = path.resolve(process.cwd(), 'clientes', clientId, 'config', '.env');
    
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      const status = envContent
        .split('\n')
        .find(line => line.startsWith('STATUS='))
        ?.split('=')[1]
        ?.trim()
        ?.replace(/^["']|["']$/g, '');

      return NextResponse.json({ status: status || 'Arquivo .env sem STATUS definido' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Arquivo .env não encontrado para cliente ${clientId}: ${envPath}`);
        return NextResponse.json({ status: 'Cliente sem arquivo .env' });
      }
      console.error('Erro ao ler arquivo .env:', error);
      return NextResponse.json({ status: 'Erro ao ler status' });
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
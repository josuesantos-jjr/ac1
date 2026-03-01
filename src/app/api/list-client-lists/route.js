import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Função auxiliar para obter o caminho da pasta de listas
function getListasPath(clientId) {
  if (!clientId || typeof clientId !== 'string') {
    throw new Error('ClientId inválido fornecido.');
  }

  const clientePath = path.join(process.cwd(), 'clientes', clientId);
  return path.join(clientePath, 'config', 'listas');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'ClientId é obrigatório' },
        { status: 400 }
      );
    }

    const listasDir = getListasPath(clientId);

    if (!existsSync(listasDir)) {
      console.log(
        `Diretório de listas não encontrado para ${clientId}: ${listasDir}`
      );
      return NextResponse.json({ listNames: [] }); // Retorna array vazio se a pasta não existe
    }

    const files = await fs.readdir(listasDir);
    const listNames = files
      .filter((file) => file.toLowerCase().endsWith('.json')) // Filtra apenas arquivos .json
      .map((file) => path.basename(file, '.json')); // Remove a extensão .json

    return NextResponse.json({ listNames });
  } catch (error) {
    console.error('Erro ao listar arquivos de lista:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao listar arquivos de lista',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const modelsDirectory = path.join(process.cwd(), 'clientes', 'modelos');

  try {
    const dirents = await fs.readdir(modelsDirectory, { withFileTypes: true });
    const directories = dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('Modelos encontrados:', directories); // Log para depuração
    return NextResponse.json({ models: directories }, { status: 200 });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Diretório de modelos não encontrado:', modelsDirectory);
      // Se o diretório não existe, retorna uma lista vazia
      return NextResponse.json({ models: [] }, { status: 200 });
    }
    console.error('Erro ao listar modelos:', error);
    return NextResponse.json({ error: 'Erro interno ao listar modelos' }, { status: 500 });
  }
}
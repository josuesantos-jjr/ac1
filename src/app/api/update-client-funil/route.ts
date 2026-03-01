import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { clientId, funil } = await request.json();

    if (!clientId || !funil) {
      return NextResponse.json(
        { error: 'Client ID and funil are required' },
        { status: 400 }
      );
    }

    const infoClientePath = path.join(
      process.cwd(),
      'clientes',
      clientId,
      'config',
      'infoCliente.json'
    );

    // Ler o arquivo atual
    const infoClienteContent = await fs.readFile(infoClientePath, 'utf-8');
    const config = JSON.parse(infoClienteContent);

    // Atualizar o "Funil de vendas" dentro do GEMINI_PROMPT
    if (config.GEMINI_PROMPT && config.GEMINI_PROMPT.length > 0) {
      config.GEMINI_PROMPT[0]["Funil de vendas"] = funil;
    }

    // Salvar de volta
    await fs.writeFile(infoClientePath, JSON.stringify(config, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating funil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar funil de vendas' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const requestBody = await request.json().catch((error) => {
      console.error('Erro ao parsear JSON:', error);
      return null;
    });

    if (!requestBody) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }

    const { clientId } = requestBody;

    if (!clientId) {
      return NextResponse.json(
        { error: 'ClientId é obrigatório' },
        { status: 400 }
      );
    }

    // Simula um delay para processamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Resposta simulada do início do desenvolvimento
    const response = {
      success: true,
      clientId,
      status: 'development_started',
      timestamp: new Date().toISOString(),
      environment: {
        initialized: true,
        type: 'development',
        version: '1.0.0',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao iniciar desenvolvimento:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar desenvolvimento' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Status simulado do ambiente de desenvolvimento
    const status = {
      active: true,
      environment: 'development',
      lastUpdate: new Date().toISOString(),
      metrics: {
        activeProjects: 3,
        totalBuilds: 150,
        successRate: '98.5%',
      },
      resources: {
        cpu: '25%',
        memory: '1.2GB',
        storage: '5GB',
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Erro ao buscar status do desenvolvimento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status do desenvolvimento' },
      { status: 500 }
    );
  }
}

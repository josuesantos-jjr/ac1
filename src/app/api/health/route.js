import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar se a aplicação está funcionando corretamente
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // Verificar se consegue acessar recursos básicos
    const memoryUsage = process.memoryUsage();
    const isHealthy = {
      status: 'healthy',
      timestamp,
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(isHealthy, { status: 200 });

  } catch (error) {
    console.error('Erro no health check:', error);

    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
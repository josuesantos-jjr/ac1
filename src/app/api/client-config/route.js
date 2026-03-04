import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
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
 
    try {
      const infoClienteContent = await fs.readFile(infoClientePath, 'utf-8');
      const config = JSON.parse(infoClienteContent);

      // Verificações básicas de validação
      if (!config || typeof config !== 'object') {
        throw new Error('Arquivo infoCliente.json contém dados inválidos');
      }
 
      // Format QR code for display
      if (config.QR_CODE) {
        try {
          // Remove surrounding quotes if present
          const qrCode = config.QR_CODE.trim().replace(/^['"]|['"]$/g, '');
 
          // Split the comma-separated values and format them nicely for display
          const parts = qrCode.split(',').map((part) => part.trim());
          config.QR_CODE = parts.join('\n');
        } catch (error) {
          console.error('Error processing QR code:', error);
          config.QR_CODE = '';
        }
      }
 
      // Default values for required fields
      config.STATUS_SESSION = config.STATUS_SESSION || 'disconnected';
 
      // Format connection status for display
      config.STATUS_SESSION = config.STATUS_SESSION.toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
 
      return NextResponse.json(config);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Arquivo infoCliente.json não encontrado para cliente ${clientId}: ${infoClientePath}`);
        return NextResponse.json(
          {
            error: 'Arquivo de configuração do cliente não encontrado',
            details: `Cliente ${clientId} não possui arquivo infoCliente.json`,
            suggestion: 'Verifique se o cliente foi criado corretamente'
          },
          { status: 404 }
        );
      }

      console.error('Error reading client config from infoCliente.json:', error);
      return NextResponse.json(
        {
          error: 'Erro ao ler configuração do cliente',
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching client config:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch client configuration',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

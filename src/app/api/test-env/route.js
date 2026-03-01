import { NextResponse } from 'next/server';
import * as fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    // Extrai o cliente dos parâmetros da requisição
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({
        error: 'Cliente não especificado. Use ?clientId=ativos/NomeCliente',
        status: 'error'
      }, { status: 400 });
    }

    // Valida formato do clientId (tipo/nome)
    const [clientType, clientName] = clientId.split('/');
    if (!clientType || !clientName) {
      return NextResponse.json({
        error: 'Formato de clientId inválido. Use: ativos/NomeCliente',
        status: 'error'
      }, { status: 400 });
    }

    // Constrói caminho do cliente dinamicamente
    const configFilePath = path.join(process.cwd(), 'clientes', clientType, clientName, 'config/config.json');
    let clientConfig = {};
    let fileStatus = 'não encontrado';

    try {
      const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
      clientConfig = JSON.parse(configFileContent);
      fileStatus = 'encontrado';
      console.log('Configuração do cliente lida do arquivo local com sucesso');
    } catch (error) {
      fileStatus = `erro: ${error.message}`;
      console.error('Erro ao ler a configuração do cliente do arquivo local:', error);
    }

    // Status das variáveis de ambiente (agora lidas do arquivo)
    const envStatus = {
      cliente: {
        nome: Boolean(clientConfig.nome),
        id: Boolean(clientConfig.id),
        // Adicione outros campos conforme necessário
      }
    };

    // Informações de diagnóstico
    const diagnostics = {
      configFileStatus: fileStatus,
      configFilePath: configFilePath,
      nodeEnv: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      envStatus,
      diagnostics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na verificação do ambiente:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro na verificação do ambiente',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
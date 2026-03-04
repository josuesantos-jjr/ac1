import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

/**
 * API para monitoramento de conexões WhatsApp
 * GET /api/whatsapp-status
 */
export async function GET(request: NextRequest) {
  try {
    const whatsappStatus = await getWhatsappStatus();
    return NextResponse.json(whatsappStatus);
  } catch (erro) {
    console.error('Erro ao coletar status do WhatsApp:', erro);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}

/**
 * Coleta status das conexões WhatsApp de todos os clientes
 */
async function getWhatsappStatus() {
  const clientesPath = path.join(process.cwd(), 'clientes');
  const clientes = [];

  try {
    if (!fs.existsSync(clientesPath)) {
      return {
        clientes: [],
        totalClientes: 0,
        conexoesAtivas: 0,
        conexoesInativas: 0,
        timestamp: new Date().toISOString()
      };
    }

    const clientesDirs = fs.readdirSync(clientesPath);

    for (const clienteDir of clientesDirs) {
      const clientePath = path.join(clientesPath, clienteDir);

      // Pula diretórios de modelos
      if (clienteDir === 'modelos') continue;

      // Verifica se é um diretório (cliente)
      if (fs.statSync(clientePath).isDirectory()) {
        const clienteStatus = await analisarClienteWhatsApp(clienteDir, clientePath);
        if (clienteStatus) {
          clientes.push(clienteStatus);
        }
      }
    }

    // Estatísticas gerais
    const conexoesAtivas = clientes.filter(c => c.whatsapp.connected).length;
    const conexoesInativas = clientes.filter(c => !c.whatsapp.connected).length;

    return {
      clientes,
      totalClientes: clientes.length,
      conexoesAtivas,
      conexoesInativas,
      estatisticas: {
        percentualConectado: clientes.length > 0 ? Math.round((conexoesAtivas / clientes.length) * 100) : 0
      },
      timestamp: new Date().toISOString()
    };

  } catch (erro) {
    console.error('Erro ao analisar clientes WhatsApp:', erro);
    return {
      clientes: [],
      totalClientes: 0,
      conexoesAtivas: 0,
      conexoesInativas: 0,
      error: erro instanceof Error ? erro.message : String(erro),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Analisa status do WhatsApp para um cliente específico
 */
async function analisarClienteWhatsApp(clienteNome: string, clientePath: string): Promise<any> {
  try {
    const configPath = path.join(clientePath, 'config', 'infoCliente.json');

    if (!fs.existsSync(configPath)) {
      return {
        nome: clienteNome,
        whatsapp: {
          connected: false,
          status: 'config_not_found',
          lastActivity: null
        },
        qrCode: null,
        sessionInfo: null
      };
    }

    const infoCliente = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Verifica se há arquivo de sessão
    const sessionPath = path.join(clientePath, 'config', 'session.json');
    let sessionInfo = null;

    if (fs.existsSync(sessionPath)) {
      try {
        sessionInfo = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
      } catch (erro) {
        sessionInfo = { error: 'Erro ao ler sessão' };
      }
    }

    // Verifica se há QR code pendente
    const qrCodePath = path.join(clientePath, 'config', 'qrcode.ts');
    let qrCodeData = null;

    if (fs.existsSync(qrCodePath)) {
      try {
        const qrContent = fs.readFileSync(qrCodePath, 'utf-8');
        // Extrai dados do QR code se existir
        const qrMatch = qrContent.match(/base64,([^']+)/);
        if (qrMatch) {
          qrCodeData = {
            exists: true,
            data: qrMatch[1]
          };
        }
      } catch (erro) {
        qrCodeData = { error: 'Erro ao ler QR code' };
      }
    }

    // Determina status da conexão baseado em vários fatores
    const sessionStatus = infoCliente.STATUS_SESSION || 'unknown';
    const hasSession = sessionInfo && !sessionInfo.error;
    const hasQrCode = qrCodeData && qrCodeData.exists;

    let connectionStatus = 'unknown';
    let isConnected = false;

    if (hasQrCode) {
      connectionStatus = 'qr_pending';
      isConnected = false;
    } else if (sessionStatus === 'inChat' || (hasSession && sessionStatus !== 'disconnected')) {
      connectionStatus = 'connected';
      isConnected = true;
    } else if (sessionStatus === 'disconnected' || sessionStatus === 'notLogged') {
      connectionStatus = 'disconnected';
      isConnected = false;
    } else {
      connectionStatus = 'unknown';
      isConnected = false;
    }

    // Última atividade baseada no timestamp do arquivo de sessão
    let lastActivity = null;
    if (hasSession && sessionInfo.timestamp) {
      lastActivity = sessionInfo.timestamp;
    }

    return {
      nome: clienteNome,
      whatsapp: {
        connected: isConnected,
        status: connectionStatus,
        statusSession: sessionStatus,
        lastActivity: lastActivity,
        hasSession,
        hasQrCode
      },
      qrCode: qrCodeData,
      sessionInfo: sessionInfo,
      configInfo: {
        cliente: infoCliente.CLIENTE,
        status: infoCliente.STATUS,
        targetChatId: infoCliente.TARGET_CHAT_ID,
        bkChatId: infoCliente.BK_CHATID
      }
    };

  } catch (erro) {
    console.error(`Erro ao analisar cliente ${clienteNome}:`, erro);
    return {
      nome: clienteNome,
      error: erro instanceof Error ? erro.message : String(erro),
      whatsapp: {
        connected: false,
        status: 'error',
        lastActivity: null
      }
    };
  }
}
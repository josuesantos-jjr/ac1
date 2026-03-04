import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

/**
 * API para verificar status do backup
 * GET /api/backup-status
 */
export async function GET(request: NextRequest) {
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
    const clientePath = path.join(process.cwd(), 'clientes', clientType, clientName);

    if (!fs.existsSync(clientePath)) {
      return NextResponse.json({
        error: 'Cliente não encontrado',
        status: 'error'
      }, { status: 404 });
    }

    // Verifica arquivo de status do backup
    const backupStatusPath = path.join(clientePath, 'backup-status.json');

    if (!fs.existsSync(backupStatusPath)) {
      return NextResponse.json({
        status: 'never_executed',
        message: 'Backup nunca foi executado',
        lastBackup: null,
        chatId: null
      });
    }

    // Lê status do backup
    const backupStatus = JSON.parse(fs.readFileSync(backupStatusPath, 'utf-8'));

    // Busca chat ID de backup
    let chatId = null;
    try {
      const infoClientePath = path.join(clientePath, 'config', 'infoCliente.json');
      if (fs.existsSync(infoClientePath)) {
        const infoCliente = JSON.parse(fs.readFileSync(infoClientePath, 'utf-8'));
        chatId = infoCliente.BK_CHATID || null;
      }
    } catch (erro) {
      console.error('Erro ao ler BK_CHATID:', erro);
    }

    // Determina status baseado na última execução
    const agora = new Date();
    const ultimoBackup = new Date(backupStatus.ultimoBackup);
    const horasDesdeUltimoBackup = (agora.getTime() - ultimoBackup.getTime()) / (1000 * 60 * 60);

    let status = 'unknown';
    let statusMessage = '';

    if (backupStatus.sucesso === true) {
      if (horasDesdeUltimoBackup < 24) {
        status = 'success';
        statusMessage = 'Backup executado hoje com sucesso';
      } else if (horasDesdeUltimoBackup < 48) {
        status = 'warning';
        statusMessage = 'Último backup foi ontem';
      } else {
        status = 'error';
        statusMessage = 'Último backup foi há mais de 48 horas';
      }
    } else if (backupStatus.sucesso === false) {
      status = 'error';
      statusMessage = 'Último backup falhou';
    }

    const hoje = new Date().toISOString().split('T')[0];
    const ultimoBackupHoje = backupStatus.ultimoBackup && backupStatus.ultimoBackup.includes(hoje);

    return NextResponse.json({
      status,
      statusMessage,
      lastBackup: backupStatus.ultimoBackup,
      lastBackupHoje: ultimoBackupHoje,
      sucesso: backupStatus.sucesso,
      arquivo: backupStatus.arquivo,
      chatId,
      horasDesdeUltimoBackup: Math.round(horasDesdeUltimoBackup)
    });

  } catch (erro) {
    console.error('Erro ao verificar status do backup:', erro);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      status: 'error',
      message: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}

/**
 * API para forçar execução de backup
 * POST /api/backup-status
 */
export async function POST(request: NextRequest) {
  try {
    // Extrai o cliente do body da requisição
    const body = await request.json();
    const clientId = body.clientId;

    if (!clientId) {
      return NextResponse.json({
        error: 'Cliente não especificado. Use {"clientId": "ativos/NomeCliente"}',
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
    const clientePath = path.join(process.cwd(), 'clientes', clientType, clientName);

    if (!fs.existsSync(clientePath)) {
      return NextResponse.json({
        error: 'Cliente não encontrado',
        status: 'error'
      }, { status: 404 });
    }

    // Backup manual não disponível - backup automático via Google Drive Scheduler
    // Para executar backup manual, use a interface no BackupManager
    return NextResponse.json({
      status: 'disabled',
      message: 'Backup manual desabilitado. Use o BackupManager para backup manual ou aguarde o automático às 00:05.',
      note: 'O backup agora é executado automaticamente pelo serviço PM2 backup-scheduler.',
      timestamp: new Date().toISOString()
    });

  } catch (erro) {
    console.error('Erro ao executar backup forçado:', erro);
    return NextResponse.json({
      error: 'Erro ao executar backup',
      status: 'error',
      message: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}
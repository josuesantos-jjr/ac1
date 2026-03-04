import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { syncManager } from '../../../database/sync.ts';

/**
 * API para verificar histórico de backup (otimizada)
 * GET /api/backup-history
 */
export async function GET(request) {
  try {
    const backupData = await getBackupHistory();

    if (!backupData) {
      return NextResponse.json({
        status: 'never_executed',
        message: 'Nenhum backup foi executado ainda',
        historico: [],
        ultimoBackup: null,
        estatisticas: null
      });
    }

    return NextResponse.json(backupData);

  } catch (erro) {
    console.error('Erro ao verificar histórico de backup:', erro);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      status: 'error',
      message: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}

/**
 * Obtém histórico completo de backups
 */
async function getBackupHistory() {
  try {
    const backupLogPath = path.join(process.cwd(), 'backup-log.json');

    if (!fs.existsSync(backupLogPath)) {
      return null;
    }

    const logsContent = fs.readFileSync(backupLogPath, 'utf-8');
    const logs = JSON.parse(logsContent);

    if (!logs.backups || logs.backups.length === 0) {
      return null;
    }

    // Ordena backups por data (mais recente primeiro)
    const backupsOrdenados = logs.backups.sort((a, b) =>
      new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime()
    );

    const ultimoBackup = backupsOrdenados[0];
    const hoje = new Date().toISOString().split('T')[0];
    const ultimoBackupHoje = ultimoBackup.dataExecucao?.includes(hoje);

    // Calcula estatísticas
    const estatisticas = calcularEstatisticas(backupsOrdenados);

    return {
      status: ultimoBackup.whatsapp?.enviado === true ? 'success' :
              ultimoBackup.whatsapp?.enviado === false ? 'error' : 'unknown',
      message: ultimoBackup.whatsapp?.enviado === true ? 'Último backup enviado com sucesso' :
               ultimoBackup.whatsapp?.enviado === false ? 'Último backup falhou no envio' :
               'Status do backup desconhecido',
      historico: backupsOrdenados.slice(0, 10), // Últimos 10 backups
      ultimoBackup: ultimoBackup,
      ultimoBackupHoje,
      estatisticas,
      lastUpdated: logs.lastUpdated
    };

  } catch (erro) {
    console.error('Erro ao processar histórico de backup:', erro);
    return null;
  }
}

/**
 * Calcula estatísticas dos backups
 */
function calcularEstatisticas(backups) {
  if (!backups || backups.length === 0) {
    return null;
  }

  const sucessos = backups.filter(b => b.whatsapp?.enviado === true);
  const falhas = backups.filter(b => b.whatsapp?.enviado === false);
  const tamanhoMedio = backups.reduce((acc, b) => acc + (b.metricas?.backupCompactadoMB || 0), 0) / backups.length;

  return {
    totalBackups: backups.length,
    backupsSucesso: sucessos.length,
    backupsFalha: falhas.length,
    taxaSucesso: Math.round((sucessos.length / backups.length) * 100),
    tamanhoMedioMB: Math.round(tamanhoMedio),
    periodo: {
      primeiro: backups[backups.length - 1]?.dataExecucao,
      ultimo: backups[0]?.dataExecucao
    }
  };
}

/**
 * API para forçar execução de backup
 * POST /api/backup-history
 */
export async function POST(request) {
  try {
    // Busca o cliente ativo (CMW por padrão)
    const clientePath = path.join(process.cwd(), 'clientes',  'CMW');

    if (!fs.existsSync(clientePath)) {
      return NextResponse.json({
        error: 'Cliente não encontrado',
        status: 'error'
      }, { status: 404 });
    }

    // Executa backup forçado
    const { backupServiceOtimizado } = await import('../../../../src/backend/service/backupServiceOtimizado.js');

    const resultadoBackup = await backupServiceOtimizado.executarBackup(clientePath);

    if (resultadoBackup) {
      const { buffer, registro } = resultadoBackup;

      // Obtém chat ID
      const chatIdBackup = backupServiceOtimizado.obterChatIdBackup(clientePath);
      if (chatIdBackup) {
        try {
          // Gera arquivo de backup para envio manual
          const tempFileName = `backup-${Date.now()}.zip`;
          const tempFilePath = path.join(process.cwd(), 'temp', tempFileName);

          // Cria diretório temp se não existir
          if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });
          }

          // 🔄 SALVAR NO SQLITE (sincronização automática) - backup history
          try {
            await syncManager.saveClientData('backup-client', {
              backupHistory: {
                backupId: registro.backupId,
                dataExecucao: registro.dataExecucao,
                status: 'success',
                metricas: registro.metricas,
                whatsapp: {
                  enviado: true,
                  chatId: chatIdBackup,
                  dataEnvio: new Date().toISOString(),
                  tamanhoEnviadoMB: Math.round(buffer.length / 1024 / 1024),
                  status: 'arquivo_gerado_para_envio_manual'
                }
              }
            });
            console.log(`[API /api/backup-history POST] Backup salvo no SQLite`);
          } catch (sqliteError) {
            console.error(`[API /api/backup-history POST] Erro ao salvar no SQLite:`, sqliteError);
            // Continua com a funcionalidade mesmo se SQLite falhar
          }

          // Salva buffer do backup
          fs.writeFileSync(tempFilePath, buffer);

          // Finaliza registro com sucesso
          await backupServiceOtimizado.finalizarBackupComWhatsApp({}, chatIdBackup, buffer, {
            ...registro,
            whatsapp: {
              enviado: true,
              chatId: chatIdBackup,
              dataEnvio: new Date().toISOString(),
              tamanhoEnviadoMB: Math.round(buffer.length / 1024 / 1024),
              status: 'arquivo_gerado_para_envio_manual'
            }
          });

          return NextResponse.json({
            status: 'success',
            message: 'Backup gerado com sucesso - arquivo disponível para envio manual',
            arquivo: tempFileName,
            caminho: tempFilePath,
            backupId: registro.backupId,
            metricas: registro.metricas,
            nota: 'Envie o arquivo manualmente via WhatsApp para o chat configurado'
          });
        } catch (erro) {
          console.error('Erro ao processar backup:', erro);
          return NextResponse.json({
            error: 'Erro ao processar backup',
            status: 'error',
            message: erro instanceof Error ? erro.message : String(erro)
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({
          error: 'Chat ID de backup não configurado',
          status: 'error'
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        status: 'skipped',
        message: 'Backup já foi executado hoje',
        timestamp: new Date().toISOString()
      });
    }

  } catch (erro) {
    console.error('Erro ao executar backup forçado:', erro);
    return NextResponse.json({
      error: 'Erro ao executar backup',
      status: 'error',
      message: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}
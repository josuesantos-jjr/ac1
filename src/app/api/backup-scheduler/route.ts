/**
 * API para gerenciamento do Google Drive Backup Scheduler
 * GET - Obtém status e configuração atual
 * POST - Salva configuração e permite backup manual
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { googleDriveBackupScheduler } from '../../../backend/service/googleDriveBackupScheduler';

// Função auxiliar para calcular estatísticas da pasta
function calcularEstatisticasPasta(pastaPath: string): { totalArquivos: number; tamanhoTotal: number; tamanhoMB: number } {
  let totalArquivos = 0;
  let tamanhoTotal = 0;

  const calcularRecursivo = (dirPath: string) => {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          calcularRecursivo(fullPath);
        } else {
          totalArquivos++;
          tamanhoTotal += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Erro ao calcular estatísticas da pasta ${dirPath}`, error);
    }
  };

  calcularRecursivo(pastaPath);

  return {
    totalArquivos,
    tamanhoTotal,
    tamanhoMB: Math.round(tamanhoTotal / 1024 / 1024)
  };
}

export async function GET() {
  try {
    const config = googleDriveBackupScheduler.obterConfiguracao();

    // Verificar logs recentes
    const logPath = path.join(process.cwd(), 'backup-scheduler-log.json');
    let ultimoBackup = null;

    if (fs.existsSync(logPath)) {
      const logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      if (logs.backups && logs.backups.length > 0) {
        ultimoBackup = logs.backups[logs.backups.length - 1];
      }
    }

    // Verificar se foi executado hoje
    const hoje = new Date().toISOString().split('T')[0];
    const backupExecutadoHoje = ultimoBackup && ultimoBackup.dataExecucao?.includes(hoje);

    return NextResponse.json({
      configurado: !!config,
      config,
      ultimoBackup,
      backupExecutadoHoje,
      status: backupExecutadoHoje ? 'executado_hoje' : 'pendente'
    });

  } catch (error) {
    console.error('Erro ao obter status do scheduler:', error);
    return NextResponse.json({
      error: 'Erro ao obter status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, config } = body;

    if (action === 'save_config' && config) {
      googleDriveBackupScheduler.salvarConfiguracao(config);
      return NextResponse.json({
        success: true,
        message: 'Configuração salva com sucesso'
      });
    } else if (action === 'execute_backup') {
      const folderId = body.folderId;
      if (!folderId) {
        return NextResponse.json({
          error: 'ID da pasta do Google Drive é obrigatório'
        }, { status: 400 });
      }

      try {
        const { googleDriveBackupScheduler } = await import('../../../backend/service/googleDriveBackupScheduler');
        const googleSheetsAuth = (await import('../../../backend/service/googleSheetsAuth')).GoogleSheetsAuth;
        const auth = new googleSheetsAuth();

        if (!auth.isAuthenticated()) {
          return NextResponse.json({
            error: 'Usuário não autenticado no Google Drive'
          }, { status: 401 });
        }

        // Mover imports dinâmicos para fora do executor da Promise
        const archiverModule = await import('archiver');
        const archiver = archiverModule.default;
        const ReadableStream = (await import('stream')).Readable;

        return new Promise<NextResponse>((resolve, reject) => {
          const inicio = Date.now();
          const pastas = ['clientes', 'dados'];
          const chunks: Buffer[] = [];
          let totalSize = 0;
          const metadados: any = {
            pastas: {},
            totalArquivos: 0,
            timestamp: new Date().toISOString()
          };

          const archive = archiver('zip', { zlib: { level: 9 } });

          archive.on('error', (error) => {
            console.error('Erro no arquivador:', error);
            resolve(NextResponse.json({
              error: 'Erro na compactação',
              details: error.message
            }, { status: 500 }));
          });

          archive.on('data', (chunk) => {
            chunks.push(chunk);
            totalSize += chunk.length;
          });

          archive.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const hoje = new Date();
              const fileName = `backup_manual_${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}_${String(hoje.getHours()).padStart(2, '0')}-${String(hoje.getMinutes()).padStart(2, '0')}.zip`;

              const drive = await auth.getDriveClient();
              const fileMetadata = {
                name: fileName,
                parents: [folderId]
              };

              const stream = require('stream').Readable.from(buffer);
              const media = {
                mimeType: 'application/zip',
                body: stream
              };

              const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id,name,size,createdTime'
              });

              const registro = {
                backupId: `backup-manual-${Date.now()}`,
                dataExecucao: new Date().toISOString(),
                tipo: 'backup_manual_google_drive',
                arquivo: {
                  nome: fileName,
                  tamanho: totalSize,
                  googleFileId: response.data.id,
                  downloadUrl: `https://drive.google.com/file/d/${response.data.id}/view`
                },
                metadados,
                sistema: {
                  duracaoSegundos: Math.round((Date.now() - inicio) / 1000),
                  memoriaUsadaMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                  status: 'success'
                },
                configuracao: {
                  destino: 'google_drive_manual',
                  pastasProcessadas: pastas
                }
              };

              const logPath = path.join(process.cwd(), 'backup-scheduler-log.json');
              let logs: { backups: any[] } = { backups: [] };

              if (fs.existsSync(logPath)) {
                logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
              }
              logs.backups.push(registro);
              if (logs.backups.length > 30) {
                logs.backups = logs.backups.slice(-30);
              }
              fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf-8');

              resolve(NextResponse.json({
                success: true,
                message: `Backup manual executado com sucesso`,
                fileName,
                tamanhoMB: Math.round(totalSize / 1024 / 1024),
                tempoTotal: Math.round((Date.now() - inicio) / 1000),
                downloadUrl: registro.arquivo.downloadUrl
              }));

            } catch (uploadError) {
              console.error('Erro no upload:', uploadError);
              resolve(NextResponse.json({
                error: 'Erro no upload para Google Drive',
                details: uploadError instanceof Error ? uploadError.message : String(uploadError)
              }, { status: 500 }));
            }
          });

          for (const pastaNome of pastas) {
            const pastaPath = path.join(process.cwd(), pastaNome);
            if (fs.existsSync(pastaPath)) {
              const stats = calcularEstatisticasPasta(pastaPath);
              metadados.pastas[pastaNome] = stats;
              metadados.totalArquivos += stats.totalArquivos;
              archive.directory(pastaPath, pastaNome);
            }
          }
          archive.finalize();
        });

      } catch (error) {
        console.error('Erro no backup manual:', error);
        return NextResponse.json({
          error: 'Erro ao executar backup manual',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }

    } else {
      return NextResponse.json({
        error: 'Ação inválida'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API do scheduler:', error);
    return NextResponse.json({
      error: 'Erro na operação',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
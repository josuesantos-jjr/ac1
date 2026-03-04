import { NextRequest, NextResponse } from 'next/server';
import { googleDriveBackupService, BackupConfig, BackupResult } from '../../../backend/service/googleDriveBackupService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const folderId = searchParams.get('folderId');

    if (action === 'status') {
      // Verificar status da autenticação
      const authenticated = googleDriveBackupService.isAuthenticated();

      return NextResponse.json({
        authenticated,
        service: 'google_drive_backup'
      });
    }

    if (action === 'list_backups' && folderId) {
      // Listar backups existentes
      const backups = await googleDriveBackupService.listarBackups(folderId);

      return NextResponse.json({
        backups,
        authenticated: googleDriveBackupService.isAuthenticated()
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de backup Google Drive (GET):', error);
    return NextResponse.json({
      error: 'Erro na API de backup',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, backupConfig } = body;

    if (action === 'execute_backup') {
      // Executar backup completo
      if (!backupConfig || !backupConfig.googleFolderId) {
        return NextResponse.json({
          error: 'Configuração de backup inválida. folderId é obrigatório.'
        }, { status: 400 });
      }

      // Configuração padrão com valores seguros
      const config: BackupConfig = {
        googleFolderId: backupConfig.googleFolderId,
        schedule: backupConfig.schedule || 'manual',
        retentionDays: backupConfig.retentionDays || 30,
        compressionLevel: backupConfig.compressionLevel || 9,
        enabled: true
      };

      const result: BackupResult = await googleDriveBackupService.executarBackupCompleto(config);

      return NextResponse.json({
        success: result.success,
        backupId: result.backupId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        googleFileId: result.googleFileId,
        downloadUrl: result.downloadUrl,
        error: result.error
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de backup Google Drive (POST):', error);
    return NextResponse.json({
      error: 'Erro ao executar backup',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
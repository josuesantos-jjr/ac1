/**
 * Script para iniciar o Google Drive Backup Scheduler via PM2
 * Executa backup automático diário das pastas clientes/ e dados/
 */

import { exec } from 'child_process';

console.log('🚀 Iniciando Google Drive Backup Scheduler...');

const pm2Command = `bun pm2 start src/backend/service/googleDriveBackupScheduler.ts --name "backup-scheduler" -- --transpile-only`;

exec(pm2Command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Erro ao iniciar scheduler: ${error.message}`);
    return;
  }

  if (stderr) {
    console.warn(`⚠️ Avisos: ${stderr}`);
  }

  console.log(`✅ Scheduler iniciado com sucesso:`);
  console.log(stdout);

  // Salvar configuração PM2
  exec('pm2 save', (saveError, saveStdout, saveStderr) => {
    if (saveError) {
      console.warn(`⚠️ Erro ao salvar configuração PM2: ${saveError.message}`);
    } else {
      console.log('💾 Configuração PM2 salva');
    }
  });
});
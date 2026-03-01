/**
 * Sistema de limpeza automática de bloqueios expirados
 * Remove bloqueios temporários que já passaram do tempo limite
 */

import * as fs from 'node:fs';
import path from 'node:path';
import logger from '../../util/logger.ts';
import { syncManager } from '../../../database/sync.ts';

/**
 * Executa limpeza periódica de bloqueios expirados
 */
export async function limparBloqueiosExpirados(__dirname: string): Promise<void> {
  try {
    logger.info('[Limpeza Bloqueios] Iniciando limpeza de bloqueios expirados');

    const ignoredChatIdsFilePath = path.join(__dirname, 'config', 'ignoredChatIds.json');

    if (!fs.existsSync(ignoredChatIdsFilePath)) {
      logger.info('[Limpeza Bloqueios] Arquivo de bloqueios não encontrado, nada para limpar');
      return;
    }

    const ignoredChatIdsContent = fs.readFileSync(ignoredChatIdsFilePath, 'utf-8');
    let ignoredChatIds = JSON.parse(ignoredChatIdsContent);

    if (!Array.isArray(ignoredChatIds)) {
      logger.warn('[Limpeza Bloqueios] Estrutura de bloqueios inválida');
      return;
    }

    const agora = new Date();
    let removidos = 0;

    // Filtra bloqueios, removendo os expirados
    ignoredChatIds = ignoredChatIds.filter((item: any) => {
      // Mantém bloqueios permanentes (sem tempo definido)
      if (typeof item === 'string' || !item.tempoBloqueio) {
        return true;
      }

      // Verifica se bloqueio temporário expirou
      if (item.expiracao) {
        const expiracao = new Date(item.expiracao);

        if (agora > expiracao) {
          logger.info(`[Limpeza Bloqueios] Bloqueio expirado removido: ${item.chatId} (expirou em ${expiracao.toLocaleString('pt-BR')})`);
          removidos++;
          return false; // Remove este item
        }
      }

      return true; // Mantém este item
    });

    if (removidos > 0) {
      // 🔄 SALVAR NO SQLITE (sincronização automática)
      try {
        await syncManager.saveClientData('system', {
          blockedNumbers: ignoredChatIds
        });
        console.log(`[Limpeza Bloqueios] Lista de bloqueios salva no SQLite`);
      } catch (sqliteError) {
        console.error(`[Limpeza Bloqueios] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      fs.writeFileSync(ignoredChatIdsFilePath, JSON.stringify(ignoredChatIds, null, 2), 'utf-8');
      logger.info(`[Limpeza Bloqueios] ${removidos} bloqueios expirados removidos`);
    } else {
      logger.info('[Limpeza Bloqueios] Nenhum bloqueio expirado encontrado');
    }

  } catch (error) {
    logger.error('[Limpeza Bloqueios] Erro durante limpeza:', error);
  }
}

/**
 * Agenda limpeza periódica (recomendado executar a cada hora)
 */
export function agendarLimpezaBloqueios(__dirname: string, intervaloMinutos: number = 60): globalThis.NodeJS.Timeout {
  logger.info(`[Limpeza Bloqueios] Agendamento iniciado - intervalo: ${intervaloMinutos} minutos`);

  return setInterval(() => {
    limparBloqueiosExpirados(__dirname);
  }, intervaloMinutos * 60 * 1000);
}
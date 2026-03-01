import cron from 'node-cron';
import logger from '../util/logger.ts';
import { gerarRelatorioPerformance, gerarAnaliseDiaria, gerarRelatorioFunil } from './geradorRelatorios.ts';
import { SistemaAgendamentos } from '../analiseConversa/sistemaAgendamentos.ts';
import { verificarEEnviarLembretes } from '../analiseConversa/sistemaLembretes.ts';
import fs from 'fs/promises';
import path from 'path';
import { syncManager } from '../../database/sync.ts';

export async function iniciarAgendamentoRelatorios(client: any, clientePath: string) {
    logger.info('Iniciando agendamento de relatórios...');

    const regrasPath = path.join(clientePath, 'config', 'regrasDisparo.json');
    const infoPath = path.join(clientePath, 'config', 'infoCliente.json');

    try {
        const regrasConfig = JSON.parse(await fs.readFile(regrasPath, 'utf-8'));
        const infoConfig = JSON.parse(await fs.readFile(infoPath, 'utf-8'));
        const targetChatId = infoConfig.TARGET_CHAT_ID;

        if (!targetChatId) {
            logger.error('TARGET_CHAT_ID não encontrado. Relatórios não podem ser enviados.');
            return;
        }

        const [hora, minuto] = regrasConfig.HORARIO_FINAL.split(':');
        const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaInicial = diasSemana.indexOf(regrasConfig.DIA_INICIAL);
        const diaFinal = diasSemana.indexOf(regrasConfig.DIA_FINAL);

        // Agendamento Diário
        cron.schedule(`${minuto} ${hora} * * ${diaInicial}-${diaFinal}`, async () => {
            logger.info('Executando agendamento de relatório diário...');
            const relatorioPerformance = await gerarRelatorioPerformance(clientePath, 'diario');
            const analiseDiaria = await gerarAnaliseDiaria(clientePath);
            const relatorioFunil = await gerarRelatorioFunil(clientePath, 'diario');
            await client.sendText(client, clientePath, targetChatId, `${relatorioPerformance}\n\n${relatorioFunil}\n\n${analiseDiaria}`);
        });

        // Agendamento Semanal (toda segunda às 9h)
        cron.schedule('0 9 * * 1', async () => {
            logger.info('Executando agendamento de relatório semanal...');
            const relatorioPerformance = await gerarRelatorioPerformance(clientePath, 'semanal');
            const relatorioFunil = await gerarRelatorioFunil(clientePath, 'semanal');
            await client.sendText(client, clientePath, targetChatId, `${relatorioPerformance}\n\n${relatorioFunil}`);
        });

        // Agendamento Mensal (todo dia 1º às 9h)
        cron.schedule('0 9 1 * *', async () => {
             logger.info('Executando agendamento de relatório mensal...');
             const relatorioPerformance = await gerarRelatorioPerformance(clientePath, 'mensal');
             const relatorioFunil = await gerarRelatorioFunil(clientePath, 'mensal');
             await client.sendText(client, clientePath, targetChatId, `${relatorioPerformance}\n\n${relatorioFunil}`);
         });

         // ===== NOVO: Agendamento Diário de Lembretes (00:01 - independente de dias válidos) =====
         cron.schedule('1 0 * * *', async () => {
             logger.info('🎯 [Lembretes] Executando verificação diária de lembretes...');

             try {
                 // Extrai o ID do cliente do clientePath
                 const clienteId = path.basename(clientePath);

                 // Executa verificação de lembretes
                 await verificarEEnviarLembretes(clientePath, clienteId, client);

                 logger.info('✅ [Lembretes] Verificação diária de lembretes concluída');
             } catch (error) {
                 logger.error('❌ [Lembretes] Erro na verificação diária de lembretes:', error);

                 // Tenta notificar erro para equipe
                 try {
                     if (targetChatId) {
                         await client.sendText(client, clientePath, targetChatId,
                             `⚠️ ERRO no sistema de lembretes diários\nCliente: ${path.basename(clientePath)}\nErro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                     }
                 } catch (notifyError) {
                     logger.error('❌ [Lembretes] Falha ao notificar erro:', notifyError);
                 }
             }
         });

         logger.info('Relatórios e lembretes agendados com sucesso.');

    } catch (error) {
        logger.error('Erro ao configurar o agendamento de relatórios:', error);
    }
}
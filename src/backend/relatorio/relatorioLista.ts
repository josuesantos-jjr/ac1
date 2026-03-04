import path from 'node:path';
import dotenv from 'dotenv';
import fs from 'node:fs'; // Usar fs síncrono aqui pode ser aceitável ou mudar para async

// Tipos (simplificados, ajustar se necessário)
interface Contato {
    nome: string;
    sobrenome?: string;
    telefone: string;
    disparo?: "sim" | "falha_wpp" | "falha_envio" | string; // Adicionar outros status se houver
    data_1_contato?: string;
    [key: string]: any; // Permite outras propriedades
}

interface Lista {
    contatos: Contato[];
    [key: string]: any; // Permite outras propriedades como 'mensagem', 'ativo', etc.
}

// Função para criar e enviar o relatório de uma lista específica
export async function criarEnviarRelatorioLista(client: any, clientePath: string, listaNome: string, lista: Lista) {
    console.log(`📋 Gerando relatório para a lista concluída: ${listaNome}`);

    try {
        // 1. Calcular Estatísticas da Lista
        const totalContatos = lista.contatos?.length || 0;
        let disparosSucesso = 0;
        let disparosFalhaWpp = 0;
        let disparosFalhaEnvio = 0; // Contar outras falhas se necessário

        if (Array.isArray(lista.contatos)) {
            lista.contatos.forEach(contato => {
                if (contato.disparo === "sim") {
                    disparosSucesso++;
                } else if (contato.disparo === "falha_wpp") {
                    disparosFalhaWpp++;
                } else if (contato.disparo) { // Qualquer outro valor em 'disparo' diferente de "sim" ou "falha_wpp"
                    disparosFalhaEnvio++;
                }
            });
        }

    // Carregar targetChatId de infoCliente.json
    const infoPath = path.join(clientePath, 'config', 'infoCliente.json');
    let targetChatId = '';
    try {
        const infoConfig = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
        targetChatId = infoConfig.TARGET_CHAT_ID || '';
        if (targetChatId && !targetChatId.endsWith('@c.us') && !targetChatId.endsWith('@g.us')) {
            if (targetChatId.includes('-')) { targetChatId += '@g.us'; }
            else { targetChatId += '@c.us'; }
        }
    } catch (error) {
        console.error(`Erro ao ler infoCliente.json para TARGET_CHAT_ID: ${error}`);
    }

        if (!targetChatId) {
            console.log(`TARGET_CHAT_ID não configurado para cliente ${path.basename(clientePath)}. Relatório da lista ${listaNome} não será enviado.`);
            return; // Sai se não há para onde enviar
        }

        // 3. Montar Mensagem do Relatório da Lista
        const nomeCliente = path.basename(clientePath);
        let relatorioTexto = `🏁 *Lista Concluída - ${nomeCliente}* 🏁\n\n`;
        relatorioTexto += `Lista: *${listaNome}*\n`;
        relatorioTexto += `Total de Contatos: ${totalContatos}\n`;
        relatorioTexto += `--------------------\n`;
        relatorioTexto += `✅ Sucesso: ${disparosSucesso}\n`;
        if (disparosFalhaWpp > 0) relatorioTexto += `❌ Falha (Sem WPP): ${disparosFalhaWpp}\n`;
        if (disparosFalhaEnvio > 0) relatorioTexto += `⚠️ Falha (Outro Erro): ${disparosFalhaEnvio}\n`;
        relatorioTexto += `--------------------\n`;
        relatorioTexto += `Próxima lista será iniciada (se houver).`;


        // 4. Enviar Relatório
        if (targetChatId) {
            console.log(`📤 Enviando relatório da lista ${listaNome} para ${targetChatId}...`);
            try {
                await client.sendText(targetChatId, relatorioTexto);
                console.log(`✅ Relatório da lista ${listaNome} enviado com sucesso para ${targetChatId}.`);
            } catch (error) {
                console.error(`❌ Erro ao enviar relatório da lista ${listaNome} para ${targetChatId}: ${error}`);
                // Tentar notificar o erro
                try {
                    const errorMessage = `⚠️ *ERRO NO ENVIO DO RELATÓRIO DE LISTA*\n\nCliente: ${nomeCliente}\nLista: ${listaNome}\nErro: ${error instanceof Error ? error.message : String(error)}\n\nO relatório foi salvo localmente mas não foi possível enviar via WhatsApp.`;
                    await client.sendText(targetChatId, errorMessage);
                } catch (notificationError) {
                    console.error(`❌ Erro ao enviar notificação de erro: ${notificationError}`);
                }
            }
        } else {
            console.log(`⚠️ TARGET_CHAT_ID não configurado. Relatório da lista ${listaNome} não enviado via WhatsApp.`);
        }

    } catch (error) {
        console.error(`Erro geral ao gerar relatório para lista ${listaNome}: ${error}`);
    }
}
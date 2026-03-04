import fs from 'fs/promises';
import path from 'path';
import logger from '../util/logger.ts';

// Função para buscar leads de um período específico
async function getLeadsByPeriod(leadsFilePath: string, periodo: 'diario' | 'semanal' | 'mensal'): Promise<any[]> {
    try {
        const data = await fs.readFile(leadsFilePath, 'utf-8');
        const leadsData = JSON.parse(data);
        const allLeads: any[] = [];
        const now = new Date();

        // Lógica para achatar a estrutura de dados e filtrar por período
        // (Esta é uma implementação simplificada, pode ser otimizada)
        Object.keys(leadsData).forEach(year => {
            Object.keys(leadsData[year]).forEach(month => {
                Object.keys(leadsData[year][month]).forEach(day => {
                    allLeads.push(...leadsData[year][month][day]);
                });
            });
        });

        if (periodo === 'diario') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            return allLeads.filter(lead => new Date(lead.timestampIdentificacao).toDateString() === yesterday.toDateString());
        }
        // Lógica para semanal e mensal seria adicionada aqui
        
        return allLeads; // Retorna todos por enquanto

    } catch (error) {
        logger.error(`Erro ao ler ou processar o arquivo de leads: ${leadsFilePath}`, error);
        return [];
    }
}


export async function gerarRelatorioPerformance(clientePath: string, periodo: 'diario' | 'semanal' | 'mensal') {
    logger.info(`Iniciando geração de relatório de performance ${periodo} para ${clientePath}`);
    const leadsFilePath = path.join(clientePath, 'config', 'leads.json');
    
    const leadsDoPeriodo = await getLeadsByPeriod(leadsFilePath, periodo);

    if (leadsDoPeriodo.length === 0) {
        return `Nenhum lead gerado no período (${periodo}).`;
    }

    const totalLeads = leadsDoPeriodo.length;
    const leadsPorOrigem = leadsDoPeriodo.reduce((acc, lead) => {
        const origem = lead.origem || 'Desconhecida';
        acc[origem] = (acc[origem] || 0) + 1;
        return acc;
    }, {});

    let relatorio = `*Relatório de Performance (${periodo})*\n\n`;
    relatorio += `*Total de Leads Gerados:* ${totalLeads}\n\n`;
    relatorio += `*Leads por Origem:*\n`;
    for (const origem in leadsPorOrigem) {
        relatorio += `- ${origem}: ${leadsPorOrigem[origem]}\n`;
    }

    return relatorio;
}

export async function gerarAnaliseDiaria(clientePath: string) {
    logger.info(`Iniciando análise diária para ${clientePath}`);
    let analise = `*Análise Diária*\n\n`;

    // 1. Análise de Saúde do Sistema (Logs)
    try {
        const logPath = path.resolve(clientePath, '../../../logs/error.log'); // Ajuste o caminho conforme necessário
        const logData = await fs.readFile(logPath, 'utf-8');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        const errors = logData.split('\n').filter(line => line.includes(yesterdayString) && line.includes('ERROR'));
        if (errors.length > 5) { // Limiar de exemplo
            analise += `*🚨 Alerta de Saúde do Sistema:*\n- ${errors.length} erros registrados ontem. Recomenda-se verificar os logs.\n\n`;
        } else {
            analise += `*✅ Saúde do Sistema:*\n- Nenhuma anomalia significativa encontrada nos logs.\n\n`;
        }
    } catch (error) {
        logger.warn('Não foi possível analisar o arquivo de log de erros.', error);
        analise += `*⚠️ Saúde do Sistema:*\n- Não foi possível analisar os logs.\n\n`;
    }

    // 2. Análise de Perfil de Cliente (IA)
    try {
        const chatsDir = path.join(clientePath, 'Chats', 'Historico');
        const chatFolders = await fs.readdir(chatsDir);
        let allTags: string[] = [];
        let totalScore = 0;
        let scoreCount = 0;

        for (const folder of chatFolders) {
            const dadosPath = path.join(chatsDir, folder, 'Dados.json');
            try {
                const data = await fs.readFile(dadosPath, 'utf-8');
                const dados = JSON.parse(data);
                if (dados.tags) {
                    allTags.push(...dados.tags);
                }
                if (typeof dados.leadScore === 'number') {
                    totalScore += dados.leadScore;
                    scoreCount++;
                }
            } catch { /* Ignora chats sem Dados.json */ }
        }

        if (allTags.length > 0) {
            const tagCounts = allTags.reduce((acc: { [key: string]: number }, tag) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
            }, {});
            
            const topTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([tag]) => tag);
            const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 'N/A';

            analise += `*📊 Perfil dos Clientes (Ontem):*\n`;
            analise += `- *Temperatura Média:* ${avgScore}/10\n`;
            analise += `- *Principais Interesses:* ${topTags.join(', ')}\n`;
            // A análise de produto mais atrativo pode ser inferida das tags ou de um campo específico
        } else {
            analise += `*📊 Perfil dos Clientes (Ontem):*\n- Não há dados suficientes para gerar uma análise.\n`;
        }

    } catch (error) {
        logger.error('Erro ao gerar análise de perfil de cliente.', error);
        analise += `*⚠️ Perfil dos Clientes (Ontem):*\n- Ocorreu um erro ao analisar os dados dos chats.\n`;
    }

    return analise;
}

export async function gerarRelatorioFunil(clientePath: string, periodo: 'diario' | 'semanal' | 'mensal') {
    logger.info(`Iniciando geração de relatório de funil (${periodo}) para ${clientePath}`);
    let relatorio = `*📊 Análise do Funil de Vendas (${periodo})*\n\n`;
    const funilTotal: { [key: string]: number } = {};
    const funilPeriodo: { [key: string]: number } = {};

    try {
        const chatsDir = path.join(clientePath, 'Chats', 'Historico');
        const chatFolders = await fs.readdir(chatsDir);
        const now = new Date();
        let startDate = new Date();

        if (periodo === 'diario') {
            startDate.setDate(now.getDate() - 1);
        } else if (periodo === 'semanal') {
            startDate.setDate(now.getDate() - 7);
        } else if (periodo === 'mensal') {
            startDate.setMonth(now.getMonth() - 1);
        }

        for (const folder of chatFolders) {
            const dadosPath = path.join(chatsDir, folder, 'Dados.json');
            try {
                const stats = await fs.stat(dadosPath);
                const data = await fs.readFile(dadosPath, 'utf-8');
                const dados = JSON.parse(data);

                if (dados.etapaFunil) {
                    funilTotal[dados.etapaFunil] = (funilTotal[dados.etapaFunil] || 0) + 1;

                    // Verifica se o arquivo foi modificado no período
                    if (stats.mtime >= startDate) {
                        funilPeriodo[dados.etapaFunil] = (funilPeriodo[dados.etapaFunil] || 0) + 1;
                    }
                }
            } catch { /* Ignora chats sem Dados.json ou erros de leitura */ }
        }

        relatorio += `*Visão do Período:*\n`;
        if (Object.keys(funilPeriodo).length > 0) {
            for (const etapa in funilPeriodo) {
                relatorio += `- ${etapa}: ${funilPeriodo[etapa]} contato(s)\n`;
            }
        } else {
            relatorio += `- Nenhum contato movimentado no período.\n`;
        }

        relatorio += `\n*Visão Geral (Total):*\n`;
        if (Object.keys(funilTotal).length > 0) {
            for (const etapa in funilTotal) {
                relatorio += `- ${etapa}: ${funilTotal[etapa]} contato(s)\n`;
            }
        } else {
            relatorio += `- Nenhum contato no funil.\n`;
        }

    } catch (error) {
        logger.error('Erro ao gerar relatório de funil.', error);
        relatorio += `Ocorreu um erro ao gerar a análise do funil.`;
    }

    return relatorio;
}

export function formatarRelatorioParaEnvio(dados: any): string {
    // Lógica para formatar os dados em uma string amigável para WhatsApp
    return JSON.stringify(dados, null, 2);
}
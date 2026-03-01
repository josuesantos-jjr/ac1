#!/usr/bin/env node

/**
 * Script para migrar dados do cliente CMW para SQLite
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function migrateCMW() {
  console.log('🚀 Iniciando migração do cliente CMW...\n');

  try {
    // Conectar ao banco
    const db = new Database('./database.db');

    // Função auxiliar para executar queries preparadas
    const runQuery = (sql, params = []) => {
      try {
        const stmt = db.prepare(sql);
        return stmt.run(params);
      } catch (error) {
        console.error(`Erro na query: ${sql}`, error);
        throw error;
      }
    };

    // 1. Migrar configurações do cliente
    console.log('1️⃣ Migrando configurações do cliente...');
    const infoClientePath = path.join('clientes',  'CMW', 'config', 'infoCliente.json');

    if (fs.existsSync(infoClientePath)) {
      const infoCliente = JSON.parse(fs.readFileSync(infoClientePath, 'utf-8'));

      runQuery(`
        INSERT OR REPLACE INTO clientes (client_id, name, status, folder_type, cliente, ai_selected, target_chat_id, gemini_key, groq_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'CMW',
        infoCliente.name || infoCliente.CLIENTE || 'CMW',
        infoCliente.STATUS || 'Ativo',
        'ativos',
        infoCliente.CLIENTE,
        infoCliente.AI_SELECTED,
        infoCliente.TARGET_CHAT_ID,
        infoCliente.GEMINI_KEY,
        infoCliente.GROQ_KEY
      ]);

      console.log('✅ Cliente CMW criado/atualizado');
    }

    // 2. Migrar contatos
    console.log('2️⃣ Migrando contatos...');
    const contatosPath = path.join('clientes',  'CMW', 'config', 'contatos.json');

    if (fs.existsSync(contatosPath)) {
      const contatos = JSON.parse(fs.readFileSync(contatosPath, 'utf-8'));
      let contatoCount = 0;

      // Verificar se é array ou objeto
      if (Array.isArray(contatos)) {
        // Formato array
        for (const contato of contatos) {
          if (contato.telefone) {
            runQuery(`
              INSERT OR REPLACE INTO contatos (id, client_id, nome, telefone)
              VALUES (?, ?, ?, ?)
            `, [contato.telefone, 'ativos/CMW', contato.nome || 'Não identificado', contato.telefone]);
            contatoCount++;
          }
        }
      } else {
        // Formato objeto (telefone: nome)
        for (const [telefone, nome] of Object.entries(contatos)) {
          runQuery(`
            INSERT OR REPLACE INTO contatos (id, client_id, nome, telefone)
            VALUES (?, ?, ?, ?)
          `, [telefone, 'ativos/CMW', nome, telefone]);
          contatoCount++;
        }
      }

      console.log(`✅ ${contatoCount} contatos migrados`);
    }

    // 3. Migrar leads
    console.log('3️⃣ Migrando leads...');
    const leadsPath = path.join('clientes',  'CMW', 'config', 'leads.json');

    if (fs.existsSync(leadsPath)) {
      const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf-8'));
      let leadCount = 0;

      // Verificar se é array ou objeto
      const leadsArray = Array.isArray(leads) ? leads : Object.values(leads);

      for (const lead of leadsArray) {
        // Para evitar problemas de FK, vamos sempre usar null por enquanto
        // Os relacionamentos serão estabelecidos depois da migração inicial
        let contatoId = null;
        let chatId = null;

        runQuery(`
          INSERT OR REPLACE INTO leads (id, client_id, contato_id, chat_id, nome, telefone, origem, tags, tipo_lead, lead_score, etapa_funil, resumo_para_atendente, timestamp_identificacao, data_geracao_lead, data_notificacao_lead)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          lead.id,
          'ativos/CMW',
          contatoId,
          lead.chatId || lead.chat_id || '',
          lead.nome,
          lead.telefone,
          lead.origem,
          JSON.stringify(lead.tags || []),
          lead.tipoLead || lead.tipo_lead,
          null, // lead_score - será calculado depois
          null, // etapa_funil - será determinado depois
          lead.summary || lead.resumo_para_atendente,
          lead.timestampIdentificacao || lead.timestamp_identificacao,
          lead.dataGeracaoLead || lead.data_geracao_lead,
          lead.dataNotificacaoLead || lead.data_notificacao_lead
        ]);
        leadCount++;
      }

      console.log(`✅ ${leadCount} leads migrados`);
    }

    // 4. Migrar chats e mensagens
    console.log('4️⃣ Migrando chats e mensagens...');
    const historicoPath = path.join('clientes',  'CMW', 'Chats', 'Historico');

    if (fs.existsSync(historicoPath)) {
      const chatFolders = fs.readdirSync(historicoPath).filter(f => fs.statSync(path.join(historicoPath, f)).isDirectory());
      let chatCount = 0;
      let messageCount = 0;

      for (const chatFolder of chatFolders) {
        // Migrar Dados.json
        const dadosPath = path.join(historicoPath, chatFolder, 'Dados.json');
        if (fs.existsSync(dadosPath)) {
          const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));

          runQuery(`
            INSERT OR REPLACE INTO chats (chat_id, client_id, name, telefone, tags, lista_nome, lead, interesse, lead_score, etapa_funil, is_lead_qualificado, detalhes_agendamento, resumo_para_atendente, precisa_atendimento_humano, data_ultima_mensagem_recebida, data_ultima_mensagem_enviada, data_ultima_analise, ultima_notificacao_atendimento_humano)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            chatFolder,
            'ativos/CMW',
            dados.name,
            dados.telefone,
            JSON.stringify(dados.tags || []),
            dados.listaNome,
            dados.lead,
            dados.interesse,
            dados.leadScore,
            dados.etapaFunil,
            dados.isLeadQualificado,
            JSON.stringify(dados.detalhes_agendamento || []),
            dados.resumoParaAtendente,
            dados.precisaAtendimentoHumano,
            dados.data_ultima_mensagem_recebida,
            dados.data_ultima_mensagem_enviada,
            dados.data_ultima_analise,
            dados.ultima_notificacao_atendimento_humano
          ]);
          chatCount++;
        }

        // Migrar mensagens
        const messagesPath = path.join(historicoPath, chatFolder, `${chatFolder}.json`);
        if (fs.existsSync(messagesPath)) {
          const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

          for (const message of messages) {
            runQuery(`
              INSERT OR IGNORE INTO messages (chat_id, client_id, message_type, message_content, message_date, message_time, message_data)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              chatFolder,
              'ativos/CMW',
              message.type,
              message.message,
              message.date,
              message.time,
              JSON.stringify(message)
            ]);
            messageCount++;
          }
        }
      }

      console.log(`✅ ${chatCount} chats e ${messageCount} mensagens migrados`);
    }

    // 5. Verificar dados migrados
    console.log('\n5️⃣ Verificação final:');

    const clienteCount = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE client_id = ?").get('ativos/CMW').count;
    const contatoCount = db.prepare("SELECT COUNT(*) as count FROM contatos WHERE client_id = ?").get('ativos/CMW').count;
    const leadCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE client_id = ?").get('ativos/CMW').count;
    const chatCount = db.prepare("SELECT COUNT(*) as count FROM chats WHERE client_id = ?").get('ativos/CMW').count;
    const messageCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE client_id = ?").get('ativos/CMW').count;

    console.log(`   👤 Cliente: ${clienteCount}`);
    console.log(`   📞 Contatos: ${contatoCount}`);
    console.log(`   🎯 Leads: ${leadCount}`);
    console.log(`   💬 Chats: ${chatCount}`);
    console.log(`   📨 Mensagens: ${messageCount}`);

    // Fechar conexão
    db.close();

    console.log('\n🎉 Migração do cliente CMW concluída com sucesso!');
    console.log('💡 Dados salvos no banco SQLite: ./database.db');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateCMW();
}

module.exports = { migrateCMW };
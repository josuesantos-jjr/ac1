#!/usr/bin/env node

/**
 * Migração simplificada - apenas insere dados básicos primeiro
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function migrateBasic() {
  console.log('🚀 Migração básica do cliente CMW...\n');

  const db = new Database('./dados/crm_data.db');

  // 1. Cliente
  console.log('1️⃣ Inserindo cliente...');
  db.prepare(`
    INSERT OR REPLACE INTO clientes (client_id, name, status, folder_type)
    VALUES (?, ?, ?, ?)
  `).run('CMW', 'CMW', 'ativo', 'ativos');
  console.log('✅ Cliente inserido');

  // 2. Contatos básicos
  console.log('2️⃣ Inserindo contatos básicos...');
  const contatos = [
    { id: '5519989808901', nome: 'Josué', telefone: '5519989808901' },
    { id: '5519994236090', nome: 'Willian', telefone: '5519994236090' },
    { id: '5519993890758', nome: 'Não identificado', telefone: '5519993890758' }
  ];

  for (const contato of contatos) {
    db.prepare(`
      INSERT OR REPLACE INTO contatos (id, client_id, nome, telefone)
      VALUES (?, ?, ?, ?)
    `).run(contato.id, 'CMW', contato.nome, contato.telefone);
  }
  console.log(`✅ ${contatos.length} contatos inseridos`);

  // 3. Chats básicos primeiro
  console.log('3️⃣ Inserindo chats básicos...');
  const chatsBasicos = [
    { id: 'chat1', chat_id: '5519989808901@c.us', telefone: '5519989808901' },
    { id: 'chat2', chat_id: '5519994236090@c.us', telefone: '5519994236090' },
    { id: 'chat3', chat_id: '5519993890758@c.us', telefone: '5519993890758' }
  ];

  for (const chat of chatsBasicos) {
    db.prepare(`
      INSERT OR REPLACE INTO chats (chat_id, client_id, telefone)
      VALUES (?, ?, ?)
    `).run(chat.chat_id, 'CMW', chat.telefone);
  }
  console.log(`✅ ${chatsBasicos.length} chats básicos inseridos`);

  // 4. Agora leads com FK válidas
  console.log('4️⃣ Inserindo leads básicos...');
  const leadsBasicos = [
    { id: 'lead1', nome: 'Josué', telefone: '5519989808901', origem: 'Contato Direto', chat_id: '5519989808901@c.us' },
    { id: 'lead2', nome: 'Willian', telefone: '5519994236090', origem: 'Contato Direto', chat_id: '5519994236090@c.us' },
    { id: 'lead3', nome: 'Não identificado', telefone: '5519993890758', origem: 'Contato Direto', chat_id: '5519993890758@c.us' }
  ];

  for (const lead of leadsBasicos) {
    db.prepare(`
      INSERT OR REPLACE INTO leads (id, client_id, contato_id, chat_id, nome, telefone, origem, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead.id, 'CMW', lead.telefone, lead.chat_id, lead.nome, lead.telefone, lead.origem, '[]');
  }
  console.log(`✅ ${leadsBasicos.length} leads básicos inseridos`);

  // Verificar
  console.log('\n5️⃣ Verificação:');
  const clienteCount = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE client_id = ?").get('CMW').count;
  const contatoCount = db.prepare("SELECT COUNT(*) as count FROM contatos WHERE client_id = ?").get('CMW').count;
  const leadCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE client_id = ?").get('CMW').count;

  console.log(`   👤 Cliente: ${clienteCount}`);
  console.log(`   📞 Contatos: ${contatoCount}`);
  console.log(`   🎯 Leads: ${leadCount}`);

  db.close();

  console.log('\n🎉 Migração básica concluída!');
  console.log('💡 Dados básicos inseridos com sucesso no SQLite');
}

if (require.main === module) {
  migrateBasic().catch(console.error);
}
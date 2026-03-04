#!/usr/bin/env node

/**
 * Script para criar tabelas e migrar dados do cliente CMW
 */

import { getDatabase } from '../../src/database/database';
import { migrationUtils } from '../../src/database/migration';
import { clienteCRUD, contatoCRUD, chatCRUD, leadCRUD, messageCRUD } from '../../src/database/crud';
import { queryManager } from '../../src/database/queries';

async function migrateCMW() {
  console.log('🚀 Iniciando criação das tabelas e migração do cliente CMW...\n');

  try {
    // 1. Criar tabelas (se não existirem)
    console.log('1️⃣ Criando tabelas SQLite...');
    const db = getDatabase();
    console.log('✅ Tabelas criadas com sucesso!\n');

    // 2. Verificar integridade
    console.log('2️⃣ Verificando integridade do banco...');
    const integrity = await db.checkIntegrity();
    console.log(`✅ Integridade: ${integrity ? 'OK' : 'ERRO'}\n`);

    // 3. Migrar dados do cliente CMW
    console.log('3️⃣ Migrando dados do cliente ativos/CMW...');
    await migrationUtils.migrateClient('ativos/CMW');
    console.log('✅ Migração concluída!\n');

    // 4. Verificar dados migrados
    console.log('4️⃣ Verificando dados migrados...');

    const cliente = clienteCRUD.getByClientId('ativos/CMW');
    console.log(`📊 Cliente: ${cliente ? cliente.name : 'Não encontrado'}`);

    const contatos = contatoCRUD.getByClientId('ativos/CMW');
    console.log(`👥 Contatos: ${contatos.length}`);

    const chats = chatCRUD.getByClientId('ativos/CMW');
    console.log(`💬 Chats: ${chats.length}`);

    const leads = leadCRUD.getByClientId('ativos/CMW');
    console.log(`🎯 Leads: ${leads.length}`);

    // 5. Estatísticas finais
    console.log('\n5️⃣ Estatísticas do banco:');
    const stats = await db.getStats();
    console.log(`   📊 Tabelas: ${stats.tableCount}`);
    console.log(`   📈 Registros: ${stats.totalRows}`);
    console.log(`   💾 Tamanho página: ${stats.pageSize} bytes`);
    console.log(`   📄 Páginas: ${stats.pageCount}`);

    // 6. Teste de consultas
    console.log('\n6️⃣ Testando consultas avançadas...');
    const activeClients = await queryManager.getActiveClientsWithStats();
    console.log(`   👥 Clientes ativos: ${activeClients.length}`);

    if (activeClients.length > 0) {
      const cmwStats = activeClients[0];
      console.log(`   📈 CMW - Contatos: ${cmwStats.total_contatos}`);
      console.log(`   🎯 CMW - Leads: ${cmwStats.total_leads}`);
      console.log(`   💬 CMW - Conversas: ${cmwStats.total_chats}`);
      console.log(`   📨 CMW - Mensagens: ${cmwStats.total_mensagens}`);
    }

    const qualifiedLeads = await queryManager.getQualifiedLeadsFullInfo('ativos/CMW');
    console.log(`   ⭐ Leads qualificados: ${qualifiedLeads.length}`);

    console.log('\n🎉 Migração do cliente CMW concluída com sucesso!');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Configure as variáveis de ambiente para sincronização');
    console.log('2. Teste as operações CRUD');
    console.log('3. Faça backup do database.db');
    console.log('4. Configure sincronização automática no PM2');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  migrateCMW().catch(console.error);
}

export { migrateCMW };
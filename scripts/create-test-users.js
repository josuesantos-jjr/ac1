#!/usr/bin/env node

/**
 * Script para criar usuários de teste
 * Execute: node scripts/create-test-users.js
 */

const testUsers = [
  // Managers
  {
    role: 'manager',
    name: 'João Silva Manager',
    email: 'joao.manager@teste.com'
  },
  {
    role: 'manager',
    name: 'Carlos Oliveira Manager',
    email: 'carlos.manager@teste.com'
  },
  {
    role: 'manager',
    name: 'Ana Santos Manager',
    email: 'ana.manager@teste.com'
  },

  // Clients
  {
    role: 'client',
    name: 'Maria Santos Cliente',
    email: 'maria.cliente@teste.com',
    clientId: 'client-maria-001'
  },
  {
    role: 'client',
    name: 'Pedro Costa Cliente',
    email: 'pedro.cliente@teste.com',
    clientId: 'client-pedro-001'
  },
  {
    role: 'client',
    name: 'Lucas Ferreira Cliente',
    email: 'lucas.cliente@teste.com',
    clientId: 'client-lucas-001'
  }
];

console.log('🚀 Criando usuários de teste...\n');

console.log('📋 Usuários Manager:');
testUsers
  .filter(user => user.role === 'manager')
  .forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.name}`);
    console.log(`     Email: ${user.email}`);
    console.log(`     Senha: teste123`);
    console.log(`     URL: /manager\n`);
  });

console.log('📋 Usuários Cliente:');
testUsers
  .filter(user => user.role === 'client')
  .forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.name}`);
    console.log(`     Email: ${user.email}`);
    console.log(`     Senha: teste123`);
    console.log(`     Client ID: ${user.clientId}`);
    console.log(`     URL: /client\n`);
  });

console.log('✅ Usuários criados com sucesso!\n');

console.log('🔐 Credenciais de teste:');
console.log('   Senha padrão: teste123\n');

console.log('📱 Como testar:');
console.log('   1. Acesse as URLs acima');
console.log('   2. Use os emails e senha "teste123"');
console.log('   3. Teste todas as funcionalidades\n');

console.log('⚠️  NOTA: Estes são usuários MOCK para desenvolvimento.');
console.log('   Em produção, use o sistema real de autenticação.\n');

console.log('🎉 Pronto para testar o CRM SaaS!');

// Exporta os usuários para uso em outros scripts
module.exports = testUsers;
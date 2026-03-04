#!/usr/bin/env node

/**
 * Migração completa de todos os clientes JSON para SQLite
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function migrateAllClients() {
  console.log('🚀 Migração completa de todos os clientes...\n');

  const db = new Database('./dados/crm_data.db');

  // Função para encontrar todos os arquivos infoCliente.json
  function findInfoClienteFiles(dir, fileList = []) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && item !== 'node_modules' && !item.startsWith('.')) {
          findInfoClienteFiles(fullPath, fileList);
        } else if (item === 'infoCliente.json') {
          fileList.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Erro ao acessar diretório ${dir}:`, error.message);
    }

    return fileList;
  }

  // Função para determinar categoria baseada no STATUS
  function determineCategory(status) {
    if (!status) return 'ativos';

    const statusLower = status.toLowerCase().trim();

    if (statusLower.includes('cancelado') || statusLower.includes('inativo') ||
        statusLower.includes('desativado') || statusLower.includes('disabled')) {
      return 'cancelados';
    }

    if (statusLower.includes('modelo') || statusLower.includes('template') ||
        statusLower.includes('exemplo') || statusLower.includes('sample')) {
      return 'modelos';
    }

    return 'ativos'; // padrão
  }

  // Buscar todos os arquivos infoCliente.json
  const clientesPath = path.join(process.cwd(), 'clientes');
  const infoClienteFiles = findInfoClienteFiles(clientesPath);

  console.log(`📋 Encontrados ${infoClienteFiles.length} arquivos infoCliente.json`);

  let clientesMigrados = 0;
  let clientesExistentes = 0;

  // Processar cada arquivo
  for (const infoClientePath of infoClienteFiles) {
    try {
      const infoClienteContent = fs.readFileSync(infoClientePath, 'utf-8');
      const infoCliente = JSON.parse(infoClienteContent);

      // Extrair informações do caminho
      const relativePath = path.relative(clientesPath, path.dirname(infoClientePath));
      const pathParts = relativePath.split(path.sep);
      const clienteNome = path.basename(path.dirname(infoClientePath));
      const categoriaAtual = pathParts[0] || 'ativos';
      const categoriaCorreta = determineCategory(infoCliente.STATUS);

      // Criar client_id único
      const clientId = `${categoriaCorreta}/${clienteNome}`;

      console.log(`📦 Processando cliente: ${clienteNome} (${infoCliente.STATUS} → ${categoriaCorreta})`);

      // Verificar se cliente já existe
      const existingClient = db.prepare('SELECT id FROM clientes WHERE client_id = ?').get(clientId);

      if (existingClient) {
        console.log(`  ⏭️  Cliente ${clienteNome} já existe, pulando...`);
        clientesExistentes++;
        continue;
      }

      // Inserir cliente
      db.prepare(`
        INSERT INTO clientes (
          client_id, name, status, folder_type, cliente,
          ai_selected, target_chat_id, gemini_key, groq_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        infoCliente.CLIENTE || clienteNome,
        categoriaCorreta === 'ativos' ? 'ativo' : categoriaCorreta === 'cancelados' ? 'inativo' : 'modelo',
        categoriaCorreta,
        infoCliente.CLIENTE || clienteNome,
        infoCliente.AI_SELECTED || 'GEMINI',
        infoCliente.TARGET_CHAT_ID || '',
        infoCliente.GEMINI_KEY || '',
        infoCliente.GROQ_KEY || ''
      );

      // Inserir configurações do cliente
      db.prepare(`
        INSERT INTO clientes_config (
          client_id, config_type, config_key, config_value
        ) VALUES (?, 'json', 'infoCliente', ?)
      `).run(clientId, JSON.stringify(infoCliente));

      // Tentar migrar contatos se existir
      const contatosPath = path.join(path.dirname(infoClientePath), 'contatos.json');
      if (fs.existsSync(contatosPath)) {
        try {
          const contatosContent = fs.readFileSync(contatosPath, 'utf-8');
          const contatos = JSON.parse(contatosContent);

          if (Array.isArray(contatos)) {
            for (const contato of contatos) {
              if (contato.id && contato.nome) {
                db.prepare(`
                  INSERT OR IGNORE INTO contatos (id, client_id, nome, telefone)
                  VALUES (?, ?, ?, ?)
                `).run(contato.id, clientId, contato.nome, contato.telefone || contato.id);
              }
            }
            console.log(`  📞 Migrados ${contatos.length} contatos`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Erro ao migrar contatos de ${clienteNome}:`, error.message);
        }
      }

      // Tentar migrar leads se existir
      const leadsPath = path.join(path.dirname(infoClientePath), 'leads.json');
      if (fs.existsSync(leadsPath)) {
        try {
          const leadsContent = fs.readFileSync(leadsPath, 'utf-8');
          const leads = JSON.parse(leadsContent);

          if (Array.isArray(leads)) {
            for (const lead of leads) {
              if (lead.id) {
                db.prepare(`
                  INSERT OR IGNORE INTO leads (
                    id, client_id, contato_id, chat_id, nome, telefone,
                    origem, tags, lead_score, etapa_funil, is_lead_qualificado
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  lead.id,
                  clientId,
                  lead.contato_id || lead.telefone || lead.id,
                  lead.chat_id || `${lead.telefone}@c.us`,
                  lead.nome || 'Não identificado',
                  lead.telefone || lead.id,
                  lead.origem || 'Contato Direto',
                  JSON.stringify(lead.tags || []),
                  lead.lead_score || 0,
                  lead.etapa_funil || 'Acolhimento',
                  lead.is_lead_qualificado || false
                );
              }
            }
            console.log(`  🎯 Migrados ${leads.length} leads`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Erro ao migrar leads de ${clienteNome}:`, error.message);
        }
      }

      console.log(`  ✅ Cliente ${clienteNome} migrado com sucesso`);
      clientesMigrados++;

    } catch (error) {
      console.error(`❌ Erro ao processar ${infoClientePath}:`, error);
    }
  }

  // Verificação final
  const totalClientes = db.prepare("SELECT COUNT(*) as count FROM clientes").get().count;
  const clientesAtivos = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE status = 'ativo'").get().count;
  const clientesInativos = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE status = 'inativo'").get().count;
  const clientesModelo = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE status = 'modelo'").get().count;

  console.log('\n📊 RESUMO DA MIGRAÇÃO:');
  console.log(`   📁 Arquivos processados: ${infoClienteFiles.length}`);
  console.log(`   ➕ Novos clientes migrados: ${clientesMigrados}`);
  console.log(`   ⏭️  Clientes já existentes: ${clientesExistentes}`);
  console.log(`   👥 Total no banco: ${totalClientes}`);
  console.log(`   ✅ Ativos: ${clientesAtivos}`);
  console.log(`   ❌ Inativos: ${clientesInativos}`);
  console.log(`   🎭 Modelos: ${clientesModelo}`);

  db.close();

  console.log('\n🎉 Migração completa finalizada!');
  console.log('💡 Todos os clientes JSON foram migrados para o SQLite');
}

if (require.main === module) {
  migrateAllClients().catch(console.error);
}
import { NextResponse } from 'next/server';
import { getPasta } from '@/backend/disparo/disparo';
import fs from 'fs';
import path from 'path';
import { syncManager } from '@/database/sync';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { nomePastaCliente, newClientName } = await request.json() as { nomePastaCliente: string; newClientName: string };

    if (!nomePastaCliente || !newClientName) {
      return NextResponse.json({ error: 'nomePastaCliente e newClientName são obrigatórios' }, { status: 400 });
    }

    // Validar nomes (não permitir caracteres especiais que podem causar problemas)
    if (nomePastaCliente.includes('/') || newClientName.includes('/')) {
      return NextResponse.json({ error: 'Nomes de cliente não podem conter barras (/).' }, { status: 400 });
    }

    // Apenas usa o caminho atual - NÃO renomeia a pasta!
    const clientPath = getPasta(nomePastaCliente);
    const infoClientePath = path.join(clientPath, 'config', 'infoCliente.json');

    console.log(`[API client-operations/rename] Atualizando nome de exibição: ${nomePastaCliente} -> ${newClientName}`);

    // Verificar se o diretório do cliente existe
    if (!fs.existsSync(clientPath)) {
      console.error(`[API client-operations/rename] Diretório do cliente não encontrado: ${clientPath}`);
      return NextResponse.json({ error: `Cliente ${nomePastaCliente} não encontrado.` }, { status: 404 });
    }

    // Verificar se o infoCliente.json existe
    if (!fs.existsSync(infoClientePath)) {
      console.error(`[API client-operations/rename] Arquivo infoCliente.json não encontrado: ${infoClientePath}`);
      return NextResponse.json({ error: `Configuração do cliente ${nomePastaCliente} não encontrada.` }, { status: 404 });
    }

    try {
      // Ler o arquivo infoCliente.json atual
      const infoClienteContent = fs.readFileSync(infoClientePath, 'utf-8');
      const infoClienteData = JSON.parse(infoClienteContent);

      console.log(`[API client-operations/rename] Atualizando CLIENTE de "${infoClienteData.CLIENTE}" para "${newClientName}"`);

      // Atualizar apenas o campo CLIENTE (nome de exibição) - NÃO renomeia a pasta!
      infoClienteData.CLIENTE = newClientName;

      // Garantir que o campo 'id' exista (id fixo = nome da pasta)
      if (!infoClienteData.id) {
        infoClienteData.id = nomePastaCliente;
      }

      // Remover campos antigos se existirem
      delete infoClienteData.codigo;
      delete infoClienteData.name;

      // Salvar o arquivo atualizado
      fs.writeFileSync(infoClientePath, JSON.stringify(infoClienteData, null, 2), 'utf-8');
      console.log(`[API client-operations/rename] ✅ Campo CLIENTE atualizado para: ${newClientName}`);

      // 🔄 SALVAR NO SQLITE (sincronização automática)
      try {
        await syncManager.saveClientData(nomePastaCliente, {
          infoCliente: infoClienteData
        });
        console.log(`[API client-operations/rename] ✅ Cliente renomeado salvo no SQLite`);
      } catch (sqliteError) {
        console.error(`[API client-operations/rename] ❌ Erro ao salvar no SQLite:`, sqliteError);
        // Continua mesmo se SQLite falhar
      }

      console.log(`[API client-operations/rename] ✅ Nome de exibição do cliente ${nomePastaCliente} atualizado para ${newClientName}`);

      return NextResponse.json({
        message: 'Nome de exibição atualizado com sucesso',
        newClientName: newClientName,
        codigo: nomePastaCliente // Retorna o código fixo
      }, { status: 200 });
    } catch (error) {
      console.error('[API client-operations/rename] Erro ao atualizar infoCliente.json:', error);
      return NextResponse.json({ error: 'Erro ao atualizar nome do cliente.' }, { status: 500 });
    }

    // Atualizar o clientId nos arquivos .env (simulação, pois não temos acesso direto ao sistema de arquivos)
    // Implementar a lógica para atualizar os arquivos .env aqui, se possível

  } catch (error) {
    console.error('Erro ao renomear cliente:', error);
    return NextResponse.json({ error: 'Erro ao renomear cliente' }, { status: 500 });
  }
}
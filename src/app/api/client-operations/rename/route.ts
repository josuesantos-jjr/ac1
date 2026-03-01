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

    const clientPath = getPasta(nomePastaCliente);
    const newClientPath = getPasta(newClientName);
    const infoClientePath = path.join(clientPath, 'config', 'infoCliente.json');

    console.log(`[API client-operations/rename] Tentativa de renomear cliente: ${nomePastaCliente} -> ${newClientName}`);
    console.log(`[API client-operations/rename] Caminhos: ${clientPath} -> ${newClientPath}`);

    // Verificar se o diretório do cliente existe
    if (!fs.existsSync(clientPath)) {
      console.error(`[API client-operations/rename] Diretório do cliente não encontrado: ${clientPath}`);
      return NextResponse.json({ error: `Cliente ${nomePastaCliente} não encontrado.` }, { status: 404 });
    }

    // Verificar se o novo nome já existe
    if (fs.existsSync(newClientPath)) {
      console.error(`[API client-operations/rename] Já existe um cliente com o nome ${newClientName}`);
      return NextResponse.json({ error: `Já existe um cliente com o nome "${newClientName}".` }, { status: 400 });
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

      // Atualizar o campo CLIENTE e name
      infoClienteData.CLIENTE = newClientName;
      infoClienteData.name = newClientName;

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

      console.log(`[API client-operations/rename] ✅ Cliente ${nomePastaCliente} renomeado com sucesso para ${newClientName}`);

      return NextResponse.json({
        message: 'Cliente renomeado com sucesso',
        newClientName: newClientName,
        nomePastaCliente: nomePastaCliente
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
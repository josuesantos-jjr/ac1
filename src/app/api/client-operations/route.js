import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function copyFolder(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });

  await fs.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyFolder(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function POST(request) {
  try {
    const { operation, sourceClient, targetType, targetName, oldClientId, newClientName } = await request.json();

    const clientesPath = path.join(process.cwd(), 'clientes');

    let sourceName, sourcePath;
    let sourceType; // Declarar sourceType aqui
    let isOldFormat = false;

    if (sourceClient) {
      // Verificar se é formato antigo ou novo
      if (sourceClient.includes('/')) {
        // Verifica se a pasta existe no caminho antigo
        try {
            await fs.access(path.join(clientesPath, sourceClient));
            isOldFormat = true;
        } catch {
            isOldFormat = false;
        }
      }

      if (isOldFormat) {
        // Formato antigo: "ativos/CMW"
        sourceName = sourceClient;
        sourcePath = path.join(clientesPath, sourceName);
        console.log(`[API client-operations] Usando formato antigo para source: ${sourceClient}`);
      } else {
        // Formato novo: "CMW" - determinar categoria baseado no STATUS
        // Se tiver barra mas não for old format (não existe pasta), limpamos o nome
        sourceName = sourceClient.includes('/') ? sourceClient.split('/').pop() : sourceClient;
        sourcePath = path.join(clientesPath, sourceName); // Caminho direto para novo formato

        try {
          const infoClientePath = path.join(sourcePath, 'config', 'infoCliente.json');
          const infoClienteContent = await fs.readFile(infoClientePath, 'utf-8');
          const infoCliente = JSON.parse(infoClienteContent);

          // Determinar categoria baseado no STATUS
          const status = infoCliente.STATUS || 'ativo';
          sourceType = status === 'ativo' ? 'ativos' : status === 'cancelado' ? 'cancelados' : 'modelos';
          console.log(`[API client-operations] Usando formato novo para source: ${sourceName} (categoria: ${sourceType})`);
        } catch (error) {
          console.error(`[API client-operations] Erro ao determinar categoria para ${sourceName}:`, error);
          // Não retorna erro fatal aqui, pois pode ser apenas falta de arquivo de config, tenta prosseguir
          sourceType = 'ativos';
        }
      }
    }


    switch (operation) {
      case 'copy': {
        if (!sourceClient) {
           return NextResponse.json({ error: 'Dados incompletos para copiar' }, { status: 400 });
        }
        // Store the source path in memory for paste operation
        global.copiedClientPath = sourcePath;
        return NextResponse.json({ success: true, message: 'Cliente copiado' });
      }

      case 'paste': {
        if (!global.copiedClientPath) {
          return NextResponse.json({ error: 'Nenhum cliente copiado' }, { status: 400 });
        }
        if (!targetType || !targetName) {
           return NextResponse.json({ error: 'Dados incompletos para colar' }, { status: 400 });
        }


        // Para formato novo, targetName pode ser apenas o clientId direto
        // Se targetType não for especificado, determinar baseado no STATUS do cliente copiado
        let actualTargetType = targetType;
        let actualTargetName = targetName;

        if (!targetType) {
          // Determinar categoria baseado no STATUS do cliente copiado
          try {
            const sourceInfoPath = path.join(global.copiedClientPath, 'config', 'infoCliente.json');
            const sourceInfoContent = await fs.readFile(sourceInfoPath, 'utf-8');
            const sourceInfo = JSON.parse(sourceInfoContent);
            const status = sourceInfo.STATUS || 'ativo';
            actualTargetType = status === 'ativo' ? 'ativos' : status === 'cancelado' ? 'cancelados' : 'modelos';
            console.log(`[API client-operations] Determinando categoria para paste: ${actualTargetType}`);
          } catch (error) {
            console.error(`[API client-operations] Erro ao determinar categoria para paste:`, error);
            return NextResponse.json({ error: 'Erro ao determinar categoria do cliente' }, { status: 500 });
          }
        }

        // Para formato novo, gerar nome automático C1, C2, C3...
        let targetPath;

        if (targetName && !targetName.includes('/')) {
          // Se targetName foi especificado (não é formato antigo), usar ele
          actualTargetName = targetName;
          targetPath = path.join(clientesPath, actualTargetName);
        } else {
          // Gerar nome automático C1, C2, C3...
          let counter = 1;
          while (true) {
            actualTargetName = `C${counter}`;
            targetPath = path.join(clientesPath, actualTargetName);

            try {
              await fs.access(targetPath);
              counter++;
            } catch {
              // Name is available
              break;
            }
          }
        }

        console.log(`[API client-operations] Paste usando formato novo: ${targetPath}`);

        // Check if target already exists
        try {
          await fs.access(targetPath);
          return NextResponse.json({ error: 'Cliente já existe no destino' }, { status: 400 });
        } catch {
          // Target doesn't exist, we can proceed
          await copyFolder(global.copiedClientPath, targetPath);

          // Atualizar o campo CLIENTE no infoCliente.json da pasta colada
          try {
            const pastedInfoPath = path.join(targetPath, 'config', 'infoCliente.json');
            const pastedInfoContent = await fs.readFile(pastedInfoPath, 'utf-8');
            const pastedInfo = JSON.parse(pastedInfoContent);

            // Atualizar o campo CLIENTE para corresponder ao novo nome da pasta
            pastedInfo.CLIENTE = actualTargetName;
            pastedInfo.codigo = actualTargetName; // código fixo = nome da pasta

            await fs.writeFile(pastedInfoPath, JSON.stringify(pastedInfo, null, 2), 'utf-8');
            console.log(`[API client-operations] Campos CLIENTE e codigo atualizados para: ${actualTargetName} na pasta colada`);

            // Sincronizar com banco
            const { syncManager } = await import('../../../database/sync.ts');
            await syncManager.saveClientData(actualTargetName, { infoCliente: pastedInfo });
          } catch (updateError) {
            console.error(`[API client-operations] Erro ao atualizar CLIENTE na pasta colada:`, updateError);
            // Não retorna erro fatal, pois a operação de paste foi bem-sucedida
          }
        }

        return NextResponse.json({ success: true, message: 'Cliente colado com sucesso' });
      }

      case 'duplicate': {
        if (!sourceClient) {
            return NextResponse.json({ error: 'Dados incompletos para duplicar' }, { status: 400 });
        }

        let targetPath, newClientId;

        // Gerar nome no formato C1, C2, C3...
        let counter = 1;
        let newName;

        // Find the next available C[number]
        while (true) {
          newName = `C${counter}`;
          targetPath = path.join(clientesPath, newName);

          try {
            await fs.access(targetPath);
            counter++;
          } catch {
            // Name is available
            break;
          }
        }

        newClientId = newName;

        await copyFolder(sourcePath, targetPath);

        // Atualizar o campo CLIENTE no infoCliente.json da pasta duplicada
        try {
          const duplicatedInfoPath = path.join(targetPath, 'config', 'infoCliente.json');
          const duplicatedInfoContent = await fs.readFile(duplicatedInfoPath, 'utf-8');
          const duplicatedInfo = JSON.parse(duplicatedInfoContent);

          // Atualizar o campo CLIENTE para corresponder ao novo nome da pasta
          duplicatedInfo.CLIENTE = newClientId;
          duplicatedInfo.codigo = newClientId; // código fixo = nome da pasta

          await fs.writeFile(duplicatedInfoPath, JSON.stringify(duplicatedInfo, null, 2), 'utf-8');
          console.log(`[API client-operations] Campos CLIENTE e codigo atualizados para: ${newClientId} na pasta duplicada`);

          // Sincronizar com banco
          const { syncManager } = await import('../../../database/sync.ts');
          await syncManager.saveClientData(newClientId, { infoCliente: duplicatedInfo });
        } catch (updateError) {
          console.error(`[API client-operations] Erro ao atualizar CLIENTE na pasta duplicada:`, updateError);
          // Não retorna erro fatal, pois a duplicação foi bem-sucedida
        }

        return NextResponse.json({
          success: true,
          message: 'Cliente duplicado',
          newClientId: newClientId
        });
      }

      case 'move': {
        if (!sourceClient || !targetType) {
            return NextResponse.json({ error: 'Dados incompletos para mover' }, { status: 400 });
        }

        let targetPath, newClientId;

        if (isOldFormat) {
          // Formato antigo
          targetPath = path.join(clientesPath, targetType, sourceName);
          newClientId = `${targetType}/${sourceName}`;
        } else {
          // Formato novo: mover para nova categoria (não renomear pasta)
          // O sourceClient é o nome da pasta atual, manter o mesmo nome
          targetPath = path.join(clientesPath, sourceName);
          newClientId = sourceName;
          console.log(`[API client-operations] Move usando formato novo: ${targetPath}`);
        }

        console.log(`[API client-operations] Move operation:`);
        console.log(`  - Source Path: ${sourcePath}`);
        console.log(`  - Target Path: ${targetPath}`);

        // Para formato novo, o "move" na verdade não move a pasta fisicamente
        // Apenas atualiza o STATUS no infoCliente.json
        if (!isOldFormat) {
          try {
            const infoClientePath = path.join(sourcePath, 'config', 'infoCliente.json');
            const infoClienteContent = await fs.readFile(infoClientePath, 'utf-8');
            const infoCliente = JSON.parse(infoClienteContent);

            // Atualizar STATUS baseado no targetType
            if (targetType === 'ativos') {
              infoCliente.STATUS = 'ativo';
            } else if (targetType === 'cancelados') {
              infoCliente.STATUS = 'cancelado';
            } else if (targetType === 'modelos') {
              infoCliente.STATUS = 'modelo';
            } else {
              infoCliente.STATUS = 'ativo'; // fallback
            }

            await fs.writeFile(infoClientePath, JSON.stringify(infoCliente, null, 2), 'utf-8');
            console.log(`[API client-operations] STATUS atualizado para: ${infoCliente.STATUS}`);

            // Sincronizar com banco
            const { syncManager } = await import('../../../database/sync.ts');
            await syncManager.saveClientData(sourceName, { infoCliente });

          } catch (error) {
            console.error(`[API client-operations] Erro ao atualizar STATUS:`, error);
            return NextResponse.json({ error: 'Erro ao atualizar status do cliente' }, { status: 500 });
          }
        } else {
          // Formato antigo: mover fisicamente
          try {
            await fs.access(targetPath);
            console.log(`[API client-operations] Target path already exists. Returning 400.`);
            return NextResponse.json({ error: 'Cliente já existe no destino' }, { status: 400 });
          } catch {
            // Target doesn't exist, we can proceed
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            console.log(`[API client-operations] Target path does not exist. Proceeding with rename.`);
            await fs.rename(sourcePath, targetPath);
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Cliente movido com sucesso',
          newClientId: newClientId
        });
      }

      case 'rename': {
        if (!oldClientId || !newClientName) {
          return NextResponse.json({ error: 'Dados incompletos para renomear' }, { status: 400 });
        }

        let oldPath, newPath, newClientId;

        if (oldClientId.includes('/')) {
          // Formato antigo
          const [oldClientType, oldClientName] = oldClientId.split('/');

          // Check if the new name is the same as the old name
          if (oldClientName === newClientName) {
            console.log(`[API client-operations] Rename operation: New name is the same as the old name. No action needed.`);
            return NextResponse.json({
              success: true,
              message: 'Nome do cliente não alterado',
              newClientId: oldClientId
            });
          }

          oldPath = path.join(clientesPath, oldClientType, oldClientName);
          newPath = path.join(clientesPath, oldClientType, newClientName);
          newClientId = `${oldClientType}/${newClientName}`;
        } else {
          // Formato novo: renomear pasta diretamente
          if (oldClientId === newClientName) {
            console.log(`[API client-operations] Rename operation: New name is the same as the old name. No action needed.`);
            return NextResponse.json({
              success: true,
              message: 'Nome do cliente não alterado',
              newClientId: oldClientId
            });
          }

          oldPath = path.join(clientesPath, oldClientId);
          newPath = path.join(clientesPath, newClientName);
          newClientId = newClientName;
          console.log(`[API client-operations] Rename usando formato novo: ${oldPath} -> ${newPath}`);
        }

        console.log(`[API client-operations] Rename operation:`);
        console.log(`  - Old Path: ${oldPath}`);
        console.log(`  - New Path: ${newPath}`);
        console.log(`  - Cliente: ${oldClientId} -> ${newClientId}`);

        // Check if the old client directory exists
        try {
            await fs.access(oldPath);
        } catch (error) {
            console.error(`[API client-operations] Old client path not found: ${oldPath}`, error);
            return NextResponse.json({ error: 'Cliente antigo não encontrado para renomear' }, { status: 404 });
        }

        // Check if the new client directory already exists
        try {
          await fs.access(newPath);
          console.log(`[API client-operations] New client path already exists: ${newPath}. Returning 400.`);
          return NextResponse.json({ error: `Já existe um cliente com o nome "${newClientName}"` }, { status: 400 });
        } catch {
          // New name is available, proceed with rename
          console.log(`[API client-operations] New client path does not exist. Proceeding with rename.`);
          try {
            await fs.rename(oldPath, newPath);
            console.log(`[API client-operations] ✅ Cliente renomeado com sucesso: ${oldClientId} -> ${newClientId}`);
          } catch (renameError) {
            console.error(`[API client-operations] ❌ Erro ao renomear pasta: ${renameError.message}`);
            return NextResponse.json({
              error: `Erro ao renomear pasta: ${renameError.message}`
            }, { status: 500 });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Cliente renomeado com sucesso',
          newClientId: newClientId
        });
      }

      default:
        return NextResponse.json({ error: 'Operação inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in client operations:', error);
    // Retorna uma mensagem de erro mais genérica para o frontend
    return NextResponse.json({
      error: 'Erro ao renomear cliente. Por favor, tente novamente.'
    }, { status: 500 }); // Retorna 500 para erros internos não tratados
  }
}
import { NextResponse } from 'next/server';
import pm2 from 'pm2'; // Importa a biblioteca PM2

// Helper function to connect to PM2
function connectPm2() {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        console.error('[API /api/stop-client] Error connecting to PM2:', err);
        return reject(err);
      }
      resolve();
    });
  });
}

// Helper function to disconnect from PM2
function disconnectPm2() {
  pm2.disconnect();
}

export async function POST(request) {
  let processName; // Define processName no escopo mais amplo
  try {
    const { clientId } = await request.json();
    // Extrai o nome do processo do clientId (ex: 'Alpha' de 'clientes/ativos/Alpha')
    processName = clientId;

    if (!processName) {
      return NextResponse.json(
        { error: 'Invalid clientId format' },
        { status: 400 }
      );
    }

    console.log(
      `[API /api/stop-client] Attempting to stop process: ${processName}`
    );

    await connectPm2(); // Conecta ao daemon PM2

    // Usa pm2.stop() com tratamento mais robusto de erros
    try {
      await new Promise((resolve, reject) => {
        pm2.stop(processName, (err, proc) => {
          if (err) {
            // Trata erros comuns como 'process name not found' ou 'script not found'
            if (err.message &&
                (err.message.toLowerCase().includes('not found') ||
                 err.message.toLowerCase().includes('not running'))) {
              console.warn(
                `[API /api/stop-client] Process ${processName} not found in PM2 or not running.`
              );
              // Considera sucesso se o processo já não existe ou já está parado
              return resolve();
            }
            // Trata outros erros com mais detalhes
            console.error(
              `[API /api/stop-client] Error stopping process ${processName} via PM2 API:`,
              err
            );
            return reject(err);
          }
          console.log(
            `[API /api/stop-client] Process ${processName} stopped successfully via PM2 API.`
          );
          resolve(proc);
        });
      });
    } catch (stopError) {
      // Adicionar log detalhado do erro
      console.error(`[API /api/stop-client] Exception during stop operation:`, stopError);
      
      // Se for um erro relacionado ao processo não existir, ainda assim retornamos sucesso
      if (stopError.message &&
          (stopError.message.toLowerCase().includes('not found') ||
           stopError.message.toLowerCase().includes('not running'))) {
        console.log(`[API /api/stop-client] Assuming success as process ${processName} is not running.`);
        // Não vamos rejeitar, vamos considerar como sucesso
      } else {
        throw stopError; // Rejeitar se for outro tipo de erro
      }
    }

    disconnectPm2(); // Desconecta após a operação

    return NextResponse.json({ success: true });
  } catch (error) {
    disconnectPm2(); // Garante a desconexão em caso de erro
    console.error(
      `[API /api/stop-client] General Error stopping ${processName || 'unknown client'}:`,
      error
    );
    return NextResponse.json(
      {
        error: `Failed to stop client ${processName || 'unknown'}`,
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

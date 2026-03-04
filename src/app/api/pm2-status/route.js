import { NextResponse } from 'next/server';
import pm2 from 'pm2';

// Promisify
const pm2Connect = () => new Promise((resolve, reject) => {
    pm2.connect((err) => {
        if (err) return reject(err);
        resolve();
    });
});

const pm2List = () => new Promise((resolve, reject) => {
    pm2.list((err, list) => {
        if (err) return reject(err);
        resolve(list);
    });
});

export async function GET(request) {
  try {
    // Pega o clientId da query string se quiser filtrar (opcional)
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    await pm2Connect();
    const list = await pm2List();
    
    // Filtra se um clientId foi passado, senão retorna todos
    const filteredList = clientId ? list.filter(p => p.name === clientId) : list;

    const formattedProcesses = filteredList.map(process => ({
      name: process.name,
      pm_id: process.pm_id,
      status: process.pm2_env?.status || 'unknown',
      cpu: process.monit?.cpu || 0,
      memory: process.monit?.memory || 0,
      uptime: process.pm2_env?.pm_uptime ? Date.now() - process.pm2_env.pm_uptime : 0,
      script: process.pm2_env?.pm_exec_path || 'N/A'
    }));

    pm2.disconnect();
    
    // Se pediu um cliente específico e não achou, retorna status 'not_found' simulado
    if (clientId && formattedProcesses.length === 0) {
        return NextResponse.json({ status: 'not_found' }); 
    }

    return NextResponse.json(formattedProcesses);
  } catch (error) {
    console.error('[API /api/pm2-status] Error:', error);
    try { pm2.disconnect(); } catch (e) {}
    return NextResponse.json([]);
  }
}
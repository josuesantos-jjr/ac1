import { NextRequest, NextResponse } from 'next/server';
import os from 'node:os';
import fs from 'node:fs';

/**
 * API para monitoramento de recursos do sistema
 * GET /api/system-monitor
 */
export async function GET(request: NextRequest) {
  try {
    const systemInfo = await getSystemMetrics();
    return NextResponse.json(systemInfo);
  } catch (erro) {
    console.error('Erro ao coletar métricas do sistema:', erro);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: erro instanceof Error ? erro.message : String(erro)
    }, { status: 500 });
  }
}

/**
 * Coleta métricas completas do sistema
 */
async function getSystemMetrics() {
  // Coleta métricas básicas do sistema
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

  const cpus = os.cpus();
  const cpuUsage = calculateCpuUsage(cpus);

  // Informações de disco
  const diskUsage = getDiskUsage();

  // Informações de rede
  const networkInterfaces = os.networkInterfaces();
  const networkInfo = getNetworkInfo(networkInterfaces);

  // Uptime do sistema
  const uptime = os.uptime();

  // Load average (se disponível)
  const loadAverage = os.loadavg();

  return {
    // CPU
    cpu: {
      cores: cpus.length,
      usage: cpuUsage,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0
    },

    // Memória
    memory: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024),   // MB
      free: Math.round(freeMemory / 1024 / 1024),   // MB
      usagePercent: memoryUsagePercent
    },

    // Disco
    disk: diskUsage,

    // Rede
    network: networkInfo,

    // Sistema
    system: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: Math.round(uptime),
      uptimeFormatted: formatUptime(uptime),
      loadAverage: {
        '1min': Math.round(loadAverage[0] * 100) / 100,
        '5min': Math.round(loadAverage[1] * 100) / 100,
        '15min': Math.round(loadAverage[2] * 100) / 100
      }
    },

    // Timestamp da coleta
    timestamp: new Date().toISOString()
  };
}

/**
 * Calcula uso de CPU baseado nas informações dos cores
 */
function calculateCpuUsage(cpus: os.CpuInfo[]): number {
  try {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      const times = cpu.times;
      const idle = times.idle || 0;
      const total = Object.values(times).reduce((acc: number, time: number) => acc + time, 0);

      totalIdle += idle;
      totalTick += total;
    });

    const idlePercent = (totalIdle / totalTick) * 100;
    return Math.round((100 - idlePercent) * 100) / 100; // Uma casa decimal
  } catch (erro) {
    console.error('Erro ao calcular uso de CPU:', erro);
    return 0;
  }
}

/**
 * Obtém informações de uso de disco
 */
function getDiskUsage(): any {
  try {
    // Para Linux (servidor de produção)
    if (os.platform() === 'linux') {
      try {
        const stats = fs.statSync('/');
        return {
          total: Math.round(stats.size / 1024 / 1024 / 1024), // GB
          available: 'N/A - Requer df command',
          usedPercent: 'N/A - Requer df command',
          mountPoint: '/'
        };
      } catch (erro) {
        return {
          total: 'N/A',
          available: 'N/A',
          usedPercent: 'N/A',
          mountPoint: '/',
          error: 'Não foi possível obter informações de disco'
        };
      }
    }

    // Para Windows (desenvolvimento)
    const totalMemoryGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
    return {
      total: `${totalMemoryGB} GB (baseado na RAM)`,
      available: 'N/A',
      usedPercent: 'N/A',
      mountPoint: 'C:',
      note: 'Informações limitadas em ambiente Windows'
    };

  } catch (erro) {
    console.error('Erro ao obter uso de disco:', erro);
    return {
      total: 'Erro',
      available: 'Erro',
      usedPercent: 'Erro',
      error: erro instanceof Error ? erro.message : String(erro)
    };
  }
}

/**
 * Obtém informações de rede
 */
function getNetworkInfo(networkInterfaces: Record<string, os.NetworkInterfaceInfo[] | undefined>): any {
  try {
    const interfaces = [];

    for (const [name, infos] of Object.entries(networkInterfaces)) {
      if (infos) {
        for (const info of infos) {
          if (info.family === 'IPv4' && !info.internal) {
            interfaces.push({
              name,
              address: info.address,
              netmask: info.netmask,
              mac: info.mac,
              type: name.toLowerCase().includes('wifi') ? 'WiFi' :
                    name.toLowerCase().includes('eth') ? 'Ethernet' : 'Unknown'
            });
          }
        }
      }
    }

    return {
      interfaces,
      primaryInterface: interfaces[0] || null
    };
  } catch (erro) {
    console.error('Erro ao obter informações de rede:', erro);
    return {
      interfaces: [],
      error: erro instanceof Error ? erro.message : String(erro)
    };
  }
}

/**
 * Formata uptime em string legível
 */
function formatUptime(uptimeSeconds: number): string {
  try {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  } catch (erro) {
    return `${Math.round(uptimeSeconds)}s`;
  }
}
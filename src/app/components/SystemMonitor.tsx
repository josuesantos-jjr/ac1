'use client';

import { useState, useEffect } from 'react';

interface SystemMetrics {
  cpu: {
    cores: number;
    usage: number;
    model: string;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: any;
  network: any;
  system: {
    platform: string;
    hostname: string;
    uptime: number;
    uptimeFormatted: string;
    loadAverage: {
      '1min': number;
      '5min': number;
      '15min': number;
    };
  };
  timestamp: string;
}

/**
 * Componente para monitoramento de recursos do sistema
 */
export default function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Busca métricas do sistema
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/system-monitor');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      }
    } catch (erro) {
      console.error('Erro ao buscar métricas do sistema:', erro);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  // Determina cor baseada no uso
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 bg-red-100';
    if (percent >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Ícone baseado no tipo de métrica
  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'cpu': return '🖥️';
      case 'memory': return '🧠';
      case 'disk': return '💾';
      case 'network': return '🌐';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <span className="text-2xl">❌</span>
          <p className="mt-2">Erro ao carregar métricas do sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          📊 Monitoramento do Sistema
        </h3>
        <span className="text-sm text-gray-500">
          Última atualização: {lastUpdate}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* CPU */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">CPU</span>
            <span className="text-lg">{getMetricIcon('cpu')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso:</span>
              <span className={`font-semibold ${getUsageColor(metrics.cpu.usage)}`}>
                {metrics.cpu.usage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.cpu.usage >= 90 ? 'bg-red-500' :
                  metrics.cpu.usage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${metrics.cpu.usage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {metrics.cpu.cores} cores • {metrics.cpu.speed}MHz
            </div>
          </div>
        </div>

        {/* Memória */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Memória</span>
            <span className="text-lg">{getMetricIcon('memory')}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso:</span>
              <span className={`font-semibold ${getUsageColor(metrics.memory.usagePercent)}`}>
                {metrics.memory.usagePercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.memory.usagePercent >= 90 ? 'bg-red-500' :
                  metrics.memory.usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${metrics.memory.usagePercent}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {metrics.memory.used}MB / {metrics.memory.total}MB
            </div>
          </div>
        </div>

        {/* Load Average */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Load Avg</span>
            <span className="text-lg">⚡</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>1min:</span>
              <span className={`font-medium ${
                metrics.system.loadAverage['1min'] > 2 ? 'text-red-600' :
                metrics.system.loadAverage['1min'] > 1 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {metrics.system.loadAverage['1min']}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>5min:</span>
              <span className={`font-medium ${
                metrics.system.loadAverage['5min'] > 2 ? 'text-red-600' :
                metrics.system.loadAverage['5min'] > 1 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {metrics.system.loadAverage['5min']}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>15min:</span>
              <span className={`font-medium ${
                metrics.system.loadAverage['15min'] > 2 ? 'text-red-600' :
                metrics.system.loadAverage['15min'] > 1 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {metrics.system.loadAverage['15min']}
              </span>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Sistema</span>
            <span className="text-lg">{getMetricIcon('system')}</span>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              {metrics.system.platform}
            </div>
            <div className="text-xs text-gray-500">
              Host: {metrics.system.hostname}
            </div>
            <div className="text-xs text-gray-500">
              Uptime: {metrics.system.uptimeFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disco */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <span className="mr-2">{getMetricIcon('disk')}</span>
            Armazenamento
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total:</span>
              <span>{metrics.disk.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Disponível:</span>
              <span>{metrics.disk.available}</span>
            </div>
            <div className="flex justify-between">
              <span>Uso:</span>
              <span className={metrics.disk.usedPercent && metrics.disk.usedPercent !== 'N/A' ?
                getUsageColor(parseInt(metrics.disk.usedPercent)) : 'text-gray-600'}>
                {metrics.disk.usedPercent}
              </span>
            </div>
          </div>
        </div>

        {/* Rede */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <span className="mr-2">{getMetricIcon('network')}</span>
            Rede
          </h4>
          <div className="space-y-1 text-sm">
            {metrics.network.primaryInterface ? (
              <>
                <div className="flex justify-between">
                  <span>Interface:</span>
                  <span>{metrics.network.primaryInterface.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>IP:</span>
                  <span className="font-mono text-xs">{metrics.network.primaryInterface.address}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span>{metrics.network.primaryInterface.type}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-500">Nenhuma interface de rede encontrada</div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de recursos críticos */}
      <div className="mt-4 space-y-2">
        {metrics.cpu.usage >= 90 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-800">
              <span className="mr-2">🚨</span>
              <span className="font-medium">CPU em uso crítico: {metrics.cpu.usage}%</span>
            </div>
          </div>
        )}

        {metrics.memory.usagePercent >= 90 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-800">
              <span className="mr-2">🚨</span>
              <span className="font-medium">Memória em uso crítico: {metrics.memory.usagePercent}%</span>
            </div>
          </div>
        )}

        {metrics.system.loadAverage['1min'] > 2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800">
              <span className="mr-2">⚠️</span>
              <span className="font-medium">Load average alto: {metrics.system.loadAverage['1min']}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';

export default function SystemMonitor() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/system-monitor');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (erro) {
        console.error('Erro ao buscar métricas:', erro);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Recursos do Sistema</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Recursos do Sistema</h3>
      {metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">CPU</div>
            <div className="text-xl font-bold text-blue-600">{metrics.cpu.usage}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Memória</div>
            <div className="text-xl font-bold text-green-600">{metrics.memory.usagePercent}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Load Avg</div>
            <div className="text-xl font-bold text-orange-600">{metrics.system.loadAverage['1min']}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="text-xl font-bold text-purple-600">{metrics.system.uptimeFormatted}</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p>Não foi possível carregar métricas</p>
        </div>
      )}
    </div>
  );
}
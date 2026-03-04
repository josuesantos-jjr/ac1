import { useState, useEffect } from 'react';

export default function WhatsappStatus() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp-status');
        if (response.ok) {
          const data = await response.json();
          setStatusData(data);
        }
      } catch (erro) {
        console.error('Erro ao buscar status WhatsApp:', erro);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // 60 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 Conexões WhatsApp</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📱 Conexões WhatsApp</h3>

      {statusData ? (
        <>
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{statusData.conexoesAtivas}</div>
              <div className="text-sm text-gray-600">Conectados</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{statusData.conexoesInativas}</div>
              <div className="text-sm text-gray-600">Desconectados</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{statusData.totalClientes}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="space-y-3">
            {statusData.clientes.map((cliente, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{cliente.nome}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    cliente.whatsapp.connected ? 'bg-green-100 text-green-800' :
                    cliente.whatsapp.hasQrCode ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cliente.whatsapp.connected ? 'Conectado' :
                     cliente.whatsapp.hasQrCode ? 'QR Pendente' : 'Desconectado'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Cliente: {cliente.configInfo ? cliente.configInfo.cliente : 'N/A'} | Status: {cliente.whatsapp.statusSession}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📱</div>
          <p>Não foi possível carregar status do WhatsApp</p>
        </div>
      )}
    </div>
  );
}
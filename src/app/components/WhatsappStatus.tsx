'use client';

import { useState, useEffect } from 'react';

interface WhatsappStatusData {
  clientes: Array<{
    nome: string;
    whatsapp: {
      connected: boolean;
      status: string;
      statusSession: string;
      lastActivity: string | null;
      hasSession: boolean;
      hasQrCode: boolean;
    };
    qrCode: any;
    sessionInfo: any;
    configInfo: {
      cliente: string;
      status: string;
      targetChatId: string;
      bkChatId: string;
    };
    error?: string;
  }>;
  totalClientes: number;
  conexoesAtivas: number;
  conexoesInativas: number;
  estatisticas: {
    percentualConectado: number;
  };
  timestamp: string;
}

/**
 * Componente para monitoramento de conexões WhatsApp
 */
export default function WhatsappStatus() {
  const [statusData, setStatusData] = useState<WhatsappStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca status do WhatsApp
  const fetchWhatsappStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-status');
      if (response.ok) {
        const data = await response.json();
        setStatusData(data);
      }
    } catch (erro) {
      console.error('Erro ao buscar status do WhatsApp:', erro);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsappStatus();
    const interval = setInterval(fetchWhatsappStatus, 15000); // Atualiza a cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  // Determina cor baseada no status da conexão
  const getConnectionColor = (cliente: any) => {
    if (cliente.error) return 'text-red-600 bg-red-100';
    if (cliente.whatsapp.connected) return 'text-green-600 bg-green-100';
    if (cliente.whatsapp.hasQrCode) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Ícone baseado no status
  const getConnectionIcon = (cliente: any) => {
    if (cliente.error) return '❌';
    if (cliente.whatsapp.connected) return '✅';
    if (cliente.whatsapp.hasQrCode) return '📱';
    return '⏸️';
  };

  // Status em português
  const getStatusText = (cliente: any) => {
    if (cliente.error) return 'Erro';
    if (cliente.whatsapp.connected) return 'Conectado';
    if (cliente.whatsapp.hasQrCode) return 'QR Pendente';
    return 'Desconectado';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <span className="text-2xl">❌</span>
          <p className="mt-2">Erro ao carregar status do WhatsApp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          📱 Status das Conexões WhatsApp
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statusData.conexoesAtivas}</div>
            <div className="text-xs text-gray-500">Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statusData.conexoesInativas}</div>
            <div className="text-xs text-gray-500">Inativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statusData.totalClientes}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Taxa de Conexão</div>
          <div className={`text-xl font-bold ${
            statusData.estatisticas.percentualConectado >= 80 ? 'text-green-600' :
            statusData.estatisticas.percentualConectado >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {statusData.estatisticas.percentualConectado}%
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Última Verificação</div>
          <div className="text-sm font-medium text-gray-800">
            {new Date(statusData.timestamp).toLocaleTimeString('pt-BR')}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Status Geral</div>
          <div className={`text-sm font-medium ${
            statusData.conexoesAtivas === statusData.totalClientes ? 'text-green-600' :
            statusData.conexoesAtivas > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {statusData.conexoesAtivas === statusData.totalClientes ? 'Todos Conectados' :
             statusData.conexoesAtivas > 0 ? 'Parcialmente OK' : 'Todos Desconectados'}
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {statusData.clientes.map((cliente, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getConnectionColor(cliente)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getConnectionIcon(cliente)}</span>
                <h4 className="font-medium text-gray-800">{cliente.nome}</h4>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cliente.whatsapp.connected ? 'bg-green-100 text-green-800' :
                cliente.whatsapp.hasQrCode ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getStatusText(cliente)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Cliente: {cliente.configInfo?.cliente || 'N/A'}</div>
                <div className="text-gray-600">Status Session: {cliente.whatsapp.statusSession}</div>
                {cliente.whatsapp.lastActivity && (
                  <div className="text-gray-600">
                    Última Atividade: {new Date(cliente.whatsapp.lastActivity).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>

              <div>
                <div className="text-gray-600">Target Chat: {cliente.configInfo?.targetChatId || 'N/A'}</div>
                <div className="text-gray-600">Backup Chat: {cliente.configInfo?.bkChatId || 'N/A'}</div>
                <div className="text-gray-600">
                  Sessão: {cliente.whatsapp.hasSession ? '✅ Ativa' : '❌ Inativa'}
                </div>
              </div>
            </div>

            {/* QR Code pendente */}
            {cliente.whatsapp.hasQrCode && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-yellow-800 text-sm">
                  <span className="mr-1">📱</span>
                  <strong>QR Code pendente</strong> - Cliente precisa escanear o código QR para conectar
                </div>
              </div>
            )}

            {/* Erro */}
            {cliente.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-red-800 text-sm">
                  <span className="mr-1">❌</span>
                  <strong>Erro:</strong> {cliente.error}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {statusData.clientes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">📱</span>
          <p>Nenhum cliente WhatsApp encontrado</p>
          <p className="text-sm">Verifique se há clientes ativos configurados</p>
        </div>
      )}

      {/* Alertas */}
      <div className="mt-4 space-y-2">
        {statusData.conexoesInativas > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800">
              <span className="mr-2">⚠️</span>
              <span className="font-medium">
                {statusData.conexoesInativas} conexão(ões) inativa(s) detectada(s)
              </span>
            </div>
          </div>
        )}

        {statusData.estatisticas.percentualConectado < 50 && statusData.totalClientes > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center text-red-800">
              <span className="mr-2">🚨</span>
              <span className="font-medium">
                Apenas {statusData.estatisticas.percentualConectado}% das conexões estão ativas
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
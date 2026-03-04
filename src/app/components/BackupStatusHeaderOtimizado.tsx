'use client';

import { useState, useEffect } from 'react';

interface BackupHistory {
  status: 'success' | 'warning' | 'error' | 'never_executed' | 'unknown';
  message: string;
  historico: Array<{
    backupId: string;
    dataExecucao: string;
    tipo: string;
    metricas: {
      pastaClientesMB: number;
      backupCompactadoMB: number;
      taxaCompressao: string;
      totalClientes: number;
      totalConversas: number;
      diretoriosProcessados: number;
    };
    whatsapp: {
      enviado: boolean;
      chatId: string;
      dataEnvio: string;
      tamanhoEnviadoMB: number;
      status: string;
    };
    sistema: {
      duracaoSegundos: number;
      cpuUsoPercent: number;
      memoriaUsadaMB: number;
      status: string;
    };
  }>;
  ultimoBackup: any;
  ultimoBackupHoje: boolean;
  estatisticas: {
    totalBackups: number;
    backupsSucesso: number;
    backupsFalha: number;
    taxaSucesso: number;
    tamanhoMedioMB: number;
    periodo: {
      primeiro: string;
      ultimo: string;
    };
  } | null;
}

/**
 * Componente otimizado para mostrar status do backup no cabeçalho
 */
export default function BackupStatusHeaderOtimizado() {
  const [backupHistory, setBackupHistory] = useState<BackupHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  // Busca histórico de backup (otimizado)
  const fetchBackupHistory = async () => {
    try {
      const response = await fetch('/api/backup-history');
      if (response.ok) {
        const data = await response.json();
        setBackupHistory(data);
      }
    } catch (erro) {
      console.error('Erro ao buscar histórico de backup:', erro);
    } finally {
      setLoading(false);
    }
  };

  // Executa backup forçado
  const executeBackup = async () => {
    if (executing) return;

    setExecuting(true);
    try {
      const response = await fetch('/api/backup-history', {
        method: 'POST'
      });

      if (response.ok) {
        // Atualiza histórico após execução
        await fetchBackupHistory();
      } else {
        console.error('Erro ao executar backup');
      }
    } catch (erro) {
      console.error('Erro ao executar backup:', erro);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchBackupHistory();

    // Atualiza apenas uma vez por minuto (muito otimizado)
    const interval = setInterval(fetchBackupHistory, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
        Carregando...
      </div>
    );
  }

  if (!backupHistory) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600">
        ❌ Erro ao carregar
      </div>
    );
  }

  // Determina cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'never_executed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // Ícone baseado no status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'never_executed':
        return '⏳';
      default:
        return '📦';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Indicador de Status */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(backupHistory.status)}`}>
        <span className="mr-1">{getStatusIcon(backupHistory.status)}</span>
        <span className="hidden sm:inline">
          {backupHistory.ultimoBackupHoje ? 'Backup OK' : 'Backup Pendente'}
        </span>
      </div>

      {/* Botão de Controle */}
      <button
        onClick={executeBackup}
        disabled={executing}
        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Forçar execução de backup"
      >
        {executing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Executando...
          </>
        ) : (
          <>
            <span className="mr-1">🔄</span>
            <span className="hidden sm:inline">Backup</span>
          </>
        )}
      </button>

      {/* Tooltip com informações detalhadas */}
      <div className="group relative">
        <span className="cursor-help text-gray-400 hover:text-gray-600">ℹ️</span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          <div><strong>Status:</strong> {backupHistory.message}</div>
          {backupHistory.ultimoBackup && (
            <div><strong>Último backup:</strong> {new Date(backupHistory.ultimoBackup.dataExecucao).toLocaleString('pt-BR')}</div>
          )}
          {backupHistory.ultimoBackup?.metricas && (
            <div><strong>Tamanho:</strong> {backupHistory.ultimoBackup.metricas.backupCompactadoMB}MB</div>
          )}
          {backupHistory.estatisticas && (
            <div><strong>Total backups:</strong> {backupHistory.estatisticas.totalBackups}</div>
          )}
          <div className="text-gray-300 text-xs mt-1">
            Taxa de sucesso: {backupHistory.estatisticas?.taxaSucesso || 0}%
          </div>
        </div>
      </div>
    </div>
  );
}
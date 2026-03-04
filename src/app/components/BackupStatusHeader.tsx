'use client';

import { useState, useEffect } from 'react';

interface BackupStatus {
  status: 'success' | 'warning' | 'error' | 'never_executed' | 'unknown';
  statusMessage: string;
  lastBackup: string | null;
  lastBackupHoje: boolean;
  sucesso: boolean | null;
  arquivo: string | null;
  chatId: string | null;
  horasDesdeUltimoBackup: number;
}

/**
 * Componente para mostrar status do backup no cabeçalho
 */
interface BackupStatusHeaderProps {
  clientId?: string;
}

export default function BackupStatusHeader({ clientId = 'CMW' }: BackupStatusHeaderProps) {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  // Busca status do backup
  const fetchBackupStatus = async () => {
    try {
      const url = `/api/backup-status?clientId=${encodeURIComponent(clientId)}`;
      const response = await fetch(url);
      const data = await response.json();
      setBackupStatus(data);
    } catch (erro) {
      console.error('Erro ao buscar status do backup:', erro);
    } finally {
      setLoading(false);
    }
  };

  // Executa backup forçado
  const executeBackup = async () => {
    if (executing) return;

    setExecuting(true);
    try {
      const response = await fetch('/api/backup-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId })
      });

      if (response.ok) {
        // Atualiza status após execução
        await fetchBackupStatus();
      } else {
        console.error('Erro ao executar backup');
      }
    } catch (erro) {
      console.error('Erro ao executar backup:', erro);
    } finally {
      setExecuting(false);
    }
  };

  // Busca status inicial
  useEffect(() => {
    fetchBackupStatus();

    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchBackupStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
        Carregando...
      </div>
    );
  }

  if (!backupStatus) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600">
        ❌ Erro ao carregar status
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Indicador de Status */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(backupStatus.status)}`}>
        <span className="mr-1">{getStatusIcon(backupStatus.status)}</span>
        <span className="hidden sm:inline">
          {backupStatus.lastBackupHoje ? 'Backup OK' : 'Backup Pendente'}
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
          <div><strong>Status:</strong> {backupStatus.statusMessage}</div>
          {backupStatus.lastBackup && (
            <div><strong>Último backup:</strong> {new Date(backupStatus.lastBackup).toLocaleString('pt-BR')}</div>
          )}
          {backupStatus.arquivo && (
            <div><strong>Arquivo:</strong> {backupStatus.arquivo.split('/').pop()}</div>
          )}
          <div className="text-gray-300 text-xs mt-1">
            Chat: {backupStatus.chatId || 'Não configurado'}
          </div>
        </div>
      </div>
    </div>
  );
}
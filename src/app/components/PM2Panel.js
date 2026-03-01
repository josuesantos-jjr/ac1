'use client';

import { useState, useEffect } from 'react';
import styles from './PM2Panel.module.css';
import BackupStatusHeaderOtimizado from './BackupStatusHeaderOtimizado';
// Componente otimizado de backup (será carregado dinamicamente para evitar conflitos)

export default function PM2Panel() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Estados para o modal de logs
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [currentLogProcess, setCurrentLogProcess] = useState(null);
  const [logContent, setLogContent] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        console.log('[PM2Panel] Iniciando fetchProcesses...');
        const response = await fetch('/api/pm2-status');
        console.log('[PM2Panel] Resposta da API /api/pm2-status:', response);
        if (!response.ok) {
          console.error('Error fetching PM2 status:', response.statusText);
          setProcesses([]);
          return;
        }
        const data = await response.json();
        console.log('[PM2Panel] Dados recebidos da API /api/pm2-status:', data);
        if (Array.isArray(data)) {
            setProcesses(data);
        } else {
            console.error('Invalid data received from /api/pm2-status:', data);
            setProcesses([]);
        }
      } catch (error) {
        console.error('Error fetching PM2 processes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 30000); // Otimizado: 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleControlAction = async (processName, action) => {
    if (actionLoading === `${processName}-${action}`) return;
    setActionLoading(`${processName}-${action}`);
    
    console.log(`[PM2Panel] Enviando ação '${action}' para instância (clientId): ${processName}`);

    try {
      const response = await fetch('/api/client-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: processName, action: action }),
      });
      console.log(`[PM2Panel] Received response object from API for ${processName} action ${action}`, response);
      const data = await response.json();
      console.log(`[PM2Panel] API /api/client-control response for ${processName} action ${action}:`, data);

      if (!response.ok) {
        throw new Error(data.error || `Falha ao ${action} o processo`);
      }
    } catch (error) {
      console.error(`Erro ao ${action} processo ${processName}:`, error);
      alert(`Erro ao tentar ${action} o processo: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (processName) => {
    setCurrentLogProcess(processName);
    setIsLogModalOpen(true);
    setLogLoading(true);
    setLogContent('');
    try {
      const response = await fetch(`/api/pm2-logs/${processName}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || data.details || 'Erro desconhecido ao buscar logs'
        );
      }
      setLogContent(data.logs);
    } catch (error) {
      console.error(`Erro ao buscar logs para ${processName}:`, error);
      setLogContent(`Erro ao carregar logs: ${error.message}`);
    } finally {
      setLogLoading(false);
    }
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setCurrentLogProcess(null);
    setLogContent('');
  };

  if (loading && processes.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>Carregando processos...</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={styles.title}>🎛️ Centro de Controle do Sistema</h2>
        <div className="flex items-center space-x-4">
          <BackupStatusHeaderOtimizado />
        </div>
      </div>

      {/* Seção Original de Processos PM2 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Processos PM2</h3>
        {processes.length === 0 && !loading ? (
          <p className={styles.noProcesses}>
            Nenhum processo PM2 encontrado ou PM2 não está acessível.
          </p>
        ) : (
          <div className={styles.processGrid}>
            {processes.map((process, index) => (
            <div
              key={index}
              className={`${styles.processCard} ${styles[process.status]}`}
            >
              <h3 className={styles.processName}>{process.name}</h3>
              <div className={styles.processInfo}>
                <span className={styles.status}>
                  {process.status === 'online' ? 'Executando' : 'Pausado'}
                </span>
                <span className={styles.stats}>
                  CPU: {process.cpu.toFixed(1)}% | RAM: {Math.round(process.memory / 1024 / 1024)}MB
                </span>
                <div className={styles.controls}>
                  <button
                    className={`${styles.controlButton} ${styles.stopButton}`}
                    onClick={() => {
                      console.log(`Attempting to stop process: ${process.name}`);
                      handleControlAction(process.name, 'stop');
                    }}
                    disabled={
                      process.status !== 'online' ||
                      actionLoading === `${process.name}-stop`
                    }
                    title={
                      process.status !== 'online'
                        ? 'Processo não está online'
                        : 'Parar processo'
                    }
                  >
                    {actionLoading === `${process.name}-stop`
                      ? 'Parando...'
                      : 'Parar'}
                  </button>
                  <button
                    className={`${styles.controlButton} ${styles.restartButton}`}
                    onClick={() => {
                      console.log(`Attempting to restart process: ${process.name}`);
                      handleControlAction(process.name, 'restart');
                    }}
                    disabled={actionLoading === `${process.name}-restart`}
                    title="Reiniciar processo"
                  >
                    {actionLoading === `${process.name}-restart`
                      ? 'Reiniciando...'
                      : 'Reiniciar'}
                  </button>
                  <button
                    className={`${styles.controlButton} ${styles.logsButton}`}
                    onClick={() => {
                      console.log(`Attempting to view logs for process: ${process.name}`);
                      handleViewLogs(process.name);
                    }}
                    disabled={actionLoading === `${process.name}-logs`}
                    title="Ver logs recentes"
                  >
                    {actionLoading === `${process.name}-logs`
                      ? 'Carregando...'
                      : 'Ver Logs'}
                  </button>
                  <button
                    className={`${styles.controlButton} ${styles.deleteButton}`}
                    onClick={() => {
                      // Garante que o nome da instância clicada seja usado como clientId
                      const instanceName = process.name;
                      if (
                        confirm(
                          `Tem certeza que deseja DELETAR a instância PM2 "${instanceName}"? Isso removerá o processo da lista do PM2.`
                        )
                      ) {
                        console.log(`[PM2Panel] Botão Deletar clicado para instância: ${instanceName}`);
                        handleControlAction(instanceName, 'delete');
                      }
                    }}
                    disabled={actionLoading === `${process.name}-delete`}
                    title="Deletar processo do PM2"
                  >
                    {actionLoading === `${process.name}-delete`
                      ? 'Deletando...'
                      : 'Deletar'}
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

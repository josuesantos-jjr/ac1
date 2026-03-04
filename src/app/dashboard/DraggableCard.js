'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import OptionsMenu from '../components/OptionsMenu';
import { useRouter } from 'next/navigation';

export default function DraggableCard({
  cliente,
  clientId, // código fixo do cliente (opcional, alternativacliente.codigo || cliente.id)
  onEditarCliente,
  onIniciarCliente,
  onCopy,
  onPaste,
  onDuplicate,
  onRename,
  onAbrirCrmModal, // Nova prop
  onAbrirRelatorioCliente, // Nova prop
  onDownloadClientFolder, // Nova prop para baixar pasta
  existingClients = [],
}) {
  // Usa clientId passado explicitamente ou deriva do cliente
  const codigoCliente = clientId || cliente.codigo || cliente.id;
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(cliente.status);
  const [pm2Status, setPm2Status] = useState('unknown'); // Status real do PM2
  const [envStatus, setEnvStatus] = useState('Carregando...');
  const [sessionStatusDisplay, setSessionStatusDisplay] = useState('Carregando...');
  const [disparoInfo, setDisparoInfo] = useState({
    statusGeral: 'carregando', // 'em_andamento', 'concluido', 'sem_listas_ativas', 'sem_listas_disparo', 'erro', 'carregando'
    listasAtivasCount: 0,
    listaAtual: {
      indice: 0,
      progressoPercentual: 0,
    },
    totalListasNaFila: 0,
    logErro: null,
    loading: true,
  });
  const router = useRouter();
  const [showErrorLogModal, setShowErrorLogModal] = useState(false); // Estado para modal de erro

  const handleToggleErrorLog = () => {
    setShowErrorLogModal(!showErrorLogModal);
  };



  // Hook para verificar status do .env
  useEffect(() => {
    const checkEnvStatus = async () => {
      try {
        const response = await fetch(
          `/api/env-status?clientId=${encodeURIComponent(codigoCliente)}`
        );
        const data = await response.json();
        if (data.status) {
          setEnvStatus(data.status);
        }
      } catch (error) {
        console.error('Erro ao verificar status do .env:', error);
        setEnvStatus('Erro ao ler status');
      }
    };
    checkEnvStatus();
    // A atualização pode ser feita recarregando a lista de clientes no dashboard principal
  }, [codigoCliente]);


  // Hook para buscar status da sessão do infoCliente.json
  useEffect(() => {
    const fetchSessionStatus = async () => {
      try {
        const response = await fetch(
          `/api/client-config?clientId=${encodeURIComponent(codigoCliente)}`
        );
        const data = await response.json();
        if (data && data.STATUS_SESSION) {
          setSessionStatusDisplay(data.STATUS_SESSION);
        } else {
          setSessionStatusDisplay('N/A'); // Or some default status if not found
        }
      } catch (error) {
        console.error('Erro ao verificar status da sessão:', error);
        setSessionStatusDisplay('Erro');
      }
    };

    // Only fetch if not a model, similar to disparoInfo
    if (cliente.currentStatus !== 'modelos') {
      fetchSessionStatus();
    } else {
      setSessionStatusDisplay('N/A (Modelo)');
    }
  }, [codigoCliente]); // Depend on client code

  // Hook para buscar informações de disparo reais
  useEffect(() => {
    const fetchDisparoInfo = async () => {
      setDisparoInfo((prev) => ({
        ...prev,
        loading: true,
        statusGeral: 'carregando',
      }));
      try {
        const response = await fetch(
          `/api/disparo-status?clientId=${encodeURIComponent(codigoCliente)}`
        );
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.statusText}`);
        }
        const data = await response.json();
        setDisparoInfo({
          statusGeral: data.statusGeral || 'sem_listas_disparo',
          listasAtivasCount: data.listasAtivasCount || 0,
          listaAtual: data.listaAtual || { indice: 0, progressoPercentual: 0 },
          totalListasNaFila: data.totalListasNaFila || 0,
          logErro: data.logErro || null,
          loading: false,
        });
      } catch (error) {
        console.error(
          `Erro ao buscar info de disparo para ${codigoCliente}:`,
          error
        );
        setDisparoInfo({
          statusGeral: 'erro',
          listasAtivasCount: 0,
          listaAtual: { indice: 0, progressoPercentual: 0 },
          totalListasNaFila: 0,
          logErro: error.message || 'Falha ao buscar dados.',
          loading: false,
        });
      }
    };

    if (cliente.currentStatus !== 'modelos') {
      fetchDisparoInfo();
    } else {
      // Define um estado padrão para modelos, sem fazer chamada à API
      setDisparoInfo({
        statusGeral: 'n/a',
        listasAtivasCount: 0,
        listaAtual: { indice: 0, progressoPercentual: 0 },
        totalListasNaFila: 0,
        logErro: null,
        loading: false,
      });
    }
}, [cliente.codigo || cliente.id]); // Depend on client code

  // Hook para verificar status real do PM2
  useEffect(() => {
    const checkPm2Status = async () => {
      try {
        const response = await fetch(`/api/pm2-status?clientId=${encodeURIComponent(codigoCliente)}`);
        if (response.ok) {
          const data = await response.json();
          setPm2Status(data.status || 'not_found');
        } else {
          setPm2Status('not_found');
        }
      } catch (error) {
        console.error('Erro ao verificar status do PM2:', error);
        setPm2Status('not_found');
      }
    };

    if (cliente.currentStatus !== 'modelos') {
      checkPm2Status();
      // Atualiza periodicamente a cada 30 segundos
      const interval = setInterval(checkPm2Status, 30000);
      return () => clearInterval(interval);
    }
  }, [codigoCliente]);

  const handleStartStop = async () => {
    if (loading) return;

    try {
      // Determina a ação baseada no status real do PM2 (já carregado)
      const isOnline = pm2Status === 'online';
      const action = isOnline ? 'stop' : 'start';
      
      console.log(`[DraggableCard] Status PM2 para ${cliente.name}:`, {
        pm2Status: pm2Status,
        action,
        clientName: cliente.name,
        folderType: cliente.folderType
      });

      // Chama a função do dashboard com os parâmetros corretos
      // Usa codigo (código fixo) ou id (nome da pasta) - nunca o name de exibição
      await onIniciarCliente(cliente.codigo || cliente.id, cliente.folderType, action);

      // Atualiza o estado do PM2 após a ação
      setPm2Status(isOnline ? 'not_found' : 'online');
    } catch (error) {
      console.error('[DraggableCard] Erro ao iniciar/parar cliente:', error);
      alert(`Erro ao processar cliente ${cliente.name}: ${error.message}`);
    }
  };

  return (
    <>
      {' '}
      {/* Adiciona Fragmento React */}
      <div
        className={`${styles.card} ${styles[cliente.folderType]}`}
      >
        <div className={styles.cardHeader}>
          <h2>{cliente.name}</h2>
          <div className={styles.cardActions}>
            <span
              className={`${styles.statusBadge} ${styles[sessionStatusDisplay.toLowerCase() === 'inchat' ? 'statusActive' : 'statusInactive']}`}
            >
              {sessionStatusDisplay}
            </span>
            <OptionsMenu
              clientName={cliente.name}
              clientType={cliente.folderType}
              onCopy={() => onCopy(cliente.folderType, cliente.name)}
              onPaste={() => onPaste(cliente.folderType, cliente.name)}
              onDuplicate={() => onDuplicate(cliente.folderType, cliente.name)}
              onRename={onRename}
              onDownloadFolder={() => onDownloadClientFolder(cliente.name)} // Passa apenas o nome do cliente
              existingClients={existingClients}
            />
          </div>
        </div>
        <div className={`${styles.cardContent} ${styles.disparoInfoSection}`}>
          {/* Informações de Disparo Reais */}
          {cliente.currentStatus !== 'modelos' ? (
            disparoInfo.loading ? (
              <p>Carregando info disparo...</p>
            ) : (
              <>
                {/* Status Geral do Disparo */}
                <p className={styles.disparoStatusLine}>
                  <span>Disparo: </span>
                  <span
                    className={`${styles.disparoStatusBadge} ${styles[`disparoStatus${disparoInfo.statusGeral.replace('_', '')}`]}`}
                  >
                    {disparoInfo.statusGeral === 'em_andamento'
                      ? 'Em Andamento'
                      : disparoInfo.statusGeral === 'concluido'
                        ? 'Concluído'
                        : disparoInfo.statusGeral === 'sem_listas_ativas'
                          ? 'Sem Listas Ativas'
                          : disparoInfo.statusGeral === 'sem_listas_disparo'
                            ? 'Sem Listas para Disparo'
                            : disparoInfo.statusGeral === 'erro'
                              ? 'Erro'
                              : disparoInfo.statusGeral === 'carregando'
                                ? 'Carregando...'
                                : 'N/A'}
                  </span>
                  {disparoInfo.statusGeral === 'erro' &&
                    disparoInfo.logErro && (
                      <button
                        onClick={handleToggleErrorLog}
                        className={styles.errorLogIcon}
                        title="Ver Log de Erro"
                      >
                        ℹ️
                      </button>
                    )}
                </p>

                {/* Número de Listas Ativas */}
                {(disparoInfo.statusGeral === 'em_andamento' ||
                  disparoInfo.statusGeral === 'concluido' ||
                  disparoInfo.statusGeral === 'sem_listas_ativas') &&
                  disparoInfo.listasAtivasCount > 0 && (
                    <p>Listas Ativas: {disparoInfo.listasAtivasCount}</p>
                  )}

                {/* Progresso da Lista Atual */}
                {disparoInfo.statusGeral === 'em_andamento' &&
                  disparoInfo.listaAtual &&
                  disparoInfo.totalListasNaFila > 0 && (
                    <>
                      <p>
                        Progresso: {disparoInfo.listaAtual.progressoPercentual}%
                        Concluído - {disparoInfo.listaAtual.indice} /{' '}
                        {disparoInfo.totalListasNaFila}
                      </p>
                      <div className={styles.disparoProgressBarContainer}>
                        <div
                          className={styles.disparoProgressBar}
                          style={{
                            width: `${disparoInfo.listaAtual.progressoPercentual}%`,
                          }}
                          title={`${disparoInfo.listaAtual.progressoPercentual}%`}
                        >
                          {/* Opcional: Texto dentro da barra */}
                          {/* {disparoInfo.listaAtual.progressoPercentual}% */}
                        </div>
                      </div>
                    </>
                  )}
              </>
            )
          ) : (
            <p className={styles.disparoStatusLine}>
              <span>Disparo: N/A (Modelo)</span>
            </p>
          )}
          {/* Manter Status .env se relevante */}
          {/* <p>Status .env: <span className={styles.envStatus}>{envStatus}</span></p> */}
        </div>
        <div className={styles.cardActions}>
          <button
            onClick={() =>
              onEditarCliente(cliente.id)
            }
            className={`${styles.actionButton} ${styles.actionButtonEdit}`}
          >
            <span className={styles.buttonText}>Editar</span>
          </button>
          {cliente.currentStatus !== 'modelos' && (
            <>
              <button
                onClick={handleStartStop}
                disabled={loading}
                className={`${styles.actionButton} ${pm2Status === 'online' ? styles.actionButtonStop : ''}`}
              >
                <span className={styles.buttonText}>
                  {pm2Status === 'online' ? 'Parar' : 'Iniciar'}
                </span>
              </button>
              <button
                onClick={onAbrirRelatorioCliente} // Chama a função passada por prop
                className={`${styles.actionButton} ${styles.actionButtonReport}`}
              >
                <span className={styles.buttonText}>Relatório</span>
              </button>
              <button
                onClick={onAbrirCrmModal} // Chama a função passada por prop
                className={`${styles.actionButton} ${styles.actionButtonCrm}`}
              >
                <span className={styles.buttonText}>CRM</span>
              </button>
            </>
          )}
        </div>
      </div>
      {/* Modal de Log de Erro */}
      {showErrorLogModal && (
        <div
          className={styles.errorLogModalOverlay}
          onClick={handleToggleErrorLog}
        >
          <div
            className={styles.errorLogModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Log de Erro do Disparo</h3>
            <pre>{disparoInfo.logErro || 'Nenhum log de erro disponível.'}</pre>
            <button onClick={handleToggleErrorLog}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );

}

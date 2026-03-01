'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './InitClientModal.module.css';

const STAGES = {
  LOADING: 'loading',
  COUNTDOWN: 'countdown',
  STATUS_CHECK: 'status_check',
  QR_CODE: 'qr_code',
  CONNECTED: 'connected',
};

const QrCodeDisplay = ({ clientId }) => {
  const [qrCodeExists, setQrCodeExists] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now()); // Forçar atualização do QR code

  useEffect(() => {
    const checkQrCode = async () => {
      try {
        console.log(`[QrCodeDisplay] Checking QR code for ${clientId}, attempt ${retryCount + 1}`);
        const response = await fetch(
          `/api/qr-code?clientId=${encodeURIComponent(clientId)}&checkOnly=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[QrCodeDisplay] Response for ${clientId}:`, data);
          
          if (data.exists) {
            console.log(`[QrCodeDisplay] QR code found for ${clientId}!`);
            setQrCodeExists(true);
            setIsLoading(false);
          } else {
            console.log(`[QrCodeDisplay] QR code not found for ${clientId}, will retry...`);
            setIsLoading(true);
          }
        } else {
          console.error(`[QrCodeDisplay] HTTP error ${response.status} for ${clientId}`);
        }
      } catch (error) {
        console.error(`[QrCodeDisplay] Error checking QR code for ${clientId}:`, error);
      } finally {
        // Always try again after a delay if we haven't found it yet
        if (!qrCodeExists) {
          const timeout = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000); // Wait 2 seconds between retries
          return () => clearTimeout(timeout);
        }
      }
    };

    checkQrCode();
  }, [clientId, retryCount, qrCodeExists]);

  // Effect para atualizar o QR code a cada 10 segundos
  useEffect(() => {
    if (qrCodeExists) {
      const refreshInterval = setInterval(() => {
        console.log(`[QrCodeDisplay] Refreshing QR code for ${clientId}`);
        setRefreshKey(Date.now());
      }, 10000); // Atualiza a cada 10 segundos

      return () => clearInterval(refreshInterval);
    }
  }, [clientId, qrCodeExists]);

  if (isLoading && !qrCodeExists) {
    return (
      <div className={styles.qrCodeLoading}>
        <div className={styles.spinner} />
        <p>Aguardando geração do QR Code... (tentativa {retryCount + 1})</p>
      </div>
    );
  }

  if (!qrCodeExists) {
    return (
      <div className={styles.qrCodeLoading}>
        <div className={styles.spinner} />
        <p>Aguardando geração do QR Code...</p>
      </div>
    );
  }

  return (
    <div key={refreshKey}>
      <img
        src={`/api/qr-code?clientId=${encodeURIComponent(clientId)}&t=${refreshKey}`}
        alt="QR Code"
        className={styles.qrCodeImage}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }}
        onLoad={() => console.log(`[QrCodeDisplay] QR code loaded for ${clientId} at ${new Date().toLocaleTimeString()}`)}
        onError={() => console.error(`[QrCodeDisplay] Failed to load QR code for ${clientId}`)}
      />
      <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '5px' }}>
        ⏰ Atualizando automaticamente a cada 10 segundos
      </p>
    </div>
  );
};

const StageComponent = ({
  stage,
  countdown,
  qrCodeTimer,
  connectionStatus,
  clientId,
}) => {
  switch (stage) {
    case STAGES.LOADING:
      return (
        <div className={styles.loadingStage}>
          <div className={styles.spinner} />
          <p>Carregando...</p>
        </div>
      );

    case STAGES.COUNTDOWN:
      return (
        <div className={styles.countdownStage}>
          <p>Aguarde para iniciar</p>
          <div className={styles.countdownCircle}>{countdown}</div>
        </div>
      );

    case STAGES.STATUS_CHECK:
    case STAGES.QR_CODE:
    case STAGES.CONNECTED:
      return (
        <div className={styles.statusStage}>
          <div className={styles.statusHeader}>
            <h3>Status da conexão</h3>
            <p>{connectionStatus}</p>
          </div>

          {stage === STAGES.QR_CODE && (
            <div className={styles.qrCodeSection}>
              <p>Status: {connectionStatus || 'Conectando...'}</p>
              {qrCodeTimer > 0 && <p>Aguardando QR Code... ({qrCodeTimer}s)</p>}
              <p>📱 Escaneie o QR code com seu WhatsApp para conectar</p>
              <div className={styles.qrCodeContainer}>
                <QrCodeDisplay clientId={clientId} />
              </div>
            </div>
          )}

          {stage === STAGES.CONNECTED && (
            <div className={styles.connectedSection}>
              <div className={styles.checkmark}>✓</div>
              <p>Conectado com sucesso!</p>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};

export default function InitClientModal({ isOpen, onClose, clientId, action }) {
  const [stage, setStage] = useState(STAGES.LOADING);
  const [countdown, setCountdown] = useState(10);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [qrCodeTimer, setQrCodeTimer] = useState(50);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStage(STAGES.LOADING);
      setCountdown(10);
      setConnectionStatus('');
      setQrCodeTimer(50);
      setShouldClose(false);
      setIsConnected(false);
      return;
    }

    // Reset states when modal opens
    setStage(STAGES.LOADING);
    setCountdown(10);
    setConnectionStatus('');
    setQrCodeTimer(50);
    setShouldClose(false);
    setIsConnected(false);

    // Initial loading animation (2s)
    setIsTransitioning(true);
    const loadingTimer = setTimeout(() => {
      setStage(STAGES.COUNTDOWN);
      setIsTransitioning(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, [isOpen]);

  useEffect(() => {
    if (shouldClose) {
      const closeTimer = setTimeout(() => {
        onClose();
      }, 1500); // Wait for animations to complete
      return () => clearTimeout(closeTimer);
    }
  }, [shouldClose, onClose]);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/client-config?clientId=${encodeURIComponent(clientId)}`);
      const data = await response.json();
      
      const status = data.STATUS_SESSION || '';
      setConnectionStatus(status);

      // Verifica se está conectado
      const connected = status.toLowerCase() === 'inchat';
      setIsConnected(connected);

      // Se não está conectado (status diferente de 'inchat'), entra em modo QR_CODE
      if (!connected) {
        console.log(`[InitClientModal] Status não conectado: ${status}, entrando em modo QR_CODE`);
        setStage(STAGES.QR_CODE);
      } else {
        console.log(`[InitClientModal] Status conectado: ${status}, finalizando modal`);
        setIsTransitioning(true);
        setStage(STAGES.CONNECTED);
        setShouldClose(true); // Trigger auto-close after animations
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }, [
    clientId,
    setConnectionStatus,
    setStage,
    setIsTransitioning,
    setShouldClose,
    setIsConnected,
  ]);

  const startClient = useCallback(async () => {
    try {
      const response = await fetch('/api/client-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, action: 'start' }),
      });

      if (!response.ok) {
        console.error('Failed to start client:', response.statusText);
      }
    } catch (error) {
      console.error('Error starting client:', error);
    }
  }, [clientId]);

  const stopClient = useCallback(async () => {
    try {
      const response = await fetch('/api/client-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, action: 'stop' }),
      });

      if (!response.ok) {
        console.error('Failed to stop client:', response.statusText);
      }
    } catch (error) {
      console.error('Error stopping client:', error);
    }
  }, [clientId]);

  useEffect(() => {
    let timerId; // Use a single variable for the timer ID

    if (stage === STAGES.COUNTDOWN) {
      if (countdown > 0) {
        // Timer to decrement countdown
        timerId = setTimeout(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // countdown === 0
        // Timer for stage transition
        setIsTransitioning(true);
        timerId = setTimeout(() => {
          setStage(STAGES.STATUS_CHECK);
          if (action === 'start') {
            startClient();
          } else if (action === 'stop') {
            stopClient();
          }
          checkConnectionStatus();
          setIsTransitioning(false);
        }, 1000); // Delay transition
      }
    }

    // Cleanup function: clear the active timer
    return () => clearTimeout(timerId);
  }, [
    stage,
    countdown,
    action,
    startClient,
    stopClient,
    checkConnectionStatus,
  ]); // Added missing dependencies

  // Effect para verificar status continuamente enquanto não estiver conectado
  useEffect(() => {
    if (stage === STAGES.QR_CODE && !isConnected) {
      const timer = setInterval(() => {
        checkConnectionStatus();
      }, 2000); // Verifica a cada 2 segundos

      return () => clearInterval(timer);
    }
  }, [stage, isConnected, checkConnectionStatus]);

  // Effect para countdown do QR code (para efeitos visuais)
  useEffect(() => {
    if (stage === STAGES.QR_CODE && !isConnected && qrCodeTimer > 0) {
      const timer = setTimeout(() => {
        setQrCodeTimer((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isConnected) {
      // Reset timer quando conectar
      setQrCodeTimer(50);
    }
  }, [stage, isConnected, qrCodeTimer]);

  // Function definitions moved before the useEffect hooks that use them

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxHeight: '90vh', overflowY: 'auto', maxWidth: '95%' }}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <div
          className={`${styles.content} ${isTransitioning ? styles.transitioning : ''}`}
        >
          <StageComponent
            stage={stage}
            countdown={countdown}
            qrCodeTimer={qrCodeTimer}
            connectionStatus={connectionStatus}
            clientId={clientId}
          />
        </div>
      </div>
    </div>
  );
}

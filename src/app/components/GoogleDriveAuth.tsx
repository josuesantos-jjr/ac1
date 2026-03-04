'use client';

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

// Configurar react-modal para o app
if (typeof window !== 'undefined') {
  try {
    Modal.setAppElement('#__next');
  } catch (error) {
    Modal.setAppElement('body');
  }
}

interface GoogleDriveAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (authData: any) => void;
  onAuthError?: (error: string) => void;
}

const GoogleDriveAuth: React.FC<GoogleDriveAuthProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onAuthError
}) => {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<Window | null>(null);

  // Buscar URL de autenticação ao abrir
  useEffect(() => {
    if (isOpen) {
      fetchAuthUrl();
    }
  }, [isOpen]);

  // Listener para mensagens postMessage da popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar se a mensagem vem da mesma origem
      if (event.origin !== window.location.origin) {
        return;
      }

      // Verificar se é uma mensagem de autenticação bem-sucedida
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Recebida mensagem de autenticação bem-sucedida:', event.data);

        // Fechar popup se ainda estiver aberta
        if (popup && !popup.closed) {
          popup.close();
          setPopup(null);
        }

        // Notificar sucesso sem fechar o modal
        onAuthSuccess({
          authenticated: true,
          scope: event.data.scope || 'drive'
        });

        // Limpar erro se houver
        setError(null);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [popup, onAuthSuccess]);

  const fetchAuthUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/auth/google?scope=drive');
      if (response.data.authenticated) {
        // Já está autenticado
        onAuthSuccess({
          authenticated: true,
          scope: 'drive'
        });
        onClose();
      } else if (response.data.authUrl) {
        setAuthUrl(response.data.authUrl);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao obter URL de autenticação';
      setError(errorMsg);
      if (onAuthError) onAuthError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (!authUrl) return;

    // Abrir popup de autenticação
    const newPopup = window.open(
      authUrl,
      'googleAuth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!newPopup) {
      setError('Popup bloqueado. Permita popups para este site.');
      return;
    }

    // Salvar referência da popup para fechamento automático
    setPopup(newPopup);

    // Monitorar fechamento da popup (fallback)
    const checkClosed = setInterval(() => {
      if (newPopup.closed) {
        clearInterval(checkClosed);
        setPopup(null);
        // Verificar se a autenticação foi bem-sucedida (como fallback)
        setTimeout(() => {
          verifyAuthStatus();
        }, 500);
      }
    }, 1000);

    // Timeout de segurança (5 minutos)
    setTimeout(() => {
      if (newPopup && !newPopup.closed) {
        newPopup.close();
        setPopup(null);
        clearInterval(checkClosed);
        setError('Timeout na autenticação. Tente novamente.');
      }
    }, 5 * 60 * 1000);
  };

  const verifyAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/google?scope=drive');
      if (response.data.authenticated) {
        onAuthSuccess({
          authenticated: true,
          scope: 'drive'
        });
        onClose();
      } else {
        setError('Autenticação não concluída. Tente novamente.');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao verificar autenticação';
      setError(errorMsg);
      if (onAuthError) onAuthError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '350px',
          padding: '20px',
          borderRadius: '8px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        },
      }}
      contentLabel="Google Drive Authentication"
    >
      <div className="google-drive-auth">
        <div className="header">
          <h3>🔐 Autenticação Google Drive</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="content">
          <p>Para fazer backup no Google Drive, você precisa autorizar o acesso à sua conta Google.</p>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {authUrl && !loading && (
            <div className="auth-section">
              <button onClick={handleGoogleAuth} className="google-auth-button">
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  className="google-logo"
                />
                Conectar com Google
              </button>
              <p className="auth-note">
                Uma nova janela será aberta para você autorizar o acesso ao Google Drive.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .google-drive-auth {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: Arial, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #ddd;
        }

        .header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-button:hover {
          color: #333;
        }

        .content {
          flex: 1;
          text-align: center;
        }

        .content p {
          margin-bottom: 20px;
          color: #666;
          line-height: 1.5;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
          margin-bottom: 20px;
        }

        .auth-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .google-auth-button {
          display: flex;
          align-items: center;
          background: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 15px;
        }

        .google-auth-button:hover {
          background: #3367d6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .google-logo {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          background: white;
          padding: 2px;
          border-radius: 2px;
        }

        .auth-note {
          font-size: 14px;
          color: #666;
          max-width: 300px;
        }
      `}</style>
    </Modal>
  );
};

export default GoogleDriveAuth;
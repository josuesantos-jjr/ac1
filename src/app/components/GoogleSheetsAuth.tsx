'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

// Configurar react-modal para o app
if (typeof window !== 'undefined') {
  try {
    Modal.setAppElement('#__next');
  } catch (error) {
    Modal.setAppElement('body');
  }
}

interface GoogleSheetsAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const GoogleSheetsAuth: React.FC<GoogleSheetsAuthProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Verificar autenticação ao abrir
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  // Verificar status de autenticação
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/google');
      if (response.data.authenticated) {
        onAuthSuccess();
        onClose();
        return;
      }
      setAuthUrl(response.data.authUrl);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  };

  // Iniciar autenticação em popup
  const startAuth = () => {
    if (!authUrl) return;

    setLoading(true);

    // Criar janela popup
    const popup = window.open(
      authUrl,
      'googleAuth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (popup) {
      setAuthWindow(popup);

      // Verificar se a janela foi fechada
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setAuthWindow(null);
          setLoading(false);
          // Verificar se autenticação foi bem-sucedida
          checkAuthStatus();
        }
      }, 1000);

      // Escutar mensagens da janela popup (opcional)
      const handleMessage = (event: MessageEvent) => {
        if (event.origin === window.location.origin && event.data === 'auth_success') {
          popup.close();
          clearInterval(checkClosed);
          setAuthWindow(null);
          setLoading(false);
          onAuthSuccess();
          onClose();
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      };
    }
  };

  // Cancelar autenticação
  const cancelAuth = () => {
    if (authWindow && !authWindow.closed) {
      authWindow.close();
    }
    setAuthWindow(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={cancelAuth}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          padding: '30px',
          borderRadius: '8px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        },
      }}
      contentLabel="Google Sheets Authentication"
    >
      <div className="google-auth-modal">
        <h3>🔗 Conectar Google Sheets</h3>

        <p>Para sincronizar seus dados com o Google Sheets, você precisa autorizar o acesso.</p>

        {loading ? (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Aguardando autenticação no Google...</p>
            <p className="hint">Complete o login na janela que foi aberta</p>
          </div>
        ) : (
          <div className="auth-section">
            <div className="auth-info">
              <h4>✅ O que será acessado:</h4>
              <ul>
                <li>Criar e editar planilhas</li>
                <li>Ler e escrever dados dos clientes</li>
                <li>Sincronização automática</li>
              </ul>

              <h4>🔒 Segurança:</h4>
              <ul>
                <li>Somente dados do CRM</li>
                <li>Permissões específicas do Google</li>
                <li>Você pode revogar acesso a qualquer momento</li>
              </ul>
            </div>

            <div className="auth-actions">
              <button
                onClick={startAuth}
                className="auth-button primary"
                disabled={!authUrl}
              >
                🚀 Autorizar Google Sheets
              </button>

              <button
                onClick={cancelAuth}
                className="auth-button secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .google-auth-modal {
          text-align: center;
        }

        .google-auth-modal h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .google-auth-modal p {
          color: #666;
          margin-bottom: 20px;
        }

        .loading-section {
          padding: 20px 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-section p {
          margin: 5px 0;
          color: #666;
        }

        .hint {
          font-size: 14px;
          color: #888;
        }

        .auth-section {
          text-align: left;
        }

        .auth-info {
          margin-bottom: 25px;
        }

        .auth-info h4 {
          margin: 15px 0 8px 0;
          color: #333;
          font-size: 16px;
        }

        .auth-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .auth-info li {
          margin-bottom: 4px;
          color: #666;
          font-size: 14px;
        }

        .auth-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .auth-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .auth-button.primary {
          background: #4285f4;
          color: white;
        }

        .auth-button.primary:hover:not(:disabled) {
          background: #3367d6;
        }

        .auth-button.secondary {
          background: #f8f9fa;
          color: #666;
          border: 1px solid #ddd;
        }

        .auth-button.secondary:hover {
          background: #e9ecef;
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  );
};

export default GoogleSheetsAuth;
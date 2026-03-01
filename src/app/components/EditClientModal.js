'use client';

import { useState, useEffect } from 'react';
import ListasModal from './ListasModal.js';
import RegrasDisparoModal from './RegrasDisparoModal.js';
import FollowUpConfigModal from './FollowUpConfigModal.js';
import GatilhosConfigModal from './GatilhosConfigModal.js';

export default function EditClientModal({ isOpen, onClose, clientId, onSave }) {
  const [showListasModal, setShowListasModal] = useState(false);
  const [showRegrasModal, setShowRegrasModal] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [showGatilhosModal, setShowGatilhosModal] = useState(false);
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setLoading(false);

    if (isOpen && clientId) {
      fetch(`/api/client-config?clientId=${encodeURIComponent(clientId)}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        // Forçar "Funil de vendas" a sempre ser array
        const processedData = { ...data };
        if (processedData.GEMINI_PROMPT && processedData.GEMINI_PROMPT[0]) {
          let funil = processedData.GEMINI_PROMPT[0]["Funil de vendas"];
          if (typeof funil === 'string') {
            try {
              funil = JSON.parse(funil);
            } catch (e) {
              // Se parse falhar, usa padrão
            }
          }
          if (!Array.isArray(funil)) {
            funil = [
              { nome: 'Prospecto', descricao: 'Contato inicial identificado' },
              { nome: 'Contato Inicial', descricao: 'Primeira interação estabelecida' },
              { nome: 'Qualificação', descricao: 'Informações básicas coletadas' },
              { nome: 'Proposta', descricao: 'Apresentação de imóveis e propostas' },
              { nome: 'Fechamento', descricao: 'Negociação final e fechamento' },
              { nome: 'Pós-Venda', descricao: 'Acompanhamento após a venda' }
            ];
          }
          processedData.GEMINI_PROMPT[0]["Funil de vendas"] = funil;
        }
        setConfigJson(JSON.stringify(processedData, null, 2));
      })
      .catch((err) => {
        console.error('Error loading client config:', err);
        setError('Erro ao carregar configuração do cliente: ' + err.message);
      });
    }
  }, [isOpen, clientId]);

  const handleSave = async () => {
    setError(null);
    setLoading(true);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(configJson);
      } catch (parseError) {
        throw new Error('JSON inválido. Verifique a sintaxe.');
      }

      const saveConfigResponse = await fetch('/api/create-client-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'salvarDadosNoEnv',
          novoClienteId: clientId,
          dados: parsedData,
        }),
      });

      if (!saveConfigResponse.ok) {
        let errorDetail = `Erro HTTP: ${saveConfigResponse.status}`;
        try {
          const errorBody = await saveConfigResponse.text();
          errorDetail += ` - Detalhes: ${errorBody}`;
          console.error('Save config API error details:', errorBody);
        } catch (readError) {
          errorDetail += ' - Não foi possível ler detalhes do erro.';
        }

        if (saveConfigResponse.status === 405) {
          throw new Error(`Operação não permitida na API de configuração (${saveConfigResponse.status}). Verifique os logs do servidor.`);
        } else {
          throw new Error(`Erro ao salvar configurações do cliente: ${errorDetail}`);
        }
      }

      const saveConfigResult = await saveConfigResponse.json();
      console.log('Client config saved successfully:', saveConfigResult);

      onSave(clientId);
      onClose();

    } catch (error) {
      console.error('Error saving:', error);
      setError('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  console.log('EditClientModal rendering:', { isOpen, clientId, configJson: configJson ? 'loaded' : 'empty' });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2>Editar Configuração do Cliente</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Edite o JSON da configuração do cliente diretamente. Todos os campos, incluindo objetos aninhados e arrays, podem ser modificados.
          </p>
        </div>

        {error && <div style={{
          margin: '0 0 20px',
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: '#fff5f5',
          color: '#c92a2a',
          fontSize: '14px',
          border: '1px solid #ffc9c9'
        }}>{error}</div>}

        <div style={{ flex: 1, marginBottom: '20px' }}>
          <textarea
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            rows={30}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.4',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
            placeholder="Carregando configuração..."
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '20px',
          borderTop: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                console.log('Listas button clicked');
                setShowListasModal(true);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#0984e3',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Listas
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Regras button clicked');
                setShowRegrasModal(true);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#ff7f50',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Regras de Disparo
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('FollowUp button clicked');
                setIsFollowUpModalOpen(true);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#6f42c1',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Editar FollowUp
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Gatilhos button clicked');
                setShowGatilhosModal(true);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#a29bfe',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Configurar Gatilhos
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                console.log('Cancel button clicked');
                onClose();
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#636e72',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Save button clicked');
                handleSave();
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: loading ? '#a0a0a0' : '#00b894',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <ListasModal
        isOpen={showListasModal}
        onClose={() => setShowListasModal(false)}
        clientId={clientId}
        clienteSequencialId={clientId ? clientId.split('/').pop() : ''}
      />

      <RegrasDisparoModal
        isOpen={showRegrasModal}
        onClose={() => setShowRegrasModal(false)}
        clientId={clientId}
        clienteSequencialId={clientId ? clientId.split('/').pop() : ''}
      />

      <FollowUpConfigModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        clientId={clientId}
        clienteSequencialId={clientId ? clientId.split('/').pop() : ''}
      />

      <GatilhosConfigModal
        isOpen={showGatilhosModal}
        onClose={() => setShowGatilhosModal(false)}
        clientId={clientId}
        clienteSequencialId={clientId ? clientId.split('/').pop() : ''}
      />

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1100;
          padding: 20px;
          backdrop-filter: blur(2px);
        }

        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
        }

        .modal-header {
          flex-shrink: 0;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h2 {
          margin: 0 0 10px 0;
          color: #2d3436;
        }

        .modal-description {
          margin: 0;
          color: #868e96;
          font-size: 14px;
        }

        .error-message {
          flex-shrink: 0;
          margin: 0 0 20px;
          padding: 12px;
          border-radius: 6px;
          background-color: #fff5f5;
          color: #c92a2a;
          font-size: 14px;
          border: 1px solid #ffc9c9;
        }

        .form-content {
          flex: 1;
          margin-bottom: 20px;
        }

        .button-bar {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .left-buttons,
        .right-buttons {
          display: flex;
          gap: 10px;
        }

        .button-bar button {
          padding: 12px 24px;
          border-radius: 6px;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .listas-button {
          background: #0984e3;
        }

        .listas-button:hover {
          background: #0873c4;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .regras-button {
          background: #ff7f50;
        }

        .regras-button:hover {
          background: #ff6347;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .followup-button {
          background: #6f42c1;
        }

        .followup-button:hover {
          background: #5a32a3;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .gatilhos-button {
          background: #a29bfe;
        }

        .gatilhos-button:hover {
          background: #6c5ce7;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .save-button {
          background: #00b894;
        }

        .save-button:disabled {
          background: #a0a0a0;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .save-button:hover:not(:disabled) {
          background: #00a383;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .cancel-button {
          background: #636e72;
        }

        .cancel-button:hover {
          background: #535c60;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .modal-content {
            max-width: 95%;
            padding: 15px;
          }

          .button-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .left-buttons,
          .right-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }

          .button-bar button {
            padding: 10px 15px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .modal-header h2 {
            font-size: 1.2rem;
          }
          .modal-description {
            font-size: 12px;
          }
          .button-bar button {
            padding: 8px 12px;
            font-size: 13px;
          }
          .left-buttons,
          .right-buttons {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

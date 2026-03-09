'use client';

import { useState, useEffect } from 'react';

export default function NovoClienteConfigModal({ isOpen, onClose, envData, onSave }) {
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[NovoClienteConfigModal] Prop envData recebida:', envData);
    if (envData && typeof envData === 'object') {
      // Formata o JSON com indentação para exibir no textarea
      const jsonString = JSON.stringify(envData, null, 2);
      setConfigJson(jsonString);
      console.log('[NovoClienteConfigModal] JSON config definido:', jsonString.substring(0, 200) + '...');
    } else {
      console.log('[NovoClienteConfigModal] envData inválido ou não é objeto.');
      setConfigJson('{}');
    }
  }, [envData]);

  const handleSave = async () => {
    console.log('[NovoClienteConfigModal] handleSave chamado.');
    setError(null);
    setLoading(true);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(configJson);
      } catch (parseError) {
        throw new Error('JSON inválido. Verifique a sintaxe.');
      }

      await onSave(parsedData);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      setError('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  console.log('[NovoClienteConfigModal] Renderizando. configJson:', configJson ? 'loaded' : 'empty');

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
          <h2>Etapa 2: Configure o Cliente</h2>
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
            spellCheck={false}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '20px',
          borderTop: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Espaço reservado para possíveis botões futuros à esquerda */}
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
              Voltar
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
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

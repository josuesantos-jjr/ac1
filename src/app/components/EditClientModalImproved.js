'use client';

import { useState, useEffect } from 'react';
import ListasModal from './ListasModal.js';
import RegrasDisparoModal from './RegrasDisparoModal.js';
import FollowUpConfigModal from './FollowUpConfigModal.js';
import GatilhosConfigModal from './GatilhosConfigModal.js';
import InputWithAI from './InputWithAI.js';

export default function EditClientModalImproved({ isOpen, onClose, clientId, onSave }) {
  const [showListasModal, setShowListasModal] = useState(false);
  const [showRegrasModal, setShowRegrasModal] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [showGatilhosModal, setShowGatilhosModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

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
          setFormData(data);
        })
        .catch((err) => {
          console.error('Error loading client config:', err);
          setError('Erro ao carregar configuração do cliente: ' + err.message);
        });
    }
  }, [isOpen, clientId]);

  const addNewField = () => {
    const newFieldName = prompt('Nome do novo campo:');
    if (newFieldName && newFieldName.trim()) {
      const fieldName = newFieldName.trim();
      if (formData[fieldName] !== undefined) {
        alert('Campo já existe!');
        return;
      }
      setFormData(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const addNestedField = (parentKey) => {
    const newFieldName = prompt('Nome do novo campo aninhado:');
    if (newFieldName && newFieldName.trim()) {
      const fieldName = newFieldName.trim();
      if (formData[parentKey] && formData[parentKey][fieldName] !== undefined) {
        alert('Campo já existe!');
        return;
      }
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [fieldName]: ''
        }
      }));
    }
  };

  const deleteField = (key, parentKey = null) => {
    if (!confirm(`Tem certeza que deseja excluir o campo "${key}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    if (parentKey) {
      setFormData(prev => {
        const newData = { ...prev };
        if (newData[parentKey]) {
          delete newData[parentKey][key];
        }
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createChangeHandler = (name) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (parentKey, nestedKey) => (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [nestedKey]: value
      }
    }));
  };

  const handleArrayItemChange = (arrayKey, itemIndex, itemKey) => (e) => {
    const { value } = e.target;
    setFormData(prev => {
      const newArray = [...prev[arrayKey]];
      if (itemKey !== null && typeof newArray[itemIndex] === 'object' && newArray[itemIndex] !== null) {
        // Editando uma propriedade específica de um objeto dentro do array
        newArray[itemIndex] = {
          ...newArray[itemIndex],
          [itemKey]: value
        };
      } else {
        // Editando um item simples do array (string/number)
        newArray[itemIndex] = value;
      }
      return {
        ...prev,
        [arrayKey]: newArray
      };
    });
  };

  const handleToggleCollapse = (key) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('Salvando dados do cliente:', { clientId, formData });

    try {
      const saveConfigResponse = await fetch('/api/create-client-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'salvarDadosNoEnv',
          novoClienteId: clientId,
          dados: formData,
        }),
      });

      if (!saveConfigResponse.ok) {
        let errorDetail = `Erro HTTP: ${saveConfigResponse.status}`;
        try {
          const errorBody = await saveConfigResponse.text();
          errorDetail += ` - Detalhes: ${errorBody}`;
        } catch (readError) {
          errorDetail += ' - Não foi possível ler detalhes do erro.';
        }
        throw new Error(`Erro ao salvar configurações: ${errorDetail}`);
      }

      const saveConfigResult = await saveConfigResponse.json();
      console.log('Client config saved successfully:', saveConfigResult);

      alert('Configuração salva com sucesso!');
      onSave(clientId);
      onClose();

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        maxWidth: '1000px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0' }}>Editar Configuração do Cliente (Melhorado)</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Interface aprimorada com campos dinâmicos e altura mínima de 3 linhas
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#fff5f5',
            color: '#c92a2a',
            borderRadius: '6px',
            border: '1px solid #ffc9c9'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Botão para adicionar novo campo */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={addNewField}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➕ Adicionar Novo Campo
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {Object.entries(formData)
              .filter(([key]) => key !== 'qr_code' && key !== 'GEMINI_LINK')
              .map(([key, value]) => (
                <div style={{
                  marginBottom: '20px',
                  padding: '15px',
                  borderRadius: '6px',
                  background: '#f8f9fa',
                  position: 'relative'
                }} key={key}>
                  {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '10px',
                        background: '#e9ecef',
                        borderRadius: '4px',
                        marginBottom: collapsedSections[key] ? 0 : '15px'
                      }}
                      onClick={() => handleToggleCollapse(key)}
                    >
                      <label style={{ margin: 0, fontWeight: 'bold' }}>{key}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addNestedField(key);
                          }}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Adicionar campo aninhado"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(key);
                          }}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Excluir campo"
                        >
                          ×
                        </button>
                        <span style={{
                          fontSize: '1.2rem',
                          transition: 'transform 0.2s',
                          transform: collapsedSections[key] ? 'rotate(-90deg)' : 'rotate(0deg)'
                        }}>
                          {collapsedSections[key] ? '▶' : '▼'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ margin: 0, fontWeight: 'bold' }}>{key}</label>
                      <button
                        type="button"
                        onClick={() => deleteField(key)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Excluir campo"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                    !collapsedSections[key] && (
                      <div style={{ padding: '10px' }}>
                        {Object.entries(value).map(([nestedKey, nestedValue]) => (
                          <div key={nestedKey} style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <label style={{ fontWeight: '500', fontSize: '13px' }}>{nestedKey}</label>
                              <button
                                type="button"
                                onClick={() => deleteField(nestedKey, key)}
                                style={{
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '16px',
                                  height: '16px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Excluir campo aninhado"
                              >
                                ×
                              </button>
                            </div>
                            <InputWithAI
                              fieldName={`${key} > ${nestedKey}`}
                              value={nestedValue || ''}
                              onChange={handleNestedChange(key, nestedKey)}
                              clientId={clientId}
                              type="textarea"
                              rows={3}
                              placeholder={`Valor para ${nestedKey}`}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  ) : Array.isArray(value) ? (
                    <div>
                      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                        Array com {value.length} item(s) - Campos editáveis:
                      </div>
                      {value.map((item, index) => (
                        <div key={index} style={{
                          marginBottom: '15px',
                          padding: '15px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          background: '#f8f9fa'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '10px',
                            color: '#495057'
                          }}>
                            Item {index + 1}
                          </div>
                          {typeof item === 'object' && item !== null ? (
                            Object.entries(item).map(([itemKey, itemValue]) => (
                              <div key={itemKey} style={{ marginBottom: '12px' }}>
                                <label style={{
                                  fontWeight: '600',
                                  fontSize: '13px',
                                  display: 'block',
                                  marginBottom: '6px',
                                  color: '#343a40'
                                }}>
                                  {itemKey}
                                </label>
                                <InputWithAI
                                  fieldName={`Array ${key} > Item ${index + 1} > ${itemKey}`}
                                  value={itemValue || ''}
                                  onChange={handleArrayItemChange(key, index, itemKey)}
                                  clientId={clientId}
                                  type="textarea"
                                  rows={Math.max(3, itemKey.includes('PROMPT') || itemKey.includes('MENSAGEM') ? 8 : 3)}
                                  placeholder={`Valor para ${itemKey}`}
                                />
                              </div>
                            ))
                          ) : (
                            <InputWithAI
                              fieldName={`Array ${key} > Item ${index + 1}`}
                              value={item || ''}
                              onChange={handleArrayItemChange(key, index, null)}
                              clientId={clientId}
                              type="textarea"
                              rows={3}
                              placeholder={`Valor para item ${index + 1}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <InputWithAI
                      fieldName={key}
                      value={value || ''}
                      onChange={createChangeHandler(key)}
                      clientId={clientId}
                      type="textarea"
                      rows={Math.max(3, key.includes('PROMPT') || key.includes('MENSAGEM') ? 6 : 3)}
                      placeholder={`Valor para ${key}`}
                    />
                  )}
                </div>
              ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid #e9ecef',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowListasModal(true)}
                style={{
                  padding: '10px 15px',
                  background: '#0984e3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Listas
              </button>
              <button
                type="button"
                onClick={() => setShowRegrasModal(true)}
                style={{
                  padding: '10px 15px',
                  background: '#ff7f50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Regras de Disparo
              </button>
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(true)}
                style={{
                  padding: '10px 15px',
                  background: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Editar FollowUp
              </button>
              <button
                type="button"
                onClick={() => setShowGatilhosModal(true)}
                style={{
                  padding: '10px 15px',
                  background: '#a29bfe',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Configurar Gatilhos
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? '#a0a0a0' : '#00b894',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ListasModal
        isOpen={showListasModal}
        onClose={() => setShowListasModal(false)}
        clientId={clientId}
        clienteSequencialId={formData.CLIENTE_ID}
      />

      <RegrasDisparoModal
        isOpen={showRegrasModal}
        onClose={() => setShowRegrasModal(false)}
        clientId={clientId}
        clienteSequencialId={formData.CLIENTE_ID}
      />

      <FollowUpConfigModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        clientId={clientId}
        clienteSequencialId={formData.CLIENTE_ID}
      />

      <GatilhosConfigModal
        isOpen={showGatilhosModal}
        onClose={() => setShowGatilhosModal(false)}
        clientId={clientId}
        clienteSequencialId={formData.CLIENTE_ID}
      />
    </div>
  );
}
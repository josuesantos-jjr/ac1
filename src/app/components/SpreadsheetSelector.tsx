'use client';

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { CRMContact } from '../../backend/service/crmDataService';

// Configurar react-modal para o app
if (typeof window !== 'undefined') {
  try {
    Modal.setAppElement('#__next');
  } catch (error) {
    Modal.setAppElement('body');
  }
}

interface SpreadsheetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSpreadsheetSelected: (spreadsheetId: string, mappings: FieldMapping[]) => void;
}

interface GoogleSpreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface FieldMapping {
  field: keyof CRMContact;
  column: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date';
}

const FIELDS: FieldMapping[] = [
  { field: 'id', column: '', required: true, dataType: 'string' },
  { field: 'nome', column: '', required: true, dataType: 'string' },
  { field: 'telefone', column: '', required: true, dataType: 'string' },
  { field: 'etapaFunil', column: '', required: true, dataType: 'string' },
  { field: 'lead', column: '', required: false, dataType: 'string' },
  { field: 'email', column: '', required: false, dataType: 'string' },
  { field: 'tags', column: '', required: false, dataType: 'string' },
  { field: 'valorEstimado', column: '', required: false, dataType: 'number' },
  { field: 'resumoParaAtendente', column: '', required: false, dataType: 'string' },
  { field: 'dataCriacao', column: '', required: false, dataType: 'date' },
];

const SpreadsheetSelector: React.FC<SpreadsheetSelectorProps> = ({
  isOpen,
  onClose,
  onSpreadsheetSelected
}) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheet[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('');
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [mappings, setMappings] = useState<FieldMapping[]>(FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar planilhas existentes
  useEffect(() => {
    if (isOpen && mode === 'select') {
      loadSpreadsheets();
    }
  }, [isOpen, mode]);

  // Gerar nome padrão para nova planilha e preencher mapeamento automático
  useEffect(() => {
    if (mode === 'create') {
      const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');
      setNewSpreadsheetName(`Clientes_${today}`);
    }

    // Preencher mapeamento automático com colunas padrão (A, B, C, etc.)
    const autoMappings = FIELDS.map((field, index) => ({
      ...field,
      column: String.fromCharCode(65 + index) // A, B, C, D, etc.
    }));
    setMappings(autoMappings);
  }, [mode]);

  const loadSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/google/spreadsheets');

      if (response.data.authenticated === false) {
        setError('Usuário não autenticado. Faça login no Google primeiro.');
        return;
      }

      setSpreadsheets(response.data.spreadsheets || []);
    } catch (error: any) {
      console.error('Erro ao carregar planilhas:', error);
      if (error.response?.status === 401) {
        setError('Usuário não autenticado. Faça login no Google primeiro.');
      } else {
        setError(error.response?.data?.error || 'Erro ao carregar planilhas do Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateMappings = (): boolean => {
    // Verificar campos obrigatórios
    const requiredFields = mappings.filter(m => m.required);
    const missingRequired = requiredFields.filter(m => !m.column.trim());

    if (missingRequired.length > 0) {
      setError(`Campos obrigatórios não mapeados: ${missingRequired.map(m => m.field).join(', ')}`);
      return false;
    }

    // Verificar duplicatas
    const columns = mappings.filter(m => m.column.trim()).map(m => m.column.toLowerCase());
    const duplicates = columns.filter((col, index) => columns.indexOf(col) !== index);

    if (duplicates.length > 0) {
      setError(`Colunas duplicadas: ${duplicates.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!validateMappings()) return;

    setLoading(true);
    setError(null);
    try {
      let spreadsheetId: string;

      if (mode === 'create') {
        // Criar nova planilha
        const response = await axios.post('/api/google/spreadsheets', {
          name: newSpreadsheetName
        });

        if (response.data.authenticated === false) {
          setError('Usuário não autenticado. Faça login no Google primeiro.');
          return;
        }

        spreadsheetId = response.data.spreadsheet.id;
      } else {
        spreadsheetId = selectedSpreadsheet;
      }

      onSpreadsheetSelected(spreadsheetId, mappings);
      onClose();
    } catch (error: any) {
      console.error('Erro ao confirmar seleção:', error);
      if (error.response?.status === 401) {
        setError('Usuário não autenticado. Faça login no Google primeiro.');
      } else {
        setError(error.response?.data?.error || 'Erro ao configurar planilha');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (field: keyof CRMContact, column: string) => {
    setMappings(prev => prev.map(m =>
      m.field === field ? { ...m, column } : m
    ));
    setError(null); // Limpar erro ao alterar
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
          width: '90%',
          maxWidth: '800px',
          height: '80%',
          padding: '20px',
          borderRadius: '8px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        },
      }}
      contentLabel="Spreadsheet Selector"
    >
      <div className="spreadsheet-selector">
        <div className="header">
          <h3>📊 Selecionar Planilha Google Sheets</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* Seleção de modo */}
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === 'select' ? 'active' : ''}`}
            onClick={() => setMode('select')}
          >
            📋 Selecionar Planilha Existente
          </button>
          <button
            className={`mode-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            ➕ Criar Nova Planilha
          </button>
        </div>

        <div className="content">
          {mode === 'select' ? (
            <div className="spreadsheet-list">
              <h4>Planilhas Disponíveis:</h4>
              {loading ? (
                <div className="loading">Carregando...</div>
              ) : (
                <div className="spreadsheets">
                  {spreadsheets.map(sheet => (
                    <div
                      key={sheet.id}
                      className={`spreadsheet-item ${selectedSpreadsheet === sheet.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSpreadsheet(sheet.id)}
                    >
                      <div className="sheet-info">
                        <h5>{sheet.name}</h5>
                        <span className="sheet-date">
                          Modificado: {new Date(sheet.modifiedTime).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {selectedSpreadsheet === sheet.id && <span className="checkmark">✅</span>}
                    </div>
                  ))}
                  {spreadsheets.length === 0 && (
                    <p className="no-sheets">Nenhuma planilha encontrada</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="create-spreadsheet">
              <h4>Criar Nova Planilha:</h4>
              <div className="form-group">
                <label>Nome da Planilha:</label>
                <input
                  type="text"
                  value={newSpreadsheetName}
                  onChange={(e) => setNewSpreadsheetName(e.target.value)}
                  placeholder="Ex: Clientes_Janeiro_2024"
                />
              </div>
            </div>
          )}

          {/* Mapeamento de campos */}
          <div className="field-mapping">
            <h4>🔗 Mapeamento de Campos:</h4>
            <p>Associe as colunas da planilha aos campos dos dados dos clientes:</p>

            <div className="mapping-grid">
              {mappings.map(mapping => (
                <div key={mapping.field} className="mapping-row">
                  <div className="field-info">
                    <span className="field-name">{mapping.field}</span>
                    {mapping.required && <span className="required">*</span>}
                    <span className="field-type">({mapping.dataType})</span>
                  </div>
                  <div className="column-input">
                    <input
                      type="text"
                      value={mapping.column}
                      onChange={(e) => updateMapping(mapping.field, e.target.value)}
                      placeholder={`Ex: Coluna ${String.fromCharCode(65 + mappings.indexOf(mapping))}`}
                      className={mapping.required && !mapping.column.trim() ? 'error' : ''}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>

        <div className="footer">
          <button onClick={onClose} className="cancel-button">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="confirm-button"
            disabled={loading || (mode === 'select' && !selectedSpreadsheet) || (mode === 'create' && !newSpreadsheetName.trim())}
          >
            {loading ? 'Configurando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .spreadsheet-selector {
          display: flex;
          flex-direction: column;
          height: 100%;
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
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .mode-button {
          flex: 1;
          padding: 12px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .mode-button.active {
          border-color: #007bff;
          background: #e3f2fd;
          color: #007bff;
        }

        .content {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .spreadsheet-list h4,
        .create-spreadsheet h4,
        .field-mapping h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .spreadsheets {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .spreadsheet-item {
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }

        .spreadsheet-item:hover,
        .spreadsheet-item.selected {
          border-color: #007bff;
          background: #f8f9fa;
        }

        .sheet-info h5 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }

        .sheet-date {
          font-size: 12px;
          color: #666;
        }

        .checkmark {
          font-size: 18px;
        }

        .no-sheets {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }

        .create-spreadsheet {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .field-mapping {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .mapping-grid {
          display: grid;
          grid-template-columns: 1fr 150px;
          gap: 10px;
          margin-top: 15px;
        }

        .mapping-row {
          display: contents;
        }

        .field-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: white;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .field-name {
          font-weight: bold;
          color: #333;
        }

        .required {
          color: #dc3545;
          font-weight: bold;
        }

        .field-type {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .column-input input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .column-input input.error {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .error-message {
          margin-top: 10px;
          padding: 10px;
          background: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }

        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
        }

        .cancel-button,
        .confirm-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .confirm-button {
          background: #28a745;
          color: white;
        }

        .confirm-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
      `}</style>
    </Modal>
  );
};

export default SpreadsheetSelector;
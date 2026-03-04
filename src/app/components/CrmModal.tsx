'use client';

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import CrmSpreadsheetView from './CrmSpreadsheetView';
import CrmKanbanView from './CrmKanbanView';
import CrmAnalyticsView from './CrmAnalyticsView';
import CrmCalendarView from './CrmCalendarView';
import GoogleSheetsAuth from './GoogleSheetsAuth';
import SpreadsheetSelector from './SpreadsheetSelector';
import ConversasModal from './ConversasModal';
import ContactDetailsModal from './ContactDetailsModal';
import { CRMContact } from '../../backend/service/crmDataService';

// Configurar react-modal para o app (usar body como fallback)
if (typeof window !== 'undefined') {
  try {
    Modal.setAppElement('#__next');
  } catch (error) {
    // Fallback para body se #__next não existir
    Modal.setAppElement('body');
  }
}

// Estilos do modal
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '95%',
    height: '90%',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

interface CrmModalProps {
   isOpen: boolean;
   onClose: () => void;
   clientId?: string | null;
   chatId?: string;
 }

type ViewType = 'spreadsheet' | 'kanban' | 'analytics' | 'calendar';

// Componente Modal de Edição de Funil
const EditFunilModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  clientId?: string | null;
  onSave: () => void;
}> = ({ isOpen, onClose, clientId, onSave }) => {
  const [etapas, setEtapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      loadEtapas();
    }
  }, [isOpen, clientId]);

  const loadEtapas = async () => {
    if (!clientId) return;
    try {
      const response = await axios.get(`/api/client-config?clientId=${clientId}`);
      if (response.data.GEMINI_PROMPT && response.data.GEMINI_PROMPT[0] && response.data.GEMINI_PROMPT[0]["Funil de vendas"] && Array.isArray(response.data.GEMINI_PROMPT[0]["Funil de vendas"]) && response.data.GEMINI_PROMPT[0]["Funil de vendas"].length > 0) {
        setEtapas(response.data.GEMINI_PROMPT[0]["Funil de vendas"]);
      } else {
        setEtapas([
          { nome: 'Prospecto', descricao: 'Contato inicial identificado' },
          { nome: 'Contato Inicial', descricao: 'Primeira interação estabelecida' },
          { nome: 'Qualificação', descricao: 'Informações básicas coletadas' },
          { nome: 'Proposta', descricao: 'Apresentação de imóveis e propostas' },
          { nome: 'Fechamento', descricao: 'Negociação final e fechamento' },
          { nome: 'Pós-Venda', descricao: 'Acompanhamento após a venda' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  const handleAddEtapa = () => {
    setEtapas([...etapas, { nome: 'Nova Etapa', descricao: '' }]);
  };

  const handleRemoveEtapa = (index: number) => {
    const newEtapas = etapas.filter((_, i) => i !== index);
    setEtapas(newEtapas);
  };

  const handleUpdateEtapa = (index: number, field: string, value: string) => {
    const newEtapas = [...etapas];
    newEtapas[index] = { ...newEtapas[index], [field]: value };
    setEtapas(newEtapas);
  };

  const handleMoveEtapa = (index: number, direction: 'up' | 'down') => {
    const newEtapas = [...etapas];
    if (direction === 'up' && index > 0) {
      [newEtapas[index], newEtapas[index - 1]] = [newEtapas[index - 1], newEtapas[index]];
    } else if (direction === 'down' && index < newEtapas.length - 1) {
      [newEtapas[index], newEtapas[index + 1]] = [newEtapas[index + 1], newEtapas[index]];
    }
    setEtapas(newEtapas);
  };

  const handleSave = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      await axios.post('/api/update-client-funil', {
        clientId,
        funil: etapas
      });
      onSave();
    } catch (error) {
      console.error('Erro ao salvar funil:', error);
      alert('Erro ao salvar funil');
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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #dee2e6',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#495057' }}>
            Editar Funil de Vendas
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleAddEtapa}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ➕ Adicionar Etapa
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {etapas.map((etapa, index) => (
            <div key={index} style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '16px',
              background: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6c757d', minWidth: '20px' }}>
                  {index + 1}.
                </span>

                <button
                  onClick={() => handleMoveEtapa(index, 'up')}
                  disabled={index === 0}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    opacity: index === 0 ? 0.5 : 1
                  }}
                >
                  ⬆️
                </button>

                <button
                  onClick={() => handleMoveEtapa(index, 'down')}
                  disabled={index === etapas.length - 1}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: index === etapas.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: index === etapas.length - 1 ? 0.5 : 1
                  }}
                >
                  ⬇️
                </button>

                <button
                  onClick={() => handleRemoveEtapa(index)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  🗑️
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
                    Nome da Etapa
                  </label>
                  <input
                    type="text"
                    value={etapa.nome}
                    onChange={(e) => handleUpdateEtapa(index, 'nome', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
                    Descrição da Etapa
                  </label>
                  <textarea
                    value={etapa.descricao}
                    onChange={(e) => handleUpdateEtapa(index, 'descricao', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #dee2e6'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Funil'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CrmModal: React.FC<CrmModalProps> = ({ isOpen, onClose, clientId, chatId }) => {
   const [currentView, setCurrentView] = useState<ViewType>('spreadsheet');
   const [contacts, setContacts] = useState<CRMContact[]>([]);
   const [loading, setLoading] = useState(false);
   const [crmConfig, setCrmConfig] = useState<any>(null);
   const [googleAuth, setGoogleAuth] = useState({
     authenticated: false,
     authUrl: null as string | null,
   });
   const [showGoogleAuth, setShowGoogleAuth] = useState(false);
   const [showSpreadsheetSelector, setShowSpreadsheetSelector] = useState(false);
    const [showConversasModal, setShowConversasModal] = useState(false);
   const [toastMessage, setToastMessage] = useState<string | null>(null);
   const [showContactDetails, setShowContactDetails] = useState(false);
   const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
   const [showEditFunil, setShowEditFunil] = useState(false);

  // Carregar contatos
  const loadContacts = async () => {
    setLoading(true);
    try {
      const url = clientId ? `/api/crm/contacts?clientId=${encodeURIComponent(clientId)}` : '/api/crm/contacts';
      const response = await axios.get(url);
      setContacts(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar configuração CRM do cliente
  const loadCrmConfig = async () => {
    if (!clientId) return;

    try {
      const response = await axios.get(`/api/crm/config?clientId=${encodeURIComponent(clientId)}`);
      setCrmConfig(response.data);
    } catch (error) {
      console.error('Erro ao carregar configuração CRM:', error);
      setCrmConfig(null);
    }
  };

  // Verificar autenticação Google
  const checkGoogleAuth = async () => {
    try {
      const response = await axios.get('/api/auth/google');
      setGoogleAuth({
        authenticated: response.data.authenticated,
        authUrl: response.data.authUrl,
      });
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  };

  // Iniciar autenticação Google
  const handleGoogleAuth = () => {
    setShowGoogleAuth(true);
  };

  // Callback de sucesso da autenticação
  const handleAuthSuccess = () => {
    setGoogleAuth({ authenticated: true, authUrl: null });
    setToastMessage('✅ Conta Google conectada com sucesso!');
    setTimeout(() => setToastMessage(null), 3000);
    checkGoogleAuth(); // Recarregar status
  };

  // Logout Google
  const handleGoogleLogout = async () => {
    try {
      await axios.delete('/api/auth/google');
      setGoogleAuth({ authenticated: false, authUrl: null });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Importar dados de dados.json
  const handleImport = async () => {
    if (!confirm('Deseja importar dados dos arquivos dados.json dos clientes?')) return;

    setLoading(true);
    try {
      // Importar de todos os clientes ativos
      const clientes = ['CMW']; // TODO: detectar automaticamente

      for (const clientePath of clientes) {
        await axios.post('/api/crm/import', { clientePath });
      }

      await loadContacts();
      alert('Importação concluída!');
    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Erro na importação');
    } finally {
      setLoading(false);
    }
  };

  // Exportar dados
  const handleExport = (format: 'csv' | 'json') => {
    const url = `/api/crm/export?format=${format}`;
    window.open(url, '_blank');
  };

  // Sincronizar com Google Sheets
  const handleSync = async (direction: 'fromSheets' | 'toSheets') => {
    if (!googleAuth.authenticated) {
      alert('Faça login no Google primeiro');
      return;
    }

    if (!clientId) {
      alert('Cliente não especificado');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/crm/sync', { direction, clientId });
      await loadContacts();
      alert('Sincronização concluída!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro na sincronização');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      loadCrmConfig();
      checkGoogleAuth();
    }
  }, [isOpen, clientId]);

  // Selecionar planilha
  const handleSelectSpreadsheet = () => {
    setShowSpreadsheetSelector(true);
  };

  // Callback da seleção de planilha
  const handleSpreadsheetSelected = async (spreadsheetId: string, mappings: any[]) => {
    if (!clientId) {
      setToastMessage('❌ Erro: Cliente não especificado');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      // Atualizar configuração CRM do cliente
      const updatedConfig = {
        ...crmConfig,
        spreadsheetId,
        mappings,
        lastUpdated: new Date().toISOString()
      };

      await axios.post('/api/crm/config', {
        clientId,
        config: updatedConfig
      });

      setCrmConfig(updatedConfig);
      setToastMessage('📊 Planilha configurada com sucesso!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar configuração CRM:', error);
      setToastMessage('❌ Erro ao salvar configuração');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Atualizar configuração de sincronização automática
  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (!clientId) return;

    try {
      const updatedConfig = {
        ...crmConfig,
        autoSync: enabled,
        lastUpdated: new Date().toISOString()
      };

      await axios.post('/api/crm/config', {
        clientId,
        config: updatedConfig
      });

      setCrmConfig(updatedConfig);
      setToastMessage(`🔄 Sincronização automática ${enabled ? 'ativada' : 'desativada'}!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      setToastMessage('❌ Erro ao atualizar configuração');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={modalStyles}
        contentLabel="CRM Modal"
      >
        <div className="crm-modal">
          {/* Header */}
          <div className="crm-header">
            <h2>CRM - Sistema de Gestão de Contatos</h2>
            <button onClick={onClose} className="close-button">×</button>
          </div>

        {/* Barra de ferramentas */}
        <div className="crm-toolbar">
          {/* Abas de visualização */}
          <div className="view-tabs">
            <button
              className={currentView === 'spreadsheet' ? 'active' : ''}
              onClick={() => setCurrentView('spreadsheet')}
            >
              📊 Planilha
            </button>
            <button
              className={currentView === 'kanban' ? 'active' : ''}
              onClick={() => setCurrentView('kanban')}
            >
              📋 Kanban
            </button>
            <button
              className={currentView === 'analytics' ? 'active' : ''}
              onClick={() => setCurrentView('analytics')}
            >
              📈 Análises
            </button>
            <button
              className={currentView === 'calendar' ? 'active' : ''}
              onClick={() => setCurrentView('calendar')}
            >
              📅 Calendário
            </button>
          </div>

          {/* Controles */}
          <div className="controls">
            {/* Google Auth */}
            <div className="google-auth">
              {googleAuth.authenticated ? (
                <div>
                  <span style={{ color: 'green' }}>✅ Conectado ao Google</span>
                  <button onClick={handleGoogleLogout} className="btn-secondary">
                    Desconectar
                  </button>
                </div>
              ) : (
                <button onClick={handleGoogleAuth} className="btn-primary">
                  🔗 Conectar Google Sheets
                </button>
              )}
            </div>

            {/* Ações */}
            <button onClick={handleImport} disabled={loading} className="btn-secondary">
              📥 Importar dados.json
            </button>

            {clientId && (
              <>
                <button
                  onClick={() => setShowConversasModal(true)}
                  className="btn-secondary"
                  title="Visualizar conversas do cliente"
                >
                  👁️ Visualizar Conversas
                </button>
                <button
                  onClick={() => setShowEditFunil(true)}
                  className="btn-secondary"
                  title="Editar etapas do funil de vendas"
                >
                  📋 Editar Funil
                </button>
              </>
            )}

            <div className="dropdown">
              <button className="btn-secondary">📤 Exportar ▼</button>
              <div className="dropdown-content">
                <button onClick={() => handleExport('csv')}>CSV</button>
                <button onClick={() => handleExport('json')}>JSON</button>
              </div>
            </div>

            {googleAuth.authenticated && (
              <>
                <button onClick={handleSelectSpreadsheet} className="btn-primary">
                  📊 Selecionar Planilha
                </button>
                <div className="dropdown">
                  <button className="btn-secondary">🔄 Sincronizar ▼</button>
                  <div className="dropdown-content">
                    <button onClick={() => handleSync('fromSheets')}>
                      Do Google Sheets
                    </button>
                    <button onClick={() => handleSync('toSheets')}>
                      Para Google Sheets
                    </button>
                  </div>
                </div>
                {/* Controle de sincronização automática */}
                <div className="auto-sync-control">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={crmConfig?.autoSync !== false}
                      onChange={(e) => handleAutoSyncToggle(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    🔄 Sincronização automática
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="crm-content">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            <>
              {currentView === 'spreadsheet' && (
                <CrmSpreadsheetView
                  contacts={contacts}
                  onUpdateContact={loadContacts}
                />
              )}
              {currentView === 'kanban' && (
                <CrmKanbanView
                  contacts={contacts}
                  onUpdateContact={loadContacts}
                  clientId={clientId}
                />
              )}
              {currentView === 'analytics' && (
                <CrmAnalyticsView contacts={contacts} />
              )}
              {currentView === 'calendar' && (
                <CrmCalendarView
                  contacts={contacts}
                  onUpdateContact={loadContacts}
                />
              )}
            </>
          )}
        </div>
      </div>
      </Modal>

      {/* Componentes filhos */}
      <GoogleSheetsAuth
        isOpen={showGoogleAuth}
        onClose={() => setShowGoogleAuth(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <SpreadsheetSelector
        isOpen={showSpreadsheetSelector}
        onClose={() => setShowSpreadsheetSelector(false)}
        onSpreadsheetSelected={handleSpreadsheetSelected}
      />

      <ConversasModal
        isOpen={showConversasModal}
        onClose={() => setShowConversasModal(false)}
        clientId={clientId}
      />

      <ContactDetailsModal
        isOpen={showContactDetails}
        onClose={() => {
          setShowContactDetails(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
      />

      {/* Modal de Edição de Funil */}
      {showEditFunil && (
        <EditFunilModal
          isOpen={showEditFunil}
          onClose={() => setShowEditFunil(false)}
          clientId={clientId}
          onSave={() => {
            // Recarregar configuração e atualizar kanban
            loadCrmConfig();
            loadContacts();
            setShowEditFunil(false);
            setToastMessage('✅ Funil de vendas atualizado com sucesso!');
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}

      <style jsx>{`
        .crm-modal {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: Arial, sans-serif;
        }

        .crm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }

        .crm-header h2 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #333;
        }

        .crm-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .view-tabs {
          display: flex;
          gap: 5px;
        }

        .view-tabs button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .view-tabs button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-primary:hover, .btn-secondary:hover {
          opacity: 0.8;
        }

        .dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-content {
          display: none;
          position: absolute;
          background-color: white;
          min-width: 160px;
          box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
          z-index: 1;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .dropdown:hover .dropdown-content {
          display: block;
        }

        .dropdown-content button {
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-content button:hover {
          background: #f8f9fa;
        }

        .crm-content {
          flex: 1;
          overflow: hidden;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          font-size: 18px;
          color: #666;
        }

        .google-auth {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default CrmModal;
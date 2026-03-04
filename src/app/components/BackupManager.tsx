'use client';

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import GoogleDriveAuth from './GoogleDriveAuth';

// Configurar react-modal para o app
if (typeof window !== 'undefined') {
  try {
    Modal.setAppElement('#__next');
  } catch (error) {
    Modal.setAppElement('body');
  }
}

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoogleDriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
  parentId?: string;
  parents?: string[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BackupRecord {
  id: string;
  name: string;
  size: number;
  createdTime: string;
  downloadUrl: string;
}

const BackupManager: React.FC<BackupManagerProps> = ({ isOpen, onClose }) => {
  const [googleAuth, setGoogleAuth] = useState({
    authenticated: false,
    scope: null as string | null
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string>('root');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'Meu Drive' }]);

  // Estado para configuração do scheduler
  const [schedulerConfig, setSchedulerConfig] = useState({
    googleFolderId: '',
    retentionDays: 30,
    enabled: true
  });
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Estados para busca de pastas
  const [searchTerm, setSearchTerm] = useState('');
  const [allFolders, setAllFolders] = useState<GoogleDriveFolder[]>([]);
  const [searchResults, setSearchResults] = useState<GoogleDriveFolder[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Carregar status inicial
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
      loadSchedulerStatus();
    }
  }, [isOpen]);

  // Carregar pastas quando autenticado
  useEffect(() => {
    if (googleAuth.authenticated && googleAuth.scope === 'drive') {
      loadFolders();
      loadAllFolders();
    }
  }, [googleAuth]);

  // Busca em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length > 2) {
        searchFolders(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/backup-google-drive?action=status');
      setGoogleAuth({
        authenticated: response.data.authenticated,
        scope: 'drive'
      });
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  };

  const loadSchedulerStatus = async () => {
    try {
      const response = await axios.get('/api/backup-scheduler');
      setSchedulerStatus(response.data);
      if (response.data.config) {
        setSchedulerConfig(response.data.config);
        setSelectedFolder(response.data.config.googleFolderId);
      }
    } catch (error) {
      console.error('Erro ao carregar status do scheduler:', error);
    }
  };

  const searchFolders = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/google/drive?action=search&q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.folders || []);
    } catch (error) {
      console.error('Erro ao buscar pastas:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadAllFolders = async () => {
    try {
      const response = await axios.get('/api/google/drive?action=list_all');
      setAllFolders(response.data.folders || []);
    } catch (error) {
      console.error('Erro ao carregar todas as pastas:', error);
      setAllFolders([]);
    }
  };

  const loadFolders = async (parentId: string = 'root') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/google/drive?action=list&parentId=${parentId}`);
      setFolders(response.data.folders || []);
      setCurrentParentId(parentId);
    } catch (error: any) {
      console.error('Erro ao carregar pastas:', error);
      setError('Erro ao carregar pastas do Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Nome da pasta é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/google/drive', {
        action: 'create_folder',
        name: newFolderName.trim(),
        parentId: currentParentId
      });

      setFolders(prev => [...prev, {
        id: response.data.folder.id,
        name: response.data.folder.name,
        modifiedTime: response.data.folder.createdTime,
        parentId: currentParentId
      }]);

      setSelectedFolder(response.data.folder.id);
      setNewFolderName('');
      setSuccessMessage('Pasta criada com sucesso!');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Erro ao criar pasta:', error);
      setError(error.response?.data?.error || 'Erro ao criar pasta');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folderId: string, folderName: string) => {
    // Atualizar breadcrumb
    setBreadcrumb(prev => {
      const existingIndex = prev.findIndex(item => item.id === folderId);
      if (existingIndex !== -1) {
        return prev.slice(0, existingIndex + 1);
      } else {
        return [...prev, { id: folderId, name: folderName }];
      }
    });

    await loadFolders(folderId);
    setSelectedFolder(''); // Limpar seleção ao navegar
  };

  const navigateToBreadcrumb = async (folderId: string) => {
    const index = breadcrumb.findIndex(item => item.id === folderId);
    if (index !== -1) {
      setBreadcrumb(prev => prev.slice(0, index + 1));
      await loadFolders(folderId);
      setSelectedFolder('');
    }
  };

  const goBack = async () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      setBreadcrumb(newBreadcrumb);
      const parentFolderId = newBreadcrumb[newBreadcrumb.length - 1].id;
      await loadFolders(parentFolderId);
      setSelectedFolder('');
    }
  };

  const loadBackups = async (folderId: string) => {
    if (!folderId) return;

    try {
      const response = await axios.get(`/api/backup-google-drive?action=list_backups&folderId=${folderId}`);
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    }
  };

  const saveSchedulerConfig = async () => {
    if (!selectedFolder) {
      setError('Selecione uma pasta para o backup automático');
      return;
    }

    setSavingConfig(true);
    setError(null);
    try {
      const configToSave = {
        ...schedulerConfig,
        googleFolderId: selectedFolder
      };

      const response = await axios.post('/api/backup-scheduler', {
        action: 'save_config',
        config: configToSave
      });

      if (response.data.success) {
        setSchedulerConfig(configToSave);
        setSuccessMessage('Configuração de backup automático salva com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);

        // Recarregar status
        loadSchedulerStatus();
      } else {
        setError(response.data.error || 'Erro ao salvar configuração');
      }
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      setError(error.response?.data?.error || 'Erro ao salvar configuração');
    } finally {
      setSavingConfig(false);
    }
  };

  const executeBackup = async () => {
    if (!selectedFolder) {
      setError('Selecione uma pasta para o backup');
      return;
    }

    setBackupLoading(true);
    setError(null);
    try {
      // Usar a API do scheduler para backup manual
      const response = await axios.post('/api/backup-scheduler', {
        action: 'execute_backup',
        folderId: selectedFolder
      });

      if (response.data.success) {
        setSuccessMessage(`Backup realizado com sucesso! Arquivo: ${response.data.fileName || 'backup-manual'}`);
        // Recarregar lista de backups e status
        loadBackups(selectedFolder);
        loadSchedulerStatus();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(response.data.error || 'Erro no backup');
      }
    } catch (error: any) {
      console.error('Erro ao executar backup:', error);
      setError(error.response?.data?.error || 'Erro ao executar backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    loadBackups(folderId);
  };

  const handleAuthSuccess = (authData: any) => {
    setGoogleAuth({
      authenticated: authData.authenticated,
      scope: authData.scope
    });
    // NÃO fechar modal aqui - deixar usuário continuar com seleção de pasta
    // setShowAuthModal(false); // REMOVIDO para manter modal aberto
  };

  return (
    <>
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
        contentLabel="Backup Manager"
      >
        <div className="backup-manager">
          <div className="header">
            <h3>💾 Gerenciador de Backup - Google Drive</h3>
            <button onClick={onClose} className="close-button">×</button>
          </div>

          <div className="content">
            {/* Status de Autenticação */}
            <div className="auth-status">
              <div className="auth-indicator">
                {googleAuth.authenticated ? (
                  <>
                    <span className="status-green">✅ Conectado ao Google Drive</span>
                    <button
                      onClick={() => setGoogleAuth({ authenticated: false, scope: null })}
                      className="disconnect-button"
                    >
                      Desconectar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="status-red">❌ Não conectado</span>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="connect-button"
                    >
                      🔗 Conectar
                    </button>
                  </>
                )}
              </div>
            </div>

            {googleAuth.authenticated && (
              <>
                {/* Navegador de Pastas */}
                <div className="folder-section">
                  <h4>📁 Navegador de Pastas:</h4>

                  {/* Barra de Busca */}
                  <div className="search-section">
                    <div className="search-input-container">
                      <input
                        type="text"
                        placeholder="🔍 Buscar pastas no Drive..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      {isSearching && <span className="search-loading">🔄</span>}
                    </div>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                      className="clear-search-button"
                      title="Limpar busca"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Resultados da Busca */}
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      <h5>🔍 Resultados da busca:</h5>
                      <div className="folder-list">
                        {searchResults.map(folder => (
                          <div key={folder.id} className="folder-item">
                            <div className="folder-content">
                              <span className="folder-icon">📁</span>
                              <span className="folder-name">{folder.name}</span>
                              <span className="folder-path">({folder.parents?.join(' > ') || 'Root'})</span>
                            </div>
                            <div className="folder-actions">
                              <button
                                onClick={() => {
                                  setSelectedFolder(folder.id);
                                  setSearchTerm('');
                                  setSearchResults([]);
                                }}
                                className={`select-button ${selectedFolder === folder.id ? 'selected' : ''}`}
                                title="Selecionar para backup"
                              >
                                {selectedFolder === folder.id ? '✓ Selecionada' : 'Selecionar'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navegação Hierárquica */}
                  {searchTerm.length <= 2 && (
                    <>
                      {/* Breadcrumb */}
                      <div className="breadcrumb">
                        {breadcrumb.map((item, index) => (
                          <span key={item.id}>
                            {index > 0 && ' > '}
                            <button
                              onClick={() => navigateToBreadcrumb(item.id)}
                              className="breadcrumb-item"
                            >
                              {item.name}
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Botão Voltar */}
                      {currentParentId !== 'root' && (
                        <div className="navigation-controls">
                          <button
                            onClick={goBack}
                            className="back-button"
                          >
                            ← Voltar
                          </button>
                        </div>
                      )}

                      {/* Lista de Pastas */}
                      <div className="folder-list">
                        {loading ? (
                          <div className="loading">Carregando pastas...</div>
                        ) : folders.length > 0 ? (
                          folders.map(folder => (
                            <div key={folder.id} className="folder-item">
                              <div className="folder-content">
                                <span className="folder-icon">📁</span>
                                <span className="folder-name">{folder.name}</span>
                              </div>
                              <div className="folder-actions">
                                <button
                                  onClick={() => navigateToFolder(folder.id, folder.name)}
                                  className="navigate-button"
                                  title="Entrar na pasta"
                                >
                                  Abrir
                                </button>
                                <button
                                  onClick={() => setSelectedFolder(folder.id)}
                                  className={`select-button ${selectedFolder === folder.id ? 'selected' : ''}`}
                                  title="Selecionar para backup"
                                >
                                  {selectedFolder === folder.id ? '✓ Selecionada' : 'Selecionar'}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-folders">Nenhuma pasta encontrada neste diretório.</div>
                        )}
                      </div>

                      {/* Criar Nova Pasta */}
                      <div className="create-folder">
                        <input
                          type="text"
                          placeholder="Nome da nova pasta"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="folder-input"
                        />
                        <button
                          onClick={createFolder}
                          disabled={loading || !newFolderName.trim()}
                          className="create-button"
                        >
                          {loading ? 'Criando...' : 'Criar Pasta'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Lista de Backups */}
                {selectedFolder && (
                  <div className="backups-section">
                    <h4>📦 Backups Existentes:</h4>
                    <div className="backups-list">
                      {backups.map(backup => (
                        <div key={backup.id} className="backup-item">
                          <div className="backup-info">
                            <span className="backup-name">{backup.name}</span>
                            <span className="backup-size">{formatFileSize(backup.size)}</span>
                            <span className="backup-date">
                              {new Date(backup.createdTime).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <a
                            href={backup.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-button"
                          >
                            ⬇️ Baixar
                          </a>
                        </div>
                      ))}
                      {backups.length === 0 && (
                        <p className="no-backups">Nenhum backup encontrado nesta pasta.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Configuração do Backup Automático */}
                <div className="scheduler-config">
                  <h4>⚙️ Configuração do Backup Automático</h4>

                  <div className="config-section">
                    <label className="config-label">
                      <input
                        type="checkbox"
                        checked={schedulerConfig.enabled}
                        onChange={(e) => setSchedulerConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      />
                      Ativar backup automático diário
                    </label>

                    <label className="config-label">
                      Retenção (dias):
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={schedulerConfig.retentionDays}
                        onChange={(e) => setSchedulerConfig(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                        className="retention-input"
                      />
                    </label>

                    <button
                      onClick={saveSchedulerConfig}
                      disabled={savingConfig || !selectedFolder}
                      className="save-config-button"
                    >
                      {savingConfig ? 'Salvando...' : '💾 Salvar Configuração'}
                    </button>
                  </div>

                  {/* Status do Scheduler */}
                  {schedulerStatus && (
                    <div className="scheduler-status">
                      <h5>📊 Status do Backup Automático</h5>
                      <div className="status-info">
                        <span className={`status-indicator ${schedulerStatus.backupExecutadoHoje ? 'success' : 'pending'}`}>
                          {schedulerStatus.backupExecutadoHoje ? '✅ Backup executado hoje' : '⏳ Aguardando próximo backup'}
                        </span>
                        {schedulerStatus.ultimoBackup && (
                          <div className="last-backup-info">
                            <strong>Último backup:</strong> {new Date(schedulerStatus.ultimoBackup.dataExecucao).toLocaleString('pt-BR')}
                            <br />
                            <strong>Tamanho:</strong> {schedulerStatus.ultimoBackup.arquivo?.tamanho ? Math.round(schedulerStatus.ultimoBackup.arquivo.tamanho / 1024 / 1024) + 'MB' : 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controles de Backup Manual */}
                <div className="backup-controls">
                  <button
                    onClick={executeBackup}
                    disabled={backupLoading || !selectedFolder}
                    className="backup-button"
                  >
                    {backupLoading ? (
                      <>
                        <div className="spinner"></div>
                        Executando Backup...
                      </>
                    ) : (
                      <>🚀 Executar Backup Manual</>
                    )}
                  </button>

                  <p className="backup-info">
                    O backup irá compactar as pastas <strong>clientes/</strong> e <strong>dados/</strong> e enviar para o Google Drive.
                    O backup automático ocorre diariamente às 00:05.
                  </p>
                </div>
              </>
            )}

            {/* Mensagens */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {successMessage && (
              <div className="success-message">
                ✅ {successMessage}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Autenticação */}
      <GoogleDriveAuth
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <style jsx>{`
        .backup-manager {
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
          overflow-y: auto;
        }

        .auth-status {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .auth-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-green {
          color: #28a745;
          font-weight: bold;
        }

        .status-red {
          color: #dc3545;
          font-weight: bold;
        }

        .connect-button, .disconnect-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .connect-button {
          background: #007bff;
          color: white;
        }

        .disconnect-button {
          background: #dc3545;
          color: white;
        }

        .folder-section, .backups-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .folder-section h4, .backups-section h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .breadcrumb {
          margin-bottom: 15px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 14px;
        }

        .breadcrumb-item {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
        }

        .breadcrumb-item:hover {
          color: #0056b3;
        }

        .navigation-controls {
          margin-bottom: 15px;
        }

        .back-button {
          padding: 6px 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .back-button:hover {
          background: #5a6268;
        }

        .folder-list {
          margin-bottom: 15px;
        }

        .folder-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .folder-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .folder-icon {
          font-size: 18px;
        }

        .folder-name {
          font-weight: 500;
          color: #333;
        }

        .folder-actions {
          display: flex;
          gap: 8px;
        }

        .navigate-button, .select-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .navigate-button {
          background: #17a2b8;
          color: white;
        }

        .navigate-button:hover {
          background: #138496;
        }

        .select-button {
          background: #ffc107;
          color: #212529;
        }

        .select-button:hover {
          background: #e0a800;
        }

        .select-button.selected {
          background: #28a745;
          color: white;
        }

        .empty-folders {
          padding: 20px;
          text-align: center;
          color: #666;
          font-style: italic;
        }

        .loading {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        .create-folder {
          display: flex;
          gap: 10px;
        }

        .folder-input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .create-button {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .create-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        /* Estilos para busca */
        .search-section {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-input-container {
          position: relative;
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .search-loading {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
        }

        .clear-search-button {
          padding: 8px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          min-width: 32px;
        }

        .clear-search-button:hover {
          background: #c82333;
        }

        .search-results {
          margin-bottom: 20px;
          padding: 15px;
          background: #fff3cd;
          border-radius: 6px;
          border: 1px solid #ffeaa7;
        }

        .search-results h5 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .folder-path {
          font-size: 12px;
          color: #666;
          margin-left: 8px;
        }

        .backups-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .backup-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .backup-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .backup-name {
          font-weight: bold;
          color: #333;
        }

        .backup-size {
          font-size: 12px;
          color: #666;
        }

        .backup-date {
          font-size: 12px;
          color: #888;
        }

        .download-button {
          padding: 6px 12px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
        }

        .no-backups {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }

        .backup-controls {
          padding: 15px;
          background: #e3f2fd;
          border-radius: 6px;
          text-align: center;
        }

        .backup-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .backup-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .backup-info {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .scheduler-config {
          padding: 15px;
          background: #f0f9ff;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .scheduler-config h4 {
          margin: 0 0 15px 0;
          color: #0066cc;
        }

        .config-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .config-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #333;
        }

        .retention-input {
          width: 80px;
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-left: 8px;
        }

        .save-config-button {
          align-self: flex-start;
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .save-config-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .scheduler-status {
          margin-top: 15px;
          padding: 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .scheduler-status h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .status-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-indicator {
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
        }

        .status-indicator.success {
          background: #d4edda;
          color: #155724;
        }

        .status-indicator.pending {
          background: #fff3cd;
          color: #856404;
        }

        .last-backup-info {
          font-size: 13px;
          color: #666;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .error-message {
          margin-top: 15px;
          padding: 12px;
          background: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          margin-top: 15px;
          padding: 12px;
          background: #d4edda;
          color: #155724;
          border-radius: 4px;
          border: 1px solid #c3e6cb;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default BackupManager;
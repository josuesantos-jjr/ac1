"use client";

import { useState, useEffect } from 'react';
// import { useSession, signOut } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import EditClientModal from '../components/EditClientModalImproved';
import StartClientModal from '../components/StartClientModal';
import InitClientModal from '../components/InitClientModal';
import NovoClienteModal from '../components/NovoClienteModal';
import DroppableSection from './DroppableSection';
import RelatoriosModal from '../components/RelatoriosModal';
import TerminalModal from '../components/TerminalModal';
import CrmModal from '../components/CrmModal';
import PM2Panel from '../components/PM2Panel'; // Importação explícita
import BackupManager from '../components/BackupManager';
import styles from '../page.module.css';
import axios from 'axios';
console.log('[Dashboard] Página do dashboard renderizada!');
export default function Dashboard() {
  // Temporariamente comentado para evitar erros durante desenvolvimento
  // const { data: session, status } = useSession();
  // const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [modelosList, setModelosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingModelos, setLoadingModelos] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [startingClientId, setStartingClientId] = useState(null);
  const [initializingClientId, setInitializingClientId] = useState(null);
  const [initializingAction, setInitializingAction] = useState(null);
  const [novoClienteModalOpen, setNovoClienteModalOpen] = useState(false);
  const [terminalModalOpen, setTerminalModalOpen] = useState(false);
  const [crmModalOpen, setCrmModalOpen] = useState(false);
  const [crmClientId, setCrmClientId] = useState(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  const [relatoriosModalOpen, setRelatoriosModalOpen] = useState(false);

  useEffect(() => {
    console.log('[Dashboard] Verificação de autenticação removida temporariamente');
  }, []);

  const fetchClientes = async () => {
    console.log("Dashboard: Iniciando fetchClientes...");
    setLoading(true);
    try {
      console.log("Dashboard: Chamando axios.post('/api/listClientes')...");
      const res = await axios.post('/api/listClientes', {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000 // Timeout reduzido para 15s
      });
      console.log("Dashboard: Resposta da API recebida:", res.status);
      console.log("Dashboard: Headers da resposta:", res.headers);
      console.log("Dashboard: Dados recebidos da API:", res.data);

      // A lógica de leitura do infoCliente.json foi movida para o backend.
      // A API /api/listClientes agora deve retornar os clientes com o nome já incluído.
      console.log('Dashboard: Dados recebidos da API:', res.data);
      console.log('Dashboard: Tipo dos dados:', typeof res.data);
      console.log('Dashboard: É array?', Array.isArray(res.data));

      if (Array.isArray(res.data)) {
        setClientes(res.data);
        console.log(`Dashboard: ${res.data.length} clientes definidos no estado.`);
      } else {
        console.error('Dashboard: Dados recebidos não são um array:', res.data);
        setClientes([]);
      }
    } catch (error) {
      console.error('Dashboard: Erro ao buscar clientes:', error);

      // Melhorar tratamento de erro para timeout específico
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Dashboard: Timeout na requisição - API pode estar sobrecarregada');
        // Em caso de timeout, definir lista vazia temporariamente
        setClientes([]);
      } else {
        console.error('Dashboard: Erro detalhes:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      // Assumindo que setError é uma função definida em outro lugar ou que deve ser adicionada
      // setError('Falha ao carregar clientes. Verifique o console.');
    } finally {
      console.log("Dashboard: Finalizando fetchClientes (finally).");
      setLoading(false);
    }
  };

  // Função para buscar modelos
  const fetchModelos = async () => {
    setLoadingModelos(true);
    try {
      console.log('[Dashboard] Buscando modelos da API...');
      const res = await axios.get('/api/list-models');
      console.log('[Dashboard] Modelos recebidos da API:', res.data.models);
      setModelosList(res.data.models || []);
    } catch (error) {
      console.error('[Dashboard] Erro ao buscar modelos:', error);
      setModelosList([]);
    } finally {
      setLoadingModelos(false);
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchModelos();
  }, []);

  const handleEditarCliente = (clientId) => {
    setSelectedClientId(clientId);
    setEditModalOpen(true);
  };

  const handleSaveConfig = async (newClientId) => {
    console.log('[Dashboard] handleSaveConfig chamado. Novo Cliente ID:', newClientId);
    // Após salvar a configuração do novo cliente, atualiza a lista de clientes
    
    await fetchClientes();
    // Não fecha o modal aqui, o NovoClienteModal gerencia o fechamento após o salvamento final
    try {
      const res = await axios.post('/api/listClientes');
      setClientes(res.data);

      if (newClientId && newClientId !== selectedClientId) {
        setSelectedClientId(null);
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar lista de clientes:', error);
    }
    
  };

  const handleIniciarCliente = async (clientName, folderType, action) => {
    try {
      const clientId = clientName;
      
      console.log(`[Dashboard] Iniciando ação ${action} para cliente ${clientName}`);
      
      // Simples e direto
      const response = await axios.post('/api/client-control', { clientId, action });
      console.log('[Dashboard] Resposta recebida:', response.data);
      
      await fetchClientes();
      
      if (action === 'start') {
        setInitializingClientId(clientId);
        setInitializingAction(action);
        setInitModalOpen(true);
      }
      
    } catch (error) {
      console.error(`[Dashboard] Erro detalhado:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // Mostra erro mais específico para o usuário
      if (error.response?.data?.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert(`Erro ao ${action} cliente: ${error.message}`);
      }
    }
  };

  const handleStartClient = async () => {
    try {
      await axios.post('/api/client-control', {
        clientId: startingClientId,
        action: 'start',
      });
    } catch (error) {
      console.error('Erro ao iniciar cliente:', error);
    } finally {
      setStartModalOpen(false);
      setStartingClientId(null);
    }
  };

  const handleMoveToType = async (clientName, sourceType, targetType) => {
    try {
      const response = await axios.post('/api/client-operations', {
        operation: 'move',
        sourceClient: `${sourceType}/${clientName}`,
        targetType
      });

      if (response.data.success) {
        const res = await axios.post('/api/listClientes');
        setClientes(res.data);
      }
    } catch (error) {
      console.error('Erro ao mover cliente:', error);
    }
  };

  const handleCopyClient = async (sourceType, clientName) => {
    try {
      await axios.post('/api/client-operations', {
        operation: 'copy',
        sourceClient: `${sourceType}/${clientName}`
      });
    } catch (error) {
      console.error('Erro ao copiar cliente:', error);
    }
  };

  const handlePasteClient = async (targetType, newName) => {
    try {
      const response = await axios.post('/api/client-operations', {
        operation: 'paste',
        targetType,
        targetName: newName
      });

      if (response.data.success) {
        const res = await axios.post('/api/listClientes');
        setClientes(res.data);
      }
    } catch (error) {
      console.error('Erro ao colar cliente:', error);
    }
  };

  const handleDuplicateClient = async (sourceType, clientName) => {
    try {
      const response = await axios.post('/api/client-operations', {
        operation: 'duplicate',
        sourceClient: `${sourceType}/${clientName}`
      });

      if (response.data.success) {
        const res = await axios.post('/api/listClientes');
        setClientes(res.data);
      }
    } catch (error) {
      console.error('Erro ao duplicar cliente:', error);
    }
  };

  const handleRenameClient = async (folderType, clientId, newName) => {
    try {
      const response = await axios.post('/api/client-operations/rename', {
        nomePastaCliente: clientId,
        newClientName: newName
      });

      if (response.status === 200) {
        await fetchClientes();
      } else {
        throw new Error(response.data.error || 'Erro ao renomear cliente');
      }
    } catch (error) {
      console.error('Erro ao renomear cliente:', error);
      alert(`Erro ao renomear cliente: ${error.message}`);
    }
  };

  const handleAbrirRelatorioCliente = (clientId) => {
    console.log('Abrindo relatório para o cliente:', clientId);
    setSelectedClientId(clientId);
    setRelatoriosModalOpen(true);
  };

  // Handler para abrir o modal de novo cliente
  const handleAbrirNovoClienteModal = () => {
    setNovoClienteModalOpen(true);
  };

  // Handler para abrir o modal do terminal
  const handleAbrirTerminalModal = () => {
    setTerminalModalOpen(true);
  };

  // Handler para abrir o modal CRM
  const handleAbrirCrmModal = (clientId = null) => {
    setCrmClientId(clientId);
    setCrmModalOpen(true);
  };

  // Handler para abrir o modal de backup
  const handleAbrirBackupModal = () => {
    setBackupModalOpen(true);
  };

  // Função para lidar com o salvamento do novo cliente
  const handleSalvarNovoCliente = async (modelo, dados) => {
    console.log("[Dashboard] handleSalvarNovoCliente chamado.");
    setLoading(true);
    // setError(null); // Comentado pois setError não está definido aqui
    try {
      // 1. Criar o cliente (copiar arquivos do modelo)
      const response = await axios.post('/api/create-client-functions', {
        action: 'copiarArquivosDoModelo',
        modeloId: modelo,
        nomeCliente: dados.name
      });
      if (!response.ok) {
        throw new Error(response.data.error || 'Erro ao criar cliente');
      }

      // 2. Salvar a configuração do cliente
      const saveConfigResponse = await axios.post('/api/save-client-config', {
        clientId: `${dados.name}`,
        config: dados
      });
      if (!saveConfigResponse.ok) {
        throw new Error(saveConfigResponse.data.error || 'Erro ao salvar configuração');
      }

      // 3. Atualizar a lista de clientes
      await fetchClientes();

      // 4. Fechar o modal
      setNovoClienteModalOpen(false);

    } catch (error) {
      console.error("Erro ao salvar novo cliente:", error);
      // setError('Erro ao salvar novo cliente: ' + (error instanceof Error ? error.message : String(error))); // Comentado pois setError não está definido aqui
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClientFolder = async (clientId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/download-client-folder?clientId=${encodeURIComponent(clientId)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro desconhecido ao baixar pasta');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `${clientId.replace('/', '-')}-folder.zip`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`Pasta do cliente ${clientId} baixada com sucesso.`);

    } catch (err) {
      console.error('Erro ao baixar pasta do cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const allClientNames = [...clientes.map(c => c.name), ...modelosList];

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Dashboard de Clientes</h1>
          {/* Botão Novo Cliente */}
          <button
            onClick={handleAbrirNovoClienteModal}
            className={styles.signOutButton}
            style={{ marginLeft: '15px', marginRight: '15px' }}
          >
            Novo Cliente
          </button>
          {/* Botão Terminal */}
          <button
            onClick={handleAbrirTerminalModal}
            className={styles.signOutButton}
            style={{ marginLeft: '15px', marginRight: '15px' }}
          >
            Terminal
          </button>
          <button
            onClick={handleAbrirBackupModal}
            className={styles.signOutButton}
            style={{ marginLeft: '15px', marginRight: '15px' }}
          >
            💾 Backup
          </button>
          <button
            onClick={() => setRelatoriosModalOpen(true)}
            className={styles.signOutButton}
            style={{ marginLeft: '15px' }}
          >
            Relatórios
          </button>
          {/* Botão Sair temporariamente removido */}
        </div>
      </header>

      <main className={styles.mainContent}>

        {/* Restante do conteúdo */}
        <PM2Panel/>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loader}></div>
            <p>Carregando clientes... (Isso pode levar alguns segundos na primeira carga)</p>
          </div>
        ) : (
          <div className={styles.sections}>
            <DroppableSection
              type="clientes"
              title="Clientes"
              clientes={clientes}
              onEditarCliente={handleEditarCliente}
              onIniciarCliente={handleIniciarCliente}
              onCopy={handleCopyClient}
              onPaste={handlePasteClient}
              onDuplicate={handleDuplicateClient}
              onRename={handleRenameClient}
              onAbrirCrmModal={handleAbrirCrmModal}
              onAbrirRelatorioCliente={handleAbrirRelatorioCliente}
              onDownloadClientFolder={handleDownloadClientFolder}
              existingClients={allClientNames}
            />

            <DroppableSection
              type="modelos"
              title="Modelos"
              clientes={modelosList.map(modeloName => ({ id: modeloName, name: modeloName, folderType: 'modelos', status: 'modelo' }))}
              onEditarCliente={handleEditarCliente}
              onCopy={handleCopyClient}
              onPaste={handlePasteClient}
              onDuplicate={handleDuplicateClient}
              onRename={handleRenameClient}
              onAbrirCrmModal={handleAbrirCrmModal}
              onAbrirRelatorioCliente={handleAbrirRelatorioCliente}
              onDownloadClientFolder={handleDownloadClientFolder}
              existingClients={allClientNames}
            />
          </div>
        )}
      </main>

      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        clientId={selectedClientId}
        onSave={handleSaveConfig}
      />

      <InitClientModal
        isOpen={initModalOpen}
        onClose={() => {
          setInitModalOpen(false);
          setInitializingClientId(null);
          setInitializingAction(null);
        }}
        clientId={initializingClientId}
        action={initializingAction}
      />

      <RelatoriosModal
        visible={relatoriosModalOpen}
        onClose={() => {
          setRelatoriosModalOpen(false);
          setSelectedClientId(null);
        }}
        reportClientId={selectedClientId}
      />

      {/* Modal Novo Cliente */}
      <NovoClienteModal
        isOpen={novoClienteModalOpen}
        onClose={() => setNovoClienteModalOpen(false)}
        modelos={modelosList}
        onSave={handleSalvarNovoCliente}
      />

      {/* Modal Terminal */}
      <TerminalModal
        isOpen={terminalModalOpen}
        onClose={() => setTerminalModalOpen(false)}
      />

      {/* Modal CRM */}
      <CrmModal
        isOpen={crmModalOpen}
        onClose={() => setCrmModalOpen(false)}
        clientId={crmClientId}
      />

      {/* Modal Backup */}
      <BackupManager
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      {/* Tornar ThemeToggle fixo e sobreposto */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <ThemeToggle />
      </div>
    </div>
  );
}

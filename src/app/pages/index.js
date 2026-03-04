import { useState, useEffect } from 'react';
import axios from 'axios';
import EditClientModal from '../components/EditClientModal';

export default function Home() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await axios.post('/api/listClientes');
        // Use the client objects returned by the API
        const clientesData = res.data.map((cliente) => ({
          id: cliente.id,
          nome: cliente.name,
          status: 'inactive',
          type: cliente.type,
          folderType: cliente.folderType,
          infoCliente: cliente.infoCliente,
        }));
        setClientes(clientesData);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const handleEditarCliente = (clientId) => {
    setSelectedClientId(clientId);
    setEditModalOpen(true);
  };

  const handleSaveConfig = () => {
    // Refresh the client list after saving
    const fetchClientes = async () => {
      try {
        const res = await axios.post('/api/listClientes');
        const clientesData = res.data.map((cliente) => ({
          id: cliente.id,
          nome: cliente.name,
          status: 'inactive',
          type: cliente.type,
          folderType: cliente.folderType,
          infoCliente: cliente.infoCliente,
        }));
        setClientes(clientesData);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    };
    fetchClientes();
  };

  const handleIniciarCliente = async (clientId) => {
    try {
      await axios.post('/api/iniciar-desenvolvimento');
      // Update client status in UI
      setClientes((prevClientes) =>
        prevClientes.map((cliente) =>
          cliente.id === clientId ? { ...cliente, status: 'active' } : cliente
        )
      );
    } catch (error) {
      console.error(`Erro ao iniciar o cliente ${clientId}:`, error);
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Dashboard de Clientes</h1>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">
            <div className="loader"></div>
            <p>Carregando clientes...</p>
          </div>
        ) : (
          <div className="card-grid">
            {clientes.map((cliente) => (
              <div key={cliente.id} className={`card ${cliente.type}`}>
                <div className="card-header">
                  <h2>{cliente.nome}</h2>
                  <span className={`status-badge ${cliente.status}`}>
                    {cliente.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="card-content">
                  <p>
                    Status: {cliente.infoCliente?.STATUS || 'N/A'}
                  </p>
                  <p>
                    Tipo: {cliente.folderType}
                  </p>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleEditarCliente(cliente.id)}
                    className="action-button edit"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleIniciarCliente(cliente.id)}
                    className={`action-button start ${cliente.status === 'active' ? 'active' : ''}`}
                  >
                    {cliente.status === 'active' ? 'Executando' : 'Iniciar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .dashboard {
          padding: 20px;
          min-height: 100vh;
          background: #f5f6fa;
        }

        .header {
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
          margin: 0;
          color: #2d3436;
          font-size: 24px;
        }

        .main-content {
          padding: 20px;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        .card.active {
          border-left: 4px solid #00b894;
        }

        .card.canceled {
          border-left: 4px solid #d63031;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h2 {
          margin: 0;
          font-size: 18px;
          color: #2d3436;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #00b89425;
          color: #00b894;
        }

        .status-badge.inactive {
          background: #d6303125;
          color: #d63031;
        }

        .card-content {
          margin-bottom: 15px;
        }

        .card-content p {
          margin: 5px 0;
          color: #636e72;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .action-button {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          color: white;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .action-button.edit {
          background: #3498db;
        }

        .action-button.edit:hover {
          background: #2980b9;
        }

        .action-button.start {
          background: #00b894;
        }

        .action-button.start:hover {
          background: #00a383;
        }

        .action-button.start.active {
          background: #636e72;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .loader {
          border: 3px solid #f3f3f3;
          border-radius: 50%;
          border-top: 3px solid #00b894;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        clientId={selectedClientId}
        onSave={handleSaveConfig}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import ContactDetailsModal from './ContactDetailsModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function CrmKanbanView({ contacts, onUpdateContact, clientId }) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [etapasFunil, setEtapasFunil] = useState([
    { id: 'prospecto', nome: 'Prospecto', descricao: 'Contatos iniciais identificados' },
    { id: 'contato_inicial', nome: 'Contato Inicial', descricao: 'Primeiro contato estabelecido' },
    { id: 'qualificacao', nome: 'Qualificação', descricao: 'Avaliação de interesse e capacidade' },
    { id: 'proposta', nome: 'Proposta', descricao: 'Apresentação da proposta comercial' },
    { id: 'negociacao', nome: 'Negociação', descricao: 'Discussão de termos e condições' },
    { id: 'fechamento', nome: 'Fechamento', descricao: 'Finalização da venda' },
    { id: 'pos_venda', nome: 'Pós-venda', descricao: 'Acompanhamento e suporte pós-venda' }
  ]);
  const [editingEtapa, setEditingEtapa] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');

  const handleContactClick = async (contact) => {
    // Se o contato não tem nome identificado, tentar identificar automaticamente
    if (!contact.nome_identificado || contact.nome_identificado === 'Não identificado') {
      try {
        console.log(`Tentando identificar nome para ${contact.chatId}...`);
        await fetch('/api/identify-names', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: contact.clienteId,
            chatId: contact.chatId.replace('@c.us', '')
          })
        });

        // Recarregar os contatos após identificação
        // Note: Isso vai forçar um refresh quando o modal abrir
        console.log('Nome identificado, atualizando dados...');
      } catch (error) {
        console.error('Erro ao identificar nome:', error);
      }
    }

    setSelectedContact(contact);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedContact(null);
  };

  // Função para lidar com drag and drop
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Encontrar o contato arrastado
    const contact = contacts.find(c => c.id === draggableId);
    if (!contact) return;

    // Determinar nova etapa baseada no droppableId do destino
    const newEtapa = destination.droppableId;

    // Atualizar etapa do contato
    onUpdateContact(contact.chatId, { etapaFunil: newEtapa });
  };

  // Funções para editar etapas
  const startEditingEtapa = (etapa) => {
    setEditingEtapa(etapa.id);
    setEditNome(etapa.nome);
    setEditDescricao(etapa.descricao);
  };

  const saveEtapaEdit = async () => {
    if (!editingEtapa) return;

    const updatedEtapas = etapasFunil.map(etapa =>
      etapa.id === editingEtapa
        ? { ...etapa, nome: editNome, descricao: editDescricao }
        : etapa
    );

    setEtapasFunil(updatedEtapas);

    // Salvar no infoCliente.json
    if (clientId) {
      try {
        const funilVendas = updatedEtapas.map(etapa => ({
          id: etapa.id,
          nome: etapa.nome,
          descricao: etapa.descricao
        }));

        const response = await fetch(`/api/crm/config?clientId=${encodeURIComponent(clientId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            funilVendas
          })
        });

        if (!response.ok) {
          console.error('Erro ao salvar configuração do funil');
        }
      } catch (error) {
        console.error('Erro ao salvar funil de vendas:', error);
      }
    }

    setEditingEtapa(null);
    setEditNome('');
    setEditDescricao('');
  };

  const cancelEtapaEdit = () => {
    setEditingEtapa(null);
    setEditNome('');
    setEditDescricao('');
  };
  // Agrupar contatos por etapa do funil
  const groupedContacts = contacts.reduce((acc, contact) => {
    const etapa = contact.etapaFunil || 'Prospecto';
    if (!acc[etapa]) {
      acc[etapa] = [];
    }
    acc[etapa].push(contact);
    return acc;
  }, {});

  const etapas = ['Prospecto', 'Contato Inicial', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Pós-venda'];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ padding: '20px' }}>
        <h3>📋 Visualização Kanban</h3>
        <p>Total de contatos: {contacts.length}</p>

        {contacts.length === 0 ? (
          <p>Nenhum contato encontrado. Clique em "📥 Importar dados.json" para carregar os dados.</p>
        ) : (
          <div style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            padding: '20px 0',
            minHeight: '600px'
          }}>
            {etapasFunil.map((etapa) => (
            <div
              key={etapa}
              style={{
                minWidth: '300px',
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                border: '2px solid #dee2e6'
              }}
            >
              <div style={{
                margin: '0 0 15px 0',
                color: '#495057',
                fontSize: '1.1rem',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {editingEtapa === etapa.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                      placeholder="Nome da etapa"
                    />
                    <input
                      type="text"
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem' }}
                      placeholder="Descrição da etapa"
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={saveEtapaEdit}
                        style={{
                          padding: '4px 8px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={cancelEtapaEdit}
                        style={{
                          padding: '4px 8px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {etapa.nome} ({groupedContacts[etapa.id]?.length || 0})
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6c757d',
                      marginTop: '2px'
                    }}>
                      {etapa.descricao}
                    </div>
                  </div>
                )}
                {editingEtapa !== etapa.id && (
                  <button
                    onClick={() => startEditingEtapa(etapa)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: '#6c757d',
                      padding: '4px'
                    }}
                    title="Editar etapa"
                  >
                    ✏️
                  </button>
                )}
              </div>

              <Droppable droppableId={etapa.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      minHeight: '100px',
                      backgroundColor: snapshot.isDraggingOver ? '#f8f9fa' : 'transparent',
                      padding: '8px',
                      borderRadius: '4px'
                    }}
                  >
                      <Draggable key={contact.id} draggableId={contact.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleContactClick(contact)}
                            style={{
                              background: 'white',
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '12px',
                              boxShadow: snapshot.isDragging
                                ? '0 8px 16px rgba(0,0,0,0.2)'
                                : '0 2px 4px rgba(0,0,0,0.1)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              transform: snapshot.isDragging ? 'rotate(5deg)' : 'translateY(0)',
                              ...provided.draggableProps.style
                            }}
                            onMouseEnter={(e) => {
                              if (!snapshot.isDragging) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!snapshot.isDragging) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                              }
                            }}
                          >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {contact.nome || contact.nome_identificado || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '5px' }}>
                      {contact.telefone}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: contact.lead === 'sim' ? '#28a745' : '#6c757d',
                      fontWeight: contact.lead === 'sim' ? 'bold' : 'normal'
                    }}>
                      Lead Score: {contact.leadScore}
                    </div>
                    {contact.interesse && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        marginTop: '5px',
                        borderTop: '1px solid #f8f9fa',
                        paddingTop: '5px'
                      }}>
                        {contact.interesse.length > 50
                          ? `${contact.interesse.substring(0, 50)}...`
                          : contact.interesse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Modal de Detalhes do Contato */}
        <ContactDetailsModal
          isOpen={detailsModalOpen}
          onClose={closeDetailsModal}
          contact={selectedContact}
        />
      </div>
    </DragDropContext>
  );
}
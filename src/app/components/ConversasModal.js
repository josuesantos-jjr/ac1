'use client';

import { useState, useEffect, useCallback } from 'react';
import ContactDetailsModal from './ContactDetailsModal';

export default function ConversasModal({ isOpen, onClose, clientId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contactDetailsModalOpen, setContactDetailsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Buscar conversas quando o modal abre
  const fetchConversations = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/chat-history?clientId=${encodeURIComponent(clientId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar conversas');
      }

      setConversations(data.conversations || []);
      // Selecionar primeira conversa por padrão
      if (data.conversations && data.conversations.length > 0) {
        setSelectedChat(data.conversations[0]);
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
      setError(`Erro ao carregar conversas: ${err.message}`);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  // Formatar timestamp para exibição
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '--:--';
    }
  };

  // Formatar data para exibição
  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (error) {
      return '';
    }
  };

  // Scroll automático para última mensagem
  useEffect(() => {
    if (selectedChat && isOpen) {
      setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    }
  }, [selectedChat, isOpen]);

  // Funções para modal de detalhes do contato
  const openContactDetails = (contact) => {
    setSelectedContact(contact);
    setContactDetailsModalOpen(true);
  };

  const closeContactDetails = () => {
    setContactDetailsModalOpen(false);
    setSelectedContact(null);
  };

  if (!isOpen) return null;

  return (
    <div className="conversas-modal-overlay">
      <div className="conversas-modal-content">
        <div className="conversas-modal-header">
          <h2>📱 Conversas - {clientId}</h2>
          <button onClick={onClose} className="conversas-close-button" disabled={loading}>
            ×
          </button>
        </div>

        {error && <div className="conversas-error-message">{error}</div>}

        {loading ? (
          <div className="conversas-loading">
            <div className="conversas-spinner"></div>
            <p>Carregando conversas...</p>
          </div>
        ) : (
          <div className="conversas-main-content">
            {/* Lista de Conversas Lateral */}
            <div className="conversas-sidebar">
              <div className="conversas-sidebar-header">
                <h3>Conversas ({conversations.length})</h3>
              </div>
              <div className="conversas-list">
                {conversations.length === 0 ? (
                  <div className="conversas-empty">
                    <p>Nenhuma conversa encontrada</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.chatId}
                      className={`conversas-list-item ${
                        selectedChat && selectedChat.chatId === conversation.chatId ? 'active' : ''
                      }`}
                      onClick={() => setSelectedChat(conversation)}
                    >
                      <div className="conversas-contact-avatar">
                        {conversation.contactInfo.avatar ? (
                          <img
                            src={conversation.contactInfo.avatar}
                            alt={conversation.contactInfo.name}
                          />
                        ) : (
                          <div className="conversas-avatar-placeholder">
                            {conversation.contactInfo.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="conversas-contact-info">
                        <div className="conversas-contact-name">
                          {conversation.contactInfo.name}
                        </div>
                        <div className="conversas-contact-phone">
                          {conversation.contactInfo.phone}
                        </div>
                        <div className="conversas-last-message">
                          {conversation.lastMessage ? (
                            <>
                              <span className="conversas-message-preview">
                                {conversation.lastMessage.body.length > 30
                                  ? `${conversation.lastMessage.body.substring(0, 30)}...`
                                  : conversation.lastMessage.body}
                              </span>
                              <span className="conversas-message-time">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            </>
                          ) : (
                            'Sem mensagens'
                          )}
                        </div>
                      </div>
                      <div className="conversas-message-count">
                        {conversation.messageCount}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Área do Chat */}
            <div className="conversas-chat-area">
              {selectedChat ? (
                <>
                  {/* Header do Chat */}
                  <div className="conversas-chat-header">
                    <div className="conversas-chat-contact">
                      <div className="conversas-chat-avatar">
                        {selectedChat.contactInfo.avatar ? (
                          <img
                            src={selectedChat.contactInfo.avatar}
                            alt={selectedChat.contactInfo.name}
                          />
                        ) : (
                          <div className="conversas-avatar-placeholder">
                            {selectedChat.contactInfo.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="conversas-chat-contact-info">
                        <div
                          className="conversas-chat-contact-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            // Criar objeto de contato baseado nas informações disponíveis
                            const contact = {
                              id: selectedChat.chatId,
                              chatId: selectedChat.chatId,
                              clienteId: clientId,
                              nome_identificado: selectedChat.contactInfo.name,
                              telefone: selectedChat.contactInfo.phone,
                              nome: selectedChat.contactInfo.name,
                              status: 'Ativo'
                            };
                            openContactDetails(contact);
                          }}
                        >
                          {selectedChat.contactInfo.name}
                        </div>
                        <div className="conversas-chat-contact-phone">
                          {selectedChat.contactInfo.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="conversas-messages" id="chat-messages">
                    {selectedChat.messages.map((message, index) => (
                      <div key={message.id || index} className="conversas-message-wrapper">
                        {/* Mostrar data se for primeira mensagem do dia ou mudança de data */}
                        {(index === 0 ||
                          formatDate(message.timestamp) !== formatDate(selectedChat.messages[index - 1].timestamp)) && (
                          <div className="conversas-date-separator">
                            <span>{formatDate(message.timestamp)}</span>
                          </div>
                        )}

                        <div className={`conversas-message ${
                          message.isFromClient ? 'sent' : 'received'
                        }`}>
                          <div className="conversas-message-bubble">
                            {message.body}
                          </div>
                          <div className="conversas-message-time">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="conversas-no-chat">
                  <div className="conversas-no-chat-icon">💬</div>
                  <h3>Selecione uma conversa</h3>
                  <p>Escolha uma conversa da lista lateral para visualizar as mensagens</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS */}
      <style jsx>{`
        .conversas-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1200;
          padding: 10px;
        }

        .conversas-modal-content {
          background: white;
          border-radius: 12px;
          width: 95%;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .conversas-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #075e54;
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .conversas-modal-header h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .conversas-close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: white;
          padding: 0 8px;
          line-height: 1;
        }

        .conversas-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .conversas-error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 4px;
          margin: 16px;
          font-size: 0.9rem;
        }

        .conversas-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          gap: 16px;
        }

        .conversas-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e3e3e3;
          border-top: 4px solid #075e54;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .conversas-main-content {
          display: flex;
          height: calc(100% - 70px);
        }

        .conversas-sidebar {
          width: 350px;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
        }

        .conversas-sidebar-header {
          padding: 16px;
          background: #f8f8f8;
          border-bottom: 1px solid #e0e0e0;
        }

        .conversas-sidebar-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #333;
        }

        .conversas-list {
          flex: 1;
          overflow-y: auto;
        }

        .conversas-list-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .conversas-list-item:hover {
          background-color: #f5f5f5;
        }

        .conversas-list-item.active {
          background-color: #e1f5fe;
        }

        .conversas-contact-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .conversas-contact-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .conversas-avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #25d366;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .conversas-contact-info {
          flex: 1;
          min-width: 0;
        }

        .conversas-contact-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conversas-contact-phone {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 4px;
        }

        .conversas-last-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conversas-message-preview {
          font-size: 0.85rem;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .conversas-message-time {
          font-size: 0.75rem;
          color: #999;
          margin-left: 8px;
        }

        .conversas-message-count {
          background: #25d366;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .conversas-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .conversas-chat-header {
          padding: 16px 20px;
          background: #075e54;
          color: white;
          border-bottom: 1px solid #e0e0e0;
        }

        .conversas-chat-contact {
          display: flex;
          align-items: center;
        }

        .conversas-chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 12px;
        }

        .conversas-chat-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .conversas-chat-contact-info {
          flex: 1;
        }

        .conversas-chat-contact-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .conversas-chat-contact-phone {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .conversas-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #e5ddd5;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text fill="%23f0f0f0" font-size="20" y="50%">💬</text></svg>');
          background-size: 50px 50px;
          background-repeat: repeat;
        }

        .conversas-date-separator {
          text-align: center;
          margin: 16px 0;
          position: relative;
        }

        .conversas-date-separator span {
          background: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          color: #666;
          border: 1px solid #e0e0e0;
        }

        .conversas-message-wrapper {
          margin-bottom: 8px;
        }

        .conversas-message {
          display: flex;
          margin-bottom: 4px;
        }

        .conversas-message.sent {
          justify-content: flex-start;
        }

        .conversas-message.received {
          justify-content: flex-end;
        }

        .conversas-message-bubble {
          max-width: 70%;
          padding: 8px 12px;
          border-radius: 18px;
          position: relative;
          word-wrap: break-word;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .conversas-message.sent .conversas-message-bubble {
          background: white;
          color: #333;
          margin-right: auto;
        }

        .conversas-message.received .conversas-message-bubble {
          background: #dcf8c6;
          color: #333;
          margin-left: auto;
        }

        .conversas-message-time {
          font-size: 0.7rem;
          color: #999;
          margin-top: 2px;
          text-align: center;
        }

        .conversas-message.sent .conversas-message-time {
          text-align: left;
          margin-left: 12px;
        }

        .conversas-message.received .conversas-message-time {
          text-align: right;
          margin-right: 12px;
        }

        .conversas-no-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          text-align: center;
          padding: 40px;
        }

        .conversas-no-chat-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .conversas-no-chat h3 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .conversas-no-chat p {
          margin: 0;
          font-size: 0.9rem;
        }

        .conversas-empty {
          padding: 40px 20px;
          text-align: center;
          color: #666;
        }

        /* Responsividade para mobile */
        @media (max-width: 768px) {
          .conversas-modal-content {
            width: 100%;
            height: 100vh;
            border-radius: 0;
          }

          .conversas-sidebar {
            width: 100%;
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: 10;
          }

          .conversas-chat-area {
            width: 100%;
          }

          .conversas-main-content {
            position: relative;
          }
        }

        /* Scrollbar customizada */
        .conversas-list::-webkit-scrollbar,
        .conversas-messages::-webkit-scrollbar {
          width: 6px;
        }

        .conversas-list::-webkit-scrollbar-track,
        .conversas-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .conversas-list::-webkit-scrollbar-thumb,
        .conversas-messages::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .conversas-list::-webkit-scrollbar-thumb:hover,
        .conversas-messages::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

      {/* Modal de Detalhes do Contato */}
      <ContactDetailsModal
        isOpen={contactDetailsModalOpen}
        onClose={closeContactDetails}
        contact={selectedContact}
      />
    </div>
  );
}
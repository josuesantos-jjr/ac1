'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CRMContact } from '../../backend/service/crmDataService';

interface CrmKanbanCardProps {
  contact: CRMContact;
  onClick?: (contact: CRMContact) => void;
}

const CrmKanbanCard: React.FC<CrmKanbanCardProps> = ({ contact, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Calcular dias desde última mensagem
  const getDaysSinceLastMessage = () => {
    if (!contact.data_ultima_mensagem_recebida) return null;
    const lastMessage = new Date(contact.data_ultima_mensagem_recebida);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastMessage.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSince = getDaysSinceLastMessage();
  const isStale = daysSince && daysSince > 7;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`kanban-card ${isStale ? 'stale' : ''}`}
        {...attributes}
        {...listeners}
        onClick={() => onClick && onClick(contact)}
      >
      <div className="card-header">
        <div className="card-name">
          {contact.nome || contact.nome_identificado || 'Não identificado'}
        </div>
        {contact.lead === 'sim' && (
          <span className="lead-indicator">⭐</span>
        )}
      </div>

      <div className="card-info">
        <div className="card-phone">{contact.telefone}</div>
        {contact.email && (
          <div className="card-email">{contact.email}</div>
        )}
      </div>

      {contact.interesse && (
        <div className="card-interest">
          {contact.interesse.length > 50
            ? contact.interesse.substring(0, 50) + '...'
            : contact.interesse}
        </div>
      )}

      <div className="card-meta">
        <div className="meta-item">
          <span className="label">Score:</span>
          <span className="value">{contact.leadScore}</span>
        </div>

        {contact.valorEstimado && contact.valorEstimado > 0 && (
          <div className="meta-item">
            <span className="label">Valor:</span>
            <span className="value">
              R$ {contact.valorEstimado.toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        {contact.tags && contact.tags.length > 0 && (
          <div className="card-tags">
            {contact.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
            {contact.tags.length > 2 && (
              <span className="tag more">+{contact.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="last-message">
          {isStale ? (
            <span className="stale-warning">
              ⚠️ {daysSince}d atrás
            </span>
          ) : (
            <span>
              📅 {formatDate(contact.data_ultima_mensagem_recebida)}
            </span>
          )}
        </div>

        {contact.isLeadQualificado && (
          <span className="qualified-badge">✅ Qualificado</span>
        )}
      </div>

      <style jsx>{`
        .kanban-card {
          background: white;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #ddd;
          cursor: grab;
          transition: all 0.2s ease;
        }

        .kanban-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .kanban-card.stale {
          border-left: 4px solid #ffc107;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .card-name {
          font-weight: bold;
          color: #333;
          font-size: 14px;
          flex: 1;
        }

        .lead-indicator {
          font-size: 16px;
        }

        .card-info {
          margin-bottom: 8px;
        }

        .card-phone {
          font-size: 13px;
          color: #666;
          display: block;
        }

        .card-email {
          font-size: 12px;
          color: #888;
          display: block;
        }

        .card-interest {
          font-size: 12px;
          color: #555;
          margin-bottom: 8px;
          font-style: italic;
        }

        .card-meta {
          margin-bottom: 8px;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .meta-item .label {
          color: #666;
        }

        .meta-item .value {
          color: #333;
          font-weight: bold;
        }

        .card-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .tag {
          background: #e9ecef;
          color: #495057;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
        }

        .tag.more {
          background: #6c757d;
          color: white;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #666;
        }

        .stale-warning {
          color: #856404;
          font-weight: bold;
        }

        .qualified-badge {
          background: #d4edda;
          color: #155724;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
        }

        .last-message {
          flex: 1;
        }
      `}</style>
    </div>
    </>
  );
};

export default CrmKanbanCard;
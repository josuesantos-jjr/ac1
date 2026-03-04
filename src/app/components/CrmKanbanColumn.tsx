'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CRMContact } from '../../backend/service/crmDataService';
import CrmKanbanCard from './CrmKanbanCard';

interface CrmKanbanColumnProps {
  id: string;
  title: string;
  contacts: CRMContact[];
  metrics: {
    total: number;
    leads: number;
    valorTotal: number;
  };
  description?: string;
  onCardClick?: (contact: CRMContact) => void;
}

const CrmKanbanColumn: React.FC<CrmKanbanColumnProps> = ({
  id,
  title,
  contacts,
  metrics,
  description,
  onCardClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={`kanban-column ${isOver ? 'over' : ''}`}
      >
        <div className="column-header">
          <h3>{title}</h3>
          {description && <p style={{fontSize: '0.8em', color: '#666', margin: '4px 0'}}>{description}</p>}
          <div className="column-metrics">
            <span className="metric total">{metrics.total}</span>
            {metrics.leads > 0 && (
              <span className="metric leads">⭐ {metrics.leads}</span>
            )}
            {metrics.valorTotal > 0 && (
              <span className="metric value">
                R$ {metrics.valorTotal.toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        <div className="column-content">
          <SortableContext
            items={contacts.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {contacts.map((contact) => (
              <CrmKanbanCard key={contact.id} contact={contact} onClick={onCardClick} />
            ))}
          </SortableContext>
        </div>
      </div>

      <style jsx>{`
        .kanban-column {
          min-height: 500px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #ddd;
          display: flex;
          flex-direction: column;
        }

        .kanban-column.over {
          border: 2px dashed #007bff;
          background-color: #e3f2fd;
        }

        .column-header {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }

        .column-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 16px;
          font-weight: bold;
        }

        .column-metrics {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .metric {
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .metric.total {
          background: #6c757d;
          color: white;
        }

        .metric.leads {
          background: #28a745;
          color: white;
        }

        .metric.value {
          background: #007bff;
          color: white;
        }

        .column-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </>
  );
};

export default CrmKanbanColumn;
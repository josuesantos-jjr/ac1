'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CRMContact } from '../../backend/service/crmDataService';
import CrmKanbanColumn from './CrmKanbanColumn';
import CrmKanbanCard from './CrmKanbanCard';
import axios from 'axios';

interface CrmKanbanViewProps {
  contacts: CRMContact[];
  onUpdateContact: () => void;
  clientId?: string | null;
  onOpenContact?: (contact: CRMContact) => void;
}

const CrmKanbanView: React.FC<CrmKanbanViewProps> = ({
  contacts,
  onUpdateContact,
  clientId,
  onOpenContact,
}) => {
  const [activeContact, setActiveContact] = useState<CRMContact | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Container para kanban board
  const kanbanContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '15px',
    padding: '20px',
    overflowX: 'auto',
    minHeight: '600px',
  };

  // Etapas do funil de vendas
  const [etapas, setEtapas] = useState<any[]>([]);

  useEffect(() => {
    const loadEtapas = async () => {
      if (clientId) {
        try {
          const response = await axios.get(`/api/client-config?clientId=${clientId}`);
          if (response.data.GEMINI_PROMPT && response.data.GEMINI_PROMPT[0] && response.data.GEMINI_PROMPT[0]["Funil de vendas"] && Array.isArray(response.data.GEMINI_PROMPT[0]["Funil de vendas"]) && response.data.GEMINI_PROMPT[0]["Funil de vendas"].length > 0) {
            setEtapas(response.data.GEMINI_PROMPT[0]["Funil de vendas"]);
          } else {
            setEtapas([
              { nome: 'Prospecto', descricao: 'Contato inicial identificado' },
              { nome: 'Contato Inicial', descricao: 'Primeira interação estabelecida' },
              { nome: 'Qualificação', descricao: 'Informações básicas coletadas (cidade, renda, FGTS)' },
              { nome: 'Proposta', descricao: 'Apresentação de imóveis e propostas enviadas' },
              { nome: 'Fechamento', descricao: 'Negociação final e fechamento do negócio' },
              { nome: 'Pós-Venda', descricao: 'Acompanhamento após a venda' }
            ]);
          }
        } catch (error) {
          console.error('Erro ao carregar etapas:', error);
          setEtapas([
            { nome: 'Prospecto', descricao: 'Contato inicial identificado' },
            { nome: 'Contato Inicial', descricao: 'Primeira interação estabelecida' },
            { nome: 'Qualificação', descricao: 'Informações básicas coletadas (cidade, renda, FGTS)' },
            { nome: 'Proposta', descricao: 'Apresentação de imóveis e propostas enviadas' },
            { nome: 'Fechamento', descricao: 'Negociação final e fechamento do negócio' },
            { nome: 'Pós-Venda', descricao: 'Acompanhamento após a venda' }
          ]);
        }
      } else {
        setEtapas([
          { nome: 'Prospecto', descricao: 'Contato inicial identificado' },
          { nome: 'Contato Inicial', descricao: 'Primeira interação estabelecida' },
          { nome: 'Qualificação', descricao: 'Informações básicas coletadas (cidade, renda, FGTS)' },
          { nome: 'Proposta', descricao: 'Apresentação de imóveis e propostas enviadas' },
          { nome: 'Fechamento', descricao: 'Negociação final e fechamento do negócio' },
          { nome: 'Pós-Venda', descricao: 'Acompanhamento após a venda' }
        ]);
      }
    };

    loadEtapas();
  }, [clientId]);

  // Agrupar contatos por etapa
  const contactsByStage = etapas.reduce((acc, etapa) => {
    acc[etapa.nome] = contacts.filter(contact => contact.etapaFunil === etapa.nome);
    return acc;
  }, {} as Record<string, CRMContact[]>);

  // Handler para início do drag
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const contact = contacts.find(c => c.id === active.id);
    setActiveContact(contact || null);
  };

  // Handler para fim do drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveContact(null);
      return;
    }

    const contactId = active.id as string;
    const newStage = over.id as string;

    // Verificar se mudou de etapa
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.etapaFunil !== newStage) {
      try {
        await axios.put(`/api/crm/contacts/${encodeURIComponent(contactId)}`, {
          etapaFunil: newStage
        });
        onUpdateContact();
      } catch (error) {
        console.error('Erro ao mover contato:', error);
        alert('Erro ao mover contato entre etapas');
      }
    }

    setActiveContact(null);
  };

  // Calcular métricas por etapa
  const getStageMetrics = (stageContacts: CRMContact[]) => {
    const total = stageContacts.length;
    const leads = stageContacts.filter(c => c.lead === 'sim').length;
    const valorTotal = stageContacts.reduce((sum, c) => sum + (c.valorEstimado || 0), 0);

    return { total, leads, valorTotal };
  };

  const handleCardClick = (contact: CRMContact) => {
    if (onOpenContact) {
      onOpenContact(contact);
    }
  };

  return (
    <div className="kanban-container">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board" style={kanbanContainerStyle}>
          {etapas.map((etapa) => {
            const stageContacts = contactsByStage[etapa.nome] || [];
            const metrics = getStageMetrics(stageContacts);

            return (
              <CrmKanbanColumn
                key={etapa.nome}
                id={etapa.nome}
                title={etapa.nome}
                contacts={stageContacts}
                metrics={metrics}
                description={etapa.descricao}
                onCardClick={handleCardClick}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeContact ? (
            <CrmKanbanCard contact={activeContact} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default CrmKanbanView;
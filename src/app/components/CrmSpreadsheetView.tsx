'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  ColumnFiltersState,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { CRMContact } from '../../backend/service/crmDataService';
import axios from 'axios';

interface CrmSpreadsheetViewProps {
  contacts: CRMContact[];
  onUpdateContact: () => void;
}

const CrmSpreadsheetView: React.FC<CrmSpreadsheetViewProps> = ({
  contacts,
  onUpdateContact,
}) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
    value: any;
  } | null>(null);

  // Função para atualizar contato
  const updateContact = async (contactId: string, updates: Partial<CRMContact>) => {
    try {
      await axios.put(`/api/crm/contacts/${encodeURIComponent(contactId)}`, updates);
      onUpdateContact();
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      alert('Erro ao atualizar contato');
    }
  };

  // Iniciar edição de célula
  const startEditing = (rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, columnId, value: currentValue });
  };

  // Salvar edição
  const saveEditing = async () => {
    if (!editingCell) return;

    const { rowId, columnId, value } = editingCell;
    const updates: Partial<CRMContact> = { [columnId]: value };

    await updateContact(rowId, updates);
    setEditingCell(null);
  };

  // Cancelar edição
  const cancelEditing = () => {
    setEditingCell(null);
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

  // Formatar tags
  const formatTags = (tags: string[]) => {
    return tags.join(', ');
  };

  // Renderizar célula editável
  const renderEditableCell = (
    value: any,
    row: any,
    columnId: string,
    type: 'text' | 'select' | 'number' = 'text'
  ) => {
    const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === columnId;

    if (isEditing) {
      if (type === 'select' && columnId === 'etapaFunil') {
        return (
          <select
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onBlur={saveEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing();
              if (e.key === 'Escape') cancelEditing();
            }}
            autoFocus
          >
            <option value="Prospecto">Prospecto</option>
            <option value="Contato Inicial">Contato Inicial</option>
            <option value="Qualificação">Qualificação</option>
            <option value="Proposta">Proposta</option>
            <option value="Fechamento">Fechamento</option>
            <option value="Pós-Venda">Pós-Venda</option>
          </select>
        );
      }

      if (type === 'select' && columnId === 'lead') {
        return (
          <select
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onBlur={saveEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing();
              if (e.key === 'Escape') cancelEditing();
            }}
            autoFocus
          >
            <option value="sim">Sim</option>
            <option value="não">Não</option>
          </select>
        );
      }

      if (type === 'number') {
        return (
          <input
            type="number"
            value={editingCell.value || ''}
            onChange={(e) => setEditingCell({ ...editingCell, value: parseFloat(e.target.value) || 0 })}
            onBlur={saveEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditing();
              if (e.key === 'Escape') cancelEditing();
            }}
            autoFocus
          />
        );
      }

      return (
        <input
          type="text"
          value={editingCell.value || ''}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onBlur={saveEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEditing();
            if (e.key === 'Escape') cancelEditing();
          }}
          autoFocus
        />
      );
    }

    return (
      <div
        onClick={() => startEditing(row.original.id, columnId, value)}
        style={{ cursor: 'pointer', minHeight: '24px' }}
      >
        {columnId === 'etapaFunil' && (
          <span className={`status-badge status-${value?.toLowerCase().replace(' ', '-')}`}>
            {value}
          </span>
        )}
        {columnId === 'lead' && (
          <span className={`lead-badge lead-${value}`}>
            {value === 'sim' ? '✓' : '✗'}
          </span>
        )}
        {columnId === 'tags' && formatTags(value)}
        {columnId.includes('data') && formatDate(value)}
        {columnId === 'valorEstimado' && value ? `R$ ${value.toLocaleString('pt-BR')}` : ''}
        {!['etapaFunil', 'lead', 'tags', 'valorEstimado'].includes(columnId) &&
         !columnId.includes('data') && String(value)}
      </div>
    );
  };

  const columns = useMemo<ColumnDef<CRMContact>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'nome'),
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'email'),
    },
    {
      accessorKey: 'etapaFunil',
      header: 'Etapa Funil',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'etapaFunil', 'select'),
    },
    {
      accessorKey: 'lead',
      header: 'É Lead',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'lead', 'select'),
    },
    {
      accessorKey: 'leadScore',
      header: 'Lead Score',
      cell: ({ getValue }) => <span>{getValue() as number}</span>,
    },
    {
      accessorKey: 'interesse',
      header: 'Interesse',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'interesse'),
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ getValue }) => <span>{formatTags(getValue() as string[])}</span>,
    },
    {
      accessorKey: 'valorEstimado',
      header: 'Valor Estimado',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'valorEstimado', 'number'),
    },
    {
      accessorKey: 'data_ultima_mensagem_recebida',
      header: 'Última Msg',
      cell: ({ getValue }) => <span>{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'status'),
    },
    {
      accessorKey: 'notas',
      header: 'Notas',
      cell: ({ getValue, row }) => renderEditableCell(getValue(), row, 'notas'),
    },
  ], [editingCell]);

  const table = useReactTable({
    data: contacts,
    columns,
    state: {
      columnFilters,
      sorting,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="spreadsheet-container">
      {/* Filtros */}
      <div className="filters">
        <input
          placeholder="Filtrar por nome..."
          value={(table.getColumn('nome')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('nome')?.setFilterValue(event.target.value)
          }
          className="filter-input"
        />
        <select
          value={(table.getColumn('etapaFunil')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('etapaFunil')?.setFilterValue(event.target.value)
          }
          className="filter-select"
        >
          <option value="">Todas as etapas</option>
          <option value="Prospecto">Prospecto</option>
          <option value="Contato Inicial">Contato Inicial</option>
          <option value="Qualificação">Qualificação</option>
          <option value="Proposta">Proposta</option>
          <option value="Fechamento">Fechamento</option>
          <option value="Pós-Venda">Pós-Venda</option>
        </select>
        <select
          value={(table.getColumn('lead')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('lead')?.setFilterValue(event.target.value)
          }
          className="filter-select"
        >
          <option value="">Todos</option>
          <option value="sim">Apenas leads</option>
          <option value="não">Não leads</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="spreadsheet-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="pagination">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <span>
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Mostrar {pageSize}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .spreadsheet-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }

        .filter-input, .filter-select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .filter-input {
          width: 200px;
        }

        .table-container {
          flex: 1;
          overflow: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .spreadsheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .spreadsheet-table th,
        .spreadsheet-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .spreadsheet-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .spreadsheet-table tr:hover {
          background-color: #f5f5f5;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-prospecto { background: #e3f2fd; color: #1976d2; }
        .status-contato-inicial { background: #f3e5f5; color: #7b1fa2; }
        .status-qualificação { background: #fff3e0; color: #f57c00; }
        .status-proposta { background: #e8f5e8; color: #388e3c; }
        .status-fechamento { background: #ffebee; color: #d32f2f; }
        .status-pós-venda { background: #f9fbe7; color: #689f38; }

        .lead-badge {
          font-size: 16px;
          padding: 2px 6px;
          border-radius: 50%;
        }

        .lead-sim { background: #e8f5e8; color: #388e3c; }
        .lead-não { background: #ffebee; color: #d32f2f; }

        input, select {
          width: 100%;
          padding: 4px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 14px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          padding: 10px;
        }

        .pagination button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination select {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default CrmSpreadsheetView;
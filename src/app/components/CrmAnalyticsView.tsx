'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { CRMContact } from '../../backend/service/crmDataService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CrmAnalyticsViewProps {
  contacts: CRMContact[];
}

const CrmAnalyticsView: React.FC<CrmAnalyticsViewProps> = ({ contacts }) => {
  // Análises calculadas
  const analytics = useMemo(() => {
    const totalContacts = contacts.length;
    const totalLeads = contacts.filter(c => c.lead === 'sim').length;
    const conversionRate = totalContacts > 0 ? (totalLeads / totalContacts) * 100 : 0;

    // Contatos por etapa
    const contactsByStage = contacts.reduce((acc, contact) => {
      acc[contact.etapaFunil] = (acc[contact.etapaFunil] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Valor total por etapa
    const valueByStage = contacts.reduce((acc, contact) => {
      acc[contact.etapaFunil] = (acc[contact.etapaFunil] || 0) + (contact.valorEstimado || 0);
      return acc;
    }, {} as Record<string, number>);

    // Leads qualificados por etapa
    const qualifiedByStage = contacts.reduce((acc, contact) => {
      if (contact.isLeadQualificado) {
        acc[contact.etapaFunil] = (acc[contact.etapaFunil] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Contatos por dia (últimos 30 dias)
    const contactsByDate = contacts.reduce((acc, contact) => {
      if (contact.dataCriacao) {
        const date = new Date(contact.dataCriacao).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Tempo médio por etapa (simulado)
    const avgTimeByStage = {
      'Prospecto': 2,
      'Contato Inicial': 3,
      'Qualificação': 5,
      'Proposta': 7,
      'Fechamento': 10,
      'Pós-Venda': 30,
    };

    // Top interesses
    const interestsCount = contacts.reduce((acc, contact) => {
      if (contact.interesse) {
        const key = contact.interesse.length > 30
          ? contact.interesse.substring(0, 30) + '...'
          : contact.interesse;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topInterests = Object.entries(interestsCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalContacts,
      totalLeads,
      conversionRate,
      contactsByStage,
      valueByStage,
      qualifiedByStage,
      contactsByDate,
      avgTimeByStage,
      topInterests,
    };
  }, [contacts]);

  const etapas = [
    'Prospecto',
    'Contato Inicial',
    'Qualificação',
    'Proposta',
    'Fechamento',
    'Pós-Venda'
  ];

  // Dados para gráfico de barras - Contatos por etapa
  const stageChartData = {
    labels: etapas,
    datasets: [{
      label: 'Contatos',
      data: etapas.map(etapa => analytics.contactsByStage[etapa] || 0),
      backgroundColor: [
        '#e3f2fd', '#f3e5f5', '#fff3e0', '#e8f5e8', '#ffebee', '#f9fbe7'
      ],
      borderColor: [
        '#1976d2', '#7b1fa2', '#f57c00', '#388e3c', '#d32f2f', '#689f38'
      ],
      borderWidth: 1,
    }],
  };

  // Dados para gráfico de linha - Criação de contatos ao longo do tempo
  const dates = Object.keys(analytics.contactsByDate).sort();
  const timeChartData = {
    labels: dates.map(date => new Date(date).toLocaleDateString('pt-BR')),
    datasets: [{
      label: 'Novos Contatos',
      data: dates.map(date => analytics.contactsByDate[date]),
      borderColor: '#1976d2',
      backgroundColor: '#e3f2fd',
      tension: 0.1,
    }],
  };

  // Dados para gráfico de pizza - Distribuição de leads
  const leadDistributionData = {
    labels: ['Leads', 'Não Leads'],
    datasets: [{
      data: [analytics.totalLeads, analytics.totalContacts - analytics.totalLeads],
      backgroundColor: ['#388e3c', '#e0e0e0'],
      borderColor: ['#2e7d32', '#bdbdbd'],
      borderWidth: 1,
    }],
  };

  // Dados para gráfico de barras - Valor por etapa
  const valueChartData = {
    labels: etapas,
    datasets: [{
      label: 'Valor Estimado (R$)',
      data: etapas.map(etapa => analytics.valueByStage[etapa] || 0),
      backgroundColor: '#4caf50',
      borderColor: '#388e3c',
      borderWidth: 1,
    }],
  };

  // Dados para gráfico de barras - Leads qualificados por etapa
  const qualifiedChartData = {
    labels: etapas,
    datasets: [{
      label: 'Leads Qualificados',
      data: etapas.map(etapa => analytics.qualifiedByStage[etapa] || 0),
      backgroundColor: '#ff9800',
      borderColor: '#f57c00',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="analytics-container">
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total de Contatos</h3>
          <div className="kpi-value">{analytics.totalContacts}</div>
        </div>
        <div className="kpi-card">
          <h3>Total de Leads</h3>
          <div className="kpi-value">{analytics.totalLeads}</div>
        </div>
        <div className="kpi-card">
          <h3>Taxa de Conversão</h3>
          <div className="kpi-value">{analytics.conversionRate.toFixed(1)}%</div>
        </div>
        <div className="kpi-card">
          <h3>Valor Total Estimado</h3>
          <div className="kpi-value">
            R$ {Object.values(analytics.valueByStage).reduce((a, b) => a + b, 0).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Contatos por Etapa do Funil</h4>
          <div className="chart-container">
            <Bar data={stageChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Distribuição de Leads</h4>
          <div className="chart-container">
            <Doughnut data={leadDistributionData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Valor Estimado por Etapa</h4>
          <div className="chart-container">
            <Bar data={valueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Leads Qualificados por Etapa</h4>
          <div className="chart-container">
            <Bar data={qualifiedChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card full-width">
          <h4>Criação de Contatos ao Longo do Tempo</h4>
          <div className="chart-container">
            <Line data={timeChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Top Interesses</h4>
          <div className="interests-list">
            {analytics.topInterests.map(([interest, count], index) => (
              <div key={index} className="interest-item">
                <span className="interest-text">{interest}</span>
                <span className="interest-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .analytics-container {
          padding: 20px;
          height: 100%;
          overflow-y: auto;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .kpi-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .kpi-card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          font-weight: normal;
        }

        .kpi-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .chart-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-card h4 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 16px;
        }

        .chart-container {
          height: 300px;
          position: relative;
        }

        .interests-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .interest-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .interest-text {
          flex: 1;
          font-size: 14px;
          color: #333;
        }

        .interest-count {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default CrmAnalyticsView;
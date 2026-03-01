'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import styles from '../../page.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RelatorioPage({ params }) {
  const clientId = decodeURIComponent(params.clientId);
  const [relatorios, setRelatorios] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [leadsInfo, setLeadsInfo] = useState(null);
  const [blockedNumbers, setBlockedNumbers] = useState([]);
  const [newBlockedNumber, setNewBlockedNumber] = useState('');
  const [filtro, setFiltro] = useState('semana');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [activeTab, setActiveTab] = useState('leads');

  useEffect(() => {
    const loadBlockedNumbers = async () => {
      try {
        const response = await fetch(
          `/api/blocked-numbers?clientId=${encodeURIComponent(clientId)}`
        );
        const data = await response.json();
        if (data.blockedNumbers) {
          setBlockedNumbers(data.blockedNumbers);
        }
      } catch (error) {
        console.error('Erro ao carregar números bloqueados:', error);
      }
    };
    loadBlockedNumbers();
  }, [clientId]);

  const handleAddBlockedNumber = async () => {
    if (!newBlockedNumber) return;

    try {
      const response = await fetch('/api/blocked-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          number: newBlockedNumber,
          action: 'add',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBlockedNumbers(data.blockedNumbers);
        setNewBlockedNumber('');
      }
    } catch (error) {
      console.error('Erro ao adicionar número bloqueado:', error);
    }
  };

  const handleRemoveBlockedNumber = async (number) => {
    try {
      const response = await fetch('/api/blocked-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          number,
          action: 'remove',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBlockedNumbers(data.blockedNumbers);
      }
    } catch (error) {
      console.error('Erro ao remover número bloqueado:', error);
    }
  };

  useEffect(() => {
    carregarDados();
    // Atualiza os dados a cada minuto
    const interval = setInterval(carregarDados, 60000);
    return () => clearInterval(interval);
  }, [clientId, filtro, dataInicio, dataFim]);

  const carregarDados = async () => {
    try {
      let url = `/api/relatorio?clientId=${encodeURIComponent(clientId)}`;

      if (dataInicio) url += `&dataInicio=${dataInicio}`;
      if (dataFim) url += `&dataFim=${dataFim}`;

      const response = await fetch(url);
      const data = await response.json();

      setRelatorios(data.relatorios);
      setEstatisticas(data.estatisticas);
      setLeadsInfo(data.leads);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const handleFiltroChange = (novoFiltro) => {
    const hoje = new Date();
    let inicio = new Date();
    hoje.setHours(23, 59, 59, 999); // Final do dia atual

    switch (novoFiltro) {
      case 'hoje':
        inicio = new Date();
        inicio.setHours(0, 0, 0, 0); // Início do dia atual
        break;
      case 'ontem':
        inicio = new Date();
        inicio.setDate(hoje.getDate() - 1);
        inicio.setHours(0, 0, 0, 0); // Início de ontem
        hoje.setDate(hoje.getDate() - 1);
        hoje.setHours(23, 59, 59, 999); // Final de ontem
        break;
      case 'semana':
        inicio.setDate(hoje.getDate() - 7);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        inicio.setMonth(hoje.getMonth() - 1);
        inicio.setHours(0, 0, 0, 0);
        break;
      default:
        inicio = null;
    }

    setFiltro(novoFiltro);
    if (inicio) {
      setDataInicio(inicio.toISOString().split('T')[0]);
      setDataFim(hoje.toISOString().split('T')[0]);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolução de Disparos',
      },
    },
  };

  const chartData = {
    labels: relatorios
      .map((r) => new Date(r.data).toLocaleDateString('pt-BR'))
      .filter((date, i, arr) => arr.indexOf(date) === i),
    datasets: [
      {
        label: 'Disparos por Dia',
        data: relatorios.reduce((acc, r) => {
          const data = new Date(r.data).toLocaleDateString('pt-BR');
          acc[data] = (acc[data] || 0) + 1;
          return acc;
        }, {}),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Relatório de Disparos - {clientId.split('/')[1]}</h1>
          <button
            onClick={() => window.history.back()}
            className={styles.signOutButton}
          >
            Voltar
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Seção de Filtros de Período como Menu do Dashboard */}
        {/* Removido bg-white shadow-sm rounded-lg p-4 mb-6 - estilo virá do card pai */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-700 hidden md:block">
                Período:
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['hoje', 'ontem', 'semana', 'mes'].map((tipo) => {
                  // Cria a lista de classes base
                  const buttonClasses = [styles.actionButton];
                  // Adiciona a classe ativa condicionalmente
                  if (filtro === tipo) {
                    buttonClasses.push(styles.actionButtonActive);
                  }
                  // Junta as classes em uma string
                  const classNameString = buttonClasses.join(' ');

                  return (
                    <button
                      key={tipo}
                      onClick={() => handleFiltroChange(tipo)}
                      className={classNameString} // Usa a string de classes gerada
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="px-3 py-2 text-sm border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="px-3 py-2 text-sm border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.sections}>
          {/* Removido styles.card daqui, será aplicado aos elementos internos */}
          <div className={styles.section}>
            {/* Envolvendo a grade de estatísticas em um card */}
            <div className={`${styles.card} mb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Removido border-l-4 border-blue-600 e text-blue-600 */}
                <div className={styles.card}>
                  <h3 className="text-sm font-medium text-gray-600">
                    Total de Disparos
                  </h3>
                  <p className="text-3xl font-bold mt-2">
                    {estatisticas?.totalDisparos || 0}
                  </p>
                </div>
                {/* Removido border-l-4 border-green-600 e text-green-600 */}
                <div className={styles.card}>
                  <h3 className="text-sm font-medium text-gray-600">
                    Disparos com Sucesso
                  </h3>
                  <p className="text-3xl font-bold mt-2">
                    {estatisticas?.disparosSucesso || 0}
                  </p>
                </div>
                {/* Removido border-l-4 border-red-600 e text-red-600 */}
                <div className={styles.card}>
                  <h3 className="text-sm font-medium text-gray-600">
                    Disparos com Falha
                  </h3>
                  <p className="text-3xl font-bold mt-2">
                    {estatisticas?.disparosFalha || 0}
                  </p>
                </div>
                {/* Removido border-l-4 border-purple-600 e text-purple-600 */}
                <div className={styles.card}>
                  <h3 className="text-sm font-medium text-gray-600">
                    Etapa do Aquecimento
                  </h3>
                  <p className="text-3xl font-bold mt-2">
                    {estatisticas?.etapaAquecimentoAtual || 0}
                  </p>
                </div>
              </div>
              {/* Removido border-l-4 border-gray-600 e text-gray-600 */}
              {/* Adicionando margem inferior a este card */}
              <div className={`${styles.card} mb-6`}>
                <h3 className="text-sm font-medium text-gray-600">
                  Números Bloqueados
                </h3>
                <p className="text-3xl font-bold mt-2">
                  {blockedNumbers.length}
                </p>
              </div>
            </div>

            <div className={styles.card}>
              <div style={{ height: '500px' }}>
                <Line data={chartData} options={options} />
              </div>
            </div>

            {/* Seção de Leads e Follow-up */}
            {/* Removendo mt-6, usando mb-6 como padrão */}
            <div className={`${styles.card} mb-6`}>
              <h2 className="text-xl font-semibold mb-4">Leads e Follow-up</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Removido border-l-4 border-yellow-600 e text-yellow-600 */}
                <div className={styles.card}>
                  <h3 className="text-sm font-medium text-gray-600">
                    Total de Leads
                  </h3>
                  <p className="text-3xl font-bold mt-2">
                    {leadsInfo?.total || 0}
                  </p>
                </div>
                {/* Removido border-l-4 border-indigo-600 e text-indigo-600 */}
                <div className={styles.card}>
                  <h3 className="text-sm font-medium text-gray-600">
                    Leads em Follow-up
                  </h3>
                  <p className="text-3xl font-bold mt-2">
                    {leadsInfo?.emFollowUp || 0}
                  </p>
                </div>
              </div>

              {/* Tabs para Leads e Follow-up */}
              <div className="mb-4">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex">
                    <button
                      onClick={() => setActiveTab('leads')}
                      className={`py-2 px-4 border-b-2 font-medium text-sm ${
                        activeTab === 'leads'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Leads
                    </button>
                    <button
                      onClick={() => setActiveTab('followup')}
                      className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                        activeTab === 'followup'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Follow-up
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tabela de Leads ou Follow-up */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeTab === 'leads'
                      ? leadsInfo?.detalhes?.leads?.map((lead, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lead.Nome || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lead.Telefone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Lead
                              </span>
                            </td>
                          </tr>
                        ))
                      : leadsInfo?.detalhes?.followup?.map((followup, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {followup.Nome || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {followup.Telefone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Follow-up
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seção de Números Bloqueados */}
            {/* Removendo mt-6 */}
            <div className={styles.card}>
              <h2 className="text-xl font-semibold mb-4">Números Bloqueados</h2>

              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={newBlockedNumber}
                  onChange={(e) => setNewBlockedNumber(e.target.value)}
                  placeholder="Digite um número (ex: 5511999999999)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddBlockedNumber}
                  // Aplicando estilo de botão do dashboard
                  className={styles.actionButton}
                >
                  Adicionar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blockedNumbers.map((number) => (
                      <tr key={number}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {number.replace('@c.us', '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveBlockedNumber(number)}
                            // Aplicando estilo de botão de parada/remoção do dashboard
                            className={`${styles.actionButton} ${styles.actionButtonStop}`}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                    {blockedNumbers.length === 0 && (
                      <tr>
                        <td
                          colSpan="2"
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                        >
                          Nenhum número bloqueado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

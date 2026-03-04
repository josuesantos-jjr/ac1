'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, Settings, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import GlassCard from './GlassCard';

// Define um objeto com os valores padrão e descrições para cada regra
const REGRAS_DEFAULT = {
  DISPARO_ESTRATEGIA: {
    value: 'todas_ativas',
    description: 'Define quais listas serão usadas para disparo.',
  },
  DISPARO_LISTAS_SELECIONADAS: {
    value: '',
    description:
      'Nomes das listas selecionadas (separados por vírgula), se estratégia for "selecionadas".',
  },
  HORARIO_INICIAL: {
    value: '08:00',
    description: 'Horário de início dos disparos (HH:MM)',
  },
  HORARIO_FINAL: {
    value: '18:00',
    description: 'Horário de término dos disparos (HH:MM)',
  },
  DIA_INICIAL: {
    value: 'segunda',
    description: 'Primeiro dia da semana para disparos',
  },
  DIA_FINAL: {
    value: 'sábado',
    description: 'Último dia da semana para disparos',
  },
  INTERVALO_DE: {
    value: '30',
    description: 'Intervalo mínimo entre mensagens (segundos)',
  },
  INTERVALO_ATE: {
    value: '60',
    description: 'Intervalo máximo entre mensagens (segundos)',
  },
  QUANTIDADE_INICIAL: {
    value: '10',
    description: 'Quantidade de mensagens no primeiro dia de aquecimento',
  },
  DIAS_AQUECIMENTO: {
    value: '7',
    description: 'Número de dias para o período de aquecimento',
  },
  QUANTIDADE_LIMITE: {
    value: '100',
    description: 'Quantidade máxima de mensagens por dia após aquecimento',
  },
  QUANTIDADE_SEQUENCIA: {
    value: '50',
    description:
      'Pausar por 1h após esta quantidade de mensagens (0 para desativar)',
  },
};

// Helper para gerar opções de horário (00:00, 00:30, ..., 23:30)
const gerarOpcoesHorario = () => {
  const horarios = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const horaFormatada = String(h).padStart(2, '0');
      const minutoFormatado = String(m).padStart(2, '0');
      horarios.push(`${horaFormatada}:${minutoFormatado}`);
    }
  }
  return horarios;
};
const opcoesHorario = gerarOpcoesHorario();

// Opções para os dias da semana (compatível com código de disparo)
const opcoesDia = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terça', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sábado', label: 'Sábado' },
];

interface RegrasDisparoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clienteSequencialId: number;
}

export default function RegrasDisparoModal({
  isOpen,
  onClose,
  clientId,
  clienteSequencialId
}: RegrasDisparoModalProps) {
  const [regras, setRegras] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listasDisponiveis, setListasDisponiveis] = useState<string[]>([]);
  const [loadingListas, setLoadingListas] = useState(false);
  const [estadoInfo, setEstadoInfo] = useState<any>(null);
  const [loadingEstado, setLoadingEstado] = useState(false);

  // Estado derivado para listas selecionadas (array)
  const listasSelecionadas = regras.DISPARO_LISTAS_SELECIONADAS
    ? regras.DISPARO_LISTAS_SELECIONADAS.split(',').filter(Boolean)
    : [];

  // Função para buscar as regras atuais
  const fetchRegras = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/regras-disparo?clientId=${encodeURIComponent(clientId)}`
      );
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao buscar regras');
      }
      // Acessa as regras dentro da propriedade 'regras' do objeto retornado
      const regrasRecebidas = responseData.regras || {};

      const regrasCompletas: Record<string, any> = {};
      Object.keys(REGRAS_DEFAULT).forEach((key) => {
        const defaultConfig = REGRAS_DEFAULT[key as keyof typeof REGRAS_DEFAULT];
        regrasCompletas[key] =
          regrasRecebidas[key] !== undefined ? regrasRecebidas[key] : defaultConfig.value;
      });
      setRegras(regrasCompletas);
    } catch (err) {
      console.error('Erro ao buscar regras:', err);
      setError(`Erro ao carregar regras: ${(err as Error).message}`);
      const defaultValues: Record<string, any> = {};
      Object.keys(REGRAS_DEFAULT).forEach((key) => {
        const defaultConfig = REGRAS_DEFAULT[key as keyof typeof REGRAS_DEFAULT];
        defaultValues[key] = defaultConfig.value;
      });
      setRegras(defaultValues);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Função para buscar as listas disponíveis
  const fetchListas = useCallback(async () => {
    if (!clientId) return;

    setLoadingListas(true);
    try {
      const response = await fetch(
        `/api/list-client-lists?clientId=${encodeURIComponent(clientId)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar listas');
      }
      setListasDisponiveis(data.listNames || []);
    } catch (err) {
      console.error('Erro ao buscar listas:', err);
      setError(`Erro ao carregar listas disponíveis: ${(err as Error).message}`);
      setListasDisponiveis([]);
    } finally {
      setLoadingListas(false);
    }
  }, [clientId]);

  // Função para buscar as informações do estado
  const fetchEstado = useCallback(async () => {
    if (!clientId) return;
    setLoadingEstado(true);
    try {
      const response = await fetch(
        `/api/reset-estado?clientId=${encodeURIComponent(clientId)}`
      );
      const data = await response.json();
      if (response.ok && data.estado) {
        setEstadoInfo(data.estado);
      } else {
        setEstadoInfo(null);
      }
    } catch (err) {
      console.error('Erro ao buscar estado:', err);
      setEstadoInfo(null);
    } finally {
      setLoadingEstado(false);
    }
  }, [clientId]);

  // Busca regras, listas e estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      fetchRegras();
      fetchListas();
      fetchEstado();
    }
  }, [isOpen, fetchRegras, fetchListas, fetchEstado]);

  // Handler para mudança nos inputs e selects
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegras((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler para mudança nos checkboxes das listas
  const handleListaSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentSelected = regras.DISPARO_LISTAS_SELECIONADAS
      ? regras.DISPARO_LISTAS_SELECIONADAS.split(',').filter(Boolean)
      : [];
    let newSelected;
    if (checked) {
      newSelected = [...currentSelected, value];
    } else {
      newSelected = currentSelected.filter((name: string) => name !== value);
    }
    setRegras((prev) => ({
      ...prev,
      DISPARO_LISTAS_SELECIONADAS: newSelected.join(','),
    }));
  };

  // Handler para salvar as regras
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const regrasParaSalvar = { ...regras };
      if (regrasParaSalvar.DISPARO_ESTRATEGIA !== 'selecionadas') {
        regrasParaSalvar.DISPARO_LISTAS_SELECIONADAS = '';
      }
      // Remover a chave MIDIA se ela existir acidentalmente
      delete regrasParaSalvar.MIDIA;

      const response = await fetch('/api/regras-disparo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clienteSequencialId, regras: regrasParaSalvar }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar regras');
      }
      console.log('Regras salvas:', result.message);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar regras:', err);
      setError(`Erro ao salvar: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handler para resetar o arquivo estado
  const handleReset = async () => {
    if (!confirm(`⚠️ ATENÇÃO: Esta ação irá resetar o arquivo estado.json do cliente ${clientId}.\n\nIsso irá:\n• Zerar o contador de mensagens enviadas\n• Reiniciar o período de aquecimento\n• Resetar todas as estatísticas de disparo\n\nTem certeza que deseja continuar?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reset-estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resetar estado');
      }
      console.log('Estado resetado:', result.message);
      alert(`✅ Estado do cliente ${clientId} foi resetado com sucesso!\n\nO sistema irá reiniciar o período de aquecimento na próxima execução.`);
    } catch (err) {
      console.error('Erro ao resetar estado:', err);
      setError(`Erro ao resetar estado: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar as informações do estado para o tooltip
  const formatEstadoTooltip = () => {
    if (!estadoInfo) {
      return "Estado atual: Não disponível ou arquivo não encontrado";
    }

    const info = [];
    if (estadoInfo.ultimoDiaDisparo) {
      info.push(`Último dia de disparo: ${estadoInfo.ultimoDiaDisparo}`);
    }
    if (estadoInfo.diasRestantesAquecimento !== undefined) {
      info.push(`Dias restantes de aquecimento: ${estadoInfo.diasRestantesAquecimento}`);
    }
    if (estadoInfo.contadorMensagens !== undefined) {
      info.push(`Mensagens enviadas hoje: ${estadoInfo.contadorMensagens}`);
    }
    if (estadoInfo.diaspassados !== undefined) {
      info.push(`Dias passados: ${estadoInfo.diaspassados}`);
    }
    if (estadoInfo.listaAtualNome) {
      info.push(`Lista atual: ${estadoInfo.listaAtualNome}`);
    }
    if (estadoInfo.indiceContatoAtual !== undefined) {
      info.push(`Índice contato atual: ${estadoInfo.indiceContatoAtual}`);
    }

    return info.length > 0 ? `Estado atual:\n${info.join('\n')}` : "Estado atual: Valores padrão";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center p-4"
          >
            <GlassCard className="w-full max-w-4xl max-h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Settings className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Regras de Disparo
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Configurar disparos para {clientId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading && !Object.keys(regras).length ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  </div>
                ) : (
                  <>
                    {/* Estratégia de Disparo */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-400" />
                        Estratégia de Disparo
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="DISPARO_ESTRATEGIA"
                            value="todas_ativas"
                            checked={regras.DISPARO_ESTRATEGIA === 'todas_ativas'}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-white group-hover:text-blue-300 transition-colors">
                              Disparar para todas as listas ATIVAS
                            </span>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="DISPARO_ESTRATEGIA"
                            value="selecionadas"
                            checked={regras.DISPARO_ESTRATEGIA === 'selecionadas'}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-white group-hover:text-blue-300 transition-colors">
                              Selecionar listas específicas para disparo
                            </span>
                          </div>
                        </label>
                      </div>
                      <p className="text-gray-400 text-sm mt-3">
                        {REGRAS_DEFAULT.DISPARO_ESTRATEGIA.description}
                      </p>
                    </motion.div>

                    {/* Seleção de Listas (condicional) */}
                    {regras.DISPARO_ESTRATEGIA === 'selecionadas' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-h-64 overflow-y-auto"
                      >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-400" />
                          Listas para Disparo
                        </h3>
                        {loadingListas ? (
                          <div className="flex items-center justify-center py-8">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
                            />
                          </div>
                        ) : listasDisponiveis.length === 0 ? (
                          <p className="text-gray-400 text-center py-8">
                            Nenhuma lista encontrada na pasta de configuração.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {listasDisponiveis.map((listName) => (
                              <label key={listName} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  value={listName}
                                  checked={listasSelecionadas.includes(listName)}
                                  onChange={handleListaSelectionChange}
                                  disabled={loading}
                                  className="w-4 h-4 text-green-500 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-white group-hover:text-green-300 transition-colors">
                                  {listName}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        <p className="text-gray-400 text-sm mt-3">
                          Marque as listas que devem ser usadas. O disparo só ocorrerá se a lista selecionada também estiver ATIVA.
                        </p>
                      </motion.div>
                    )}

                    {/* Campos de Configuração */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(REGRAS_DEFAULT)
                        .filter(
                          ([key]) =>
                            key !== 'DISPARO_ESTRATEGIA' &&
                            key !== 'DISPARO_LISTAS_SELECIONADAS' &&
                            key !== 'MIDIA'
                        )
                        .map(([key, config], index) => (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                          >
                            <label htmlFor={`regra-${key}`} className="block text-white font-medium mb-2">
                              {key.replace(/_/g, ' ')}
                            </label>
                            {key === 'HORARIO_INICIAL' || key === 'HORARIO_FINAL' ? (
                              <select
                                id={`regra-${key}`}
                                name={key}
                                value={regras[key] || ''}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="" className="bg-gray-800">Selecione...</option>
                                {opcoesHorario.map((horario) => (
                                  <option key={horario} value={horario} className="bg-gray-800">
                                    {horario}
                                  </option>
                                ))}
                              </select>
                            ) : key === 'DIA_INICIAL' || key === 'DIA_FINAL' ? (
                              <select
                                id={`regra-${key}`}
                                name={key}
                                value={regras[key] || ''}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="" className="bg-gray-800">Selecione...</option>
                                {opcoesDia.map((dia) => (
                                  <option key={dia.value} value={dia.value} className="bg-gray-800">
                                    {dia.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={
                                  key.startsWith('QUANTIDADE') ||
                                  key.startsWith('INTERVALO') ||
                                  key.startsWith('DIAS')
                                    ? 'number'
                                    : 'text'
                                }
                                id={`regra-${key}`}
                                name={key}
                                value={regras[key] || ''}
                                onChange={handleChange}
                                placeholder={config.description}
                                disabled={loading}
                                min={
                                  key.startsWith('QUANTIDADE') ||
                                  key.startsWith('INTERVALO') ||
                                  key.startsWith('DIAS')
                                    ? '0'
                                    : undefined
                                }
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            <p className="text-gray-400 text-sm mt-2">
                              {config.description}
                            </p>
                          </motion.div>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {estadoInfo && (
                    <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <span className="text-yellow-300 text-sm">
                        Estado: {estadoInfo.contadorMensagens || 0} msgs hoje
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={loading}
                    title={formatEstadoTooltip()}
                    className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Estado
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={loading || loadingListas}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {loading ? 'Salvando...' : 'Salvar Regras'}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
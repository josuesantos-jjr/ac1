'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Tag,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: any;
}

export default function ContactDetailsModal({
  isOpen,
  onClose,
  contact
}: ContactDetailsModalProps) {
  if (!contact) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'N/A';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-500';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativo') || statusLower.includes('active')) return 'bg-green-500';
    if (statusLower.includes('inativo') || statusLower.includes('inactive')) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getStatusTextColor = (status: string) => {
    if (!status) return 'text-gray-300';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativo') || statusLower.includes('active')) return 'text-green-300';
    if (statusLower.includes('inativo') || statusLower.includes('inactive')) return 'text-red-300';
    return 'text-yellow-300';
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
            <GlassCard className="w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {contact.nome_identificado || contact.nome || 'Contato'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      ID: {contact.chatId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)} ${getStatusTextColor(contact.status)}`}>
                    {contact.status || 'Ativo'}
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Informações Principais */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">Nome Identificado</span>
                    </div>
                    <p className="text-gray-300">
                      {contact.nome_identificado || 'Não identificado'}
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">Telefone</span>
                    </div>
                    <p className="text-gray-300">{contact.telefone}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">Email</span>
                    </div>
                    <p className="text-gray-300">{contact.email || 'N/A'}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-medium">Lead Score</span>
                    </div>
                    <p className="text-gray-300 font-bold text-lg">{contact.leadScore || 0}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-4 h-4 text-orange-400" />
                      <span className="text-white font-medium">Etapa do Funil</span>
                    </div>
                    <p className="text-gray-300">{contact.etapaFunil || 'Prospecto'}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">Lead Qualificado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.isLeadQualificado ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={contact.isLeadQualificado ? 'text-green-400' : 'text-red-400'}>
                        {contact.isLeadQualificado ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Status Especial */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">É Lead</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.lead === 'sim' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={contact.lead === 'sim' ? 'text-green-400' : 'text-red-400'}>
                        {contact.lead === 'sim' ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-white font-medium">Precisa Atendimento Humano</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.precisaAtendimentoHumano ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      <span className={contact.precisaAtendimentoHumano ? 'text-red-400' : 'text-green-400'}>
                        {contact.precisaAtendimentoHumano ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Valor Estimado */}
                {contact.valorEstimado && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Valor Estimado</span>
                    </div>
                    <p className="text-green-300 text-2xl font-bold">
                      {formatCurrency(contact.valorEstimado)}
                    </p>
                  </motion.div>
                )}

                {/* Interesse */}
                {contact.interesse && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">Interesse</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{contact.interesse}</p>
                  </motion.div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      <span className="text-white font-medium">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Detalhes de Agendamento */}
                {contact.detalhes_agendamento && Object.keys(contact.detalhes_agendamento).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="text-white font-medium">Detalhes de Agendamento</span>
                    </div>
                    <div className="space-y-3">
                      {Array.isArray(contact.detalhes_agendamento) && contact.detalhes_agendamento.map((agendamento: any, index: number) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Tipo:</span>
                              <span className="text-white ml-2">{agendamento.tipo_agendamento || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Data:</span>
                              <span className="text-white ml-2">{agendamento.data_agendada || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Horário:</span>
                              <span className="text-white ml-2">{agendamento.horario_agendado || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Identificado:</span>
                              <span className={`ml-2 ${agendamento.agendamento_identificado ? 'text-green-400' : 'text-red-400'}`}>
                                {agendamento.agendamento_identificado ? 'Sim' : 'Não'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Resumo para Atendente */}
                {contact.resumoParaAtendente && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-yellow-500/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-medium">Resumo para Atendente</span>
                    </div>
                    <p className="text-yellow-200 leading-relaxed">{contact.resumoParaAtendente}</p>
                  </motion.div>
                )}

                {/* Datas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">Última Mensagem Recebida</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDate(contact.data_ultima_mensagem_recebida)}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">Última Mensagem Enviada</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDate(contact.data_ultima_mensagem_enviada)}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">Data da Última Análise</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDate(contact.data_ultima_analise)}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-white font-medium">Última Notificação</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDate(contact.ultima_notificacao_atendimento_humano)}</p>
                  </div>
                </motion.div>

                {/* Notas */}
                {contact.notas && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span className="text-white font-medium">Notas</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{contact.notas}</p>
                  </motion.div>
                )}

                {/* Datas de Sistema */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-medium">Data de Criação</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDate(contact.dataCriacao)}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span className="text-white font-medium">Última Atualização</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDate(contact.dataAtualizacao)}</p>
                  </div>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
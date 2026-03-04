'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

interface Conversation {
  id: string;
  leadName: string;
  leadContact: string;
  channel: 'whatsapp' | 'email' | 'chat';
  status: 'active' | 'completed' | 'paused';
  lastMessage: string;
  duration: string;
  messages: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  aiConfidence: number;
  startedAt: string;
}

interface Message {
  id: string;
  sender: 'ai' | 'lead';
  content: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

const ClientConversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando dados de conversas
    const mockConversations: Conversation[] = [
      {
        id: '1',
        leadName: 'João Silva',
        leadContact: '+55 11 99999-8888',
        channel: 'whatsapp',
        status: 'active',
        lastMessage: 'Thanks for the information!',
        duration: '15 min',
        messages: 8,
        sentiment: 'positive',
        aiConfidence: 92,
        startedAt: '2024-01-22T14:30:00Z'
      },
      {
        id: '2',
        leadName: 'Maria Santos',
        leadContact: 'maria@email.com',
        channel: 'email',
        status: 'completed',
        lastMessage: 'Let me review the proposal',
        duration: '2 hours',
        messages: 12,
        sentiment: 'neutral',
        aiConfidence: 78,
        startedAt: '2024-01-22T12:00:00Z'
      },
      {
        id: '3',
        leadName: 'Carlos Oliveira',
        leadContact: '+55 11 88888-7777',
        channel: 'chat',
        status: 'paused',
        lastMessage: 'I need to check with my team',
        duration: '45 min',
        messages: 6,
        sentiment: 'neutral',
        aiConfidence: 65,
        startedAt: '2024-01-22T13:15:00Z'
      }
    ];

    setConversations(mockConversations);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Simulando mensagens da conversa selecionada
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: 'ai',
          content: 'Olá! Vi que você demonstrou interesse nos nossos serviços. Como posso ajudar?',
          timestamp: '14:30',
          sentiment: 'neutral'
        },
        {
          id: '2',
          sender: 'lead',
          content: 'Oi! Sim, estou interessado em saber mais sobre os preços.',
          timestamp: '14:32',
          sentiment: 'positive'
        },
        {
          id: '3',
          sender: 'ai',
          content: 'Excelente! Temos diferentes planos que se adaptam às suas necessidades. O plano básico começa em R$ 99/mês. Gostaria que eu envie uma proposta detalhada?',
          timestamp: '14:33',
          sentiment: 'positive'
        },
        {
          id: '4',
          sender: 'lead',
          content: 'Sim, por favor. Qual é a diferença entre os planos?',
          timestamp: '14:35',
          sentiment: 'neutral'
        },
        {
          id: '5',
          sender: 'ai',
          content: 'Vou explicar rapidamente: O Básico inclui até 1000 contatos, o Profissional até 5000, e o Enterprise é ilimitado. Todos incluem IA avançada. Enviarei a proposta completa por email.',
          timestamp: '14:36',
          sentiment: 'positive'
        },
        {
          id: '6',
          sender: 'lead',
          content: 'Obrigado! Vou aguardar a proposta.',
          timestamp: '14:38',
          sentiment: 'positive'
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return Phone;
      case 'email': return Mail;
      case 'chat': return MessageCircle;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.leadContact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and analyze AI-lead interactions in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            AI Active on 3 channels
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {filteredConversations.map((conversation, index) => {
              const ChannelIcon = getChannelIcon(conversation.channel);
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <ChannelIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {conversation.leadName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {conversation.leadContact}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                    {conversation.lastMessage}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{conversation.messages} messages</span>
                    <span>{conversation.duration}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getSentimentColor(conversation.sentiment)}`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {conversation.sentiment}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      AI: {conversation.aiConfidence}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedConversation.leadName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedConversation.leadContact}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversation Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedConversation.messages}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedConversation.aiConfidence}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI Confidence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {selectedConversation.sentiment}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sentiment</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-3 ${message.sender === 'lead' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${
                      message.sender === 'lead' ? 'flex-row' : 'flex-row-reverse'
                    }`}>
                      <div className={`p-2 rounded-full ${
                        message.sender === 'lead'
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'bg-blue-500'
                      }`}>
                        {message.sender === 'lead' ? (
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`p-4 rounded-2xl ${
                        message.sender === 'lead'
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'bg-blue-500 text-white'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp}
                          </span>
                          {message.sentiment && (
                            <div className={`w-2 h-2 rounded-full ${getSentimentColor(message.sentiment)}`}></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a conversation from the list to view details and messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientConversations;
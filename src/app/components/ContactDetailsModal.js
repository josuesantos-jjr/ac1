'use client';

export default function ContactDetailsModal({ isOpen, onClose, contact }) {
  if (!isOpen || !contact) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    if (!status) return '#6c757d';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativo') || statusLower.includes('active')) return '#28a745';
    if (statusLower.includes('inativo') || statusLower.includes('inactive')) return '#dc3545';
    return '#ffc107';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #dee2e6',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#495057' }}>
              {contact.nome_identificado || contact.nome || 'Contato'}
            </h2>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
              ID: {contact.chatId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            backgroundColor: getStatusColor(contact.status),
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {contact.status || 'Ativo'}
          </span>
        </div>

        {/* Informações Principais */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Nome Identificado
            </label>
            <p style={{ margin: 0, color: '#6c757d' }}>
              {contact.nome_identificado || 'Não identificado'}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Telefone
            </label>
            <p style={{ margin: 0, color: '#6c757d' }}>
              {contact.telefone}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Email
            </label>
            <p style={{ margin: 0, color: '#6c757d' }}>
              {contact.email || 'N/A'}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Lead Score
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontWeight: 'bold' }}>
              {contact.leadScore || 0}
            </p>
          </div>
        </div>

        {/* Etapa do Funil e Qualificação */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Etapa do Funil
            </label>
            <p style={{ margin: 0, color: '#6c757d' }}>
              {contact.etapaFunil || 'Prospecto'}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Lead Qualificado
            </label>
            <p style={{ margin: 0, color: contact.isLeadQualificado ? '#28a745' : '#dc3545' }}>
              {contact.isLeadQualificado ? 'Sim' : 'Não'}
            </p>
          </div>
        </div>

        {/* É Lead */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
            É Lead
          </label>
          <p style={{ margin: 0, color: contact.lead === 'sim' ? '#28a745' : '#dc3545' }}>
            {contact.lead === 'sim' ? 'Sim' : 'Não'}
          </p>
        </div>

        {/* Interesse */}
        {contact.interesse && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Interesse
            </label>
            <p style={{ margin: 0, color: '#6c757d', lineHeight: '1.5' }}>
              {contact.interesse}
            </p>
          </div>
        )}

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '8px' }}>
              Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {contact.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    background: '#e9ecef',
                    color: '#495057',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detalhes de Agendamento */}
        {contact.detalhes_agendamento && Object.keys(contact.detalhes_agendamento).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '8px' }}>
              Detalhes de Agendamento
            </label>
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
              {contact.detalhes_agendamento.map && contact.detalhes_agendamento.map((agendamento, index) => (
                <div key={index} style={{ marginBottom: index < contact.detalhes_agendamento.length - 1 ? '12px' : 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                    <div><strong>Tipo:</strong> {agendamento.tipo_agendamento || 'N/A'}</div>
                    <div><strong>Data:</strong> {agendamento.data_agendada || 'N/A'}</div>
                    <div><strong>Horário:</strong> {agendamento.horario_agendado || 'N/A'}</div>
                    <div><strong>Identificado:</strong> {agendamento.agendamento_identificado ? 'Sim' : 'Não'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo para Atendente */}
        {contact.resumoParaAtendente && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Resumo para Atendente
            </label>
            <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
              <p style={{ margin: 0, color: '#856404', lineHeight: '1.5' }}>
                {contact.resumoParaAtendente}
              </p>
            </div>
          </div>
        )}

        {/* Precisa Atendimento Humano */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
            Precisa Atendimento Humano
          </label>
          <p style={{ margin: 0, color: contact.precisaAtendimentoHumano ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
            {contact.precisaAtendimentoHumano ? 'Sim' : 'Não'}
          </p>
        </div>

        {/* Valor Estimado */}
        {contact.valorEstimado && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Valor Estimado
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '18px', fontWeight: 'bold' }}>
              {formatCurrency(contact.valorEstimado)}
            </p>
          </div>
        )}

        {/* Datas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Última Mensagem Recebida
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '12px' }}>
              {formatDate(contact.data_ultima_mensagem_recebida)}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Última Mensagem Enviada
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '12px' }}>
              {formatDate(contact.data_ultima_mensagem_enviada)}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Data da Última Análise
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '12px' }}>
              {formatDate(contact.data_ultima_analise)}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Última Notificação
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '12px' }}>
              {formatDate(contact.ultima_notificacao_atendimento_humano)}
            </p>
          </div>
        </div>

        {/* Notas */}
        {contact.notas && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Notas
            </label>
            <p style={{ margin: 0, color: '#6c757d', lineHeight: '1.5' }}>
              {contact.notas}
            </p>
          </div>
        )}

        {/* Datas de Criação e Atualização */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid #dee2e6' }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Data de Criação
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '12px' }}>
              {formatDate(contact.dataCriacao)}
            </p>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#495057', display: 'block', marginBottom: '4px' }}>
              Última Atualização
            </label>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '12px' }}>
              {formatDate(contact.dataAtualizacao)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
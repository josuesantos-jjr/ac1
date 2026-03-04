'use client';

export default function CrmAnalyticsView({ contacts }) {
  // Calcular estatísticas
  const totalContacts = contacts.length;
  const leads = contacts.filter(c => c.lead === 'sim').length;
  const qualifiedLeads = contacts.filter(c => c.isLeadQualificado).length;

  // Agrupar por etapa do funil
  const etapaStats = contacts.reduce((acc, contact) => {
    const etapa = contact.etapaFunil || 'Prospecto';
    acc[etapa] = (acc[etapa] || 0) + 1;
    return acc;
  }, {});

  // Calcular média de lead score
  const avgLeadScore = totalContacts > 0
    ? Math.round(contacts.reduce((sum, c) => sum + (c.leadScore || 0), 0) / totalContacts)
    : 0;

  // Contatos com atendimento humano necessário
  const needsHumanAttention = contacts.filter(c => c.precisaAtendimentoHumano).length;

  return (
    <div style={{ padding: '20px' }}>
      <h3>📈 Análises e Estatísticas</h3>

      {contacts.length === 0 ? (
        <p>Nenhum contato encontrado. Clique em "📥 Importar dados.json" para carregar os dados.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Cards de Estatísticas Principais */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {totalContacts}
            </h4>
            <p style={{ margin: '0', opacity: '0.9' }}>Total de Contatos</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {leads}
            </h4>
            <p style={{ margin: '0', opacity: '0.9' }}>Leads Identificados</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {qualifiedLeads}
            </h4>
            <p style={{ margin: '0', opacity: '0.9' }}>Leads Qualificados</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: 'bold' }}>
              {avgLeadScore}
            </h4>
            <p style={{ margin: '0', opacity: '0.9' }}>Lead Score Médio</p>
          </div>

          {/* Estatísticas de Funil */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>Distribuição por Etapa do Funil</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {Object.entries(etapaStats).map(([etapa, count]) => (
                <div key={etapa} style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    {etapa}
                  </div>
                  <div style={{
                    background: '#e9ecef',
                    height: '8px',
                    borderRadius: '4px',
                    marginTop: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: '#007bff',
                      height: '100%',
                      width: `${totalContacts > 0 ? (count / totalContacts) * 100 : 0}%`,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas e Ações Necessárias */}
          {needsHumanAttention > 0 && (
            <div style={{
              gridColumn: '1 / -1',
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '15px',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                ⚠️ Atenção Necessária
              </h4>
              <p style={{ margin: '0', color: '#856404' }}>
                {needsHumanAttention} contato(s) precisam de atendimento humano.
                Verifique os detalhes de agendamento e resumos para atendente.
              </p>
            </div>
          )}

          {/* Conversões e Taxas */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Taxas de Conversão</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {totalContacts > 0 ? Math.round((leads / totalContacts) * 100) : 0}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Taxa de Leads
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                  {leads > 0 ? Math.round((qualifiedLeads / leads) * 100) : 0}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Taxa de Qualificação
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                  {totalContacts > 0 ? Math.round((needsHumanAttention / totalContacts) * 100) : 0}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  Precisam Atendimento
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
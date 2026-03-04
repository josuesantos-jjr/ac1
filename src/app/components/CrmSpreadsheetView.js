'use client';

export default function CrmSpreadsheetView({ contacts, onUpdateContact }) {
  return (
    <div style={{ padding: '20px' }}>
      <h3>📊 Visualização em Planilha</h3>
      <p>Total de contatos: {contacts.length}</p>

      {contacts.length === 0 ? (
        <p>Nenhum contato encontrado. Clique em "📥 Importar dados.json" para carregar os dados.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Telefone</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Etapa Funil</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Lead Score</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {contact.nome || contact.nome_identificado || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {contact.telefone}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {contact.etapaFunil}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {contact.leadScore}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {contact.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
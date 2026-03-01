'use client'; // Precisa ser client component para usar hooks como useState, useEffect

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Hooks para obter clientId e navegar
import Link from 'next/link'; // Para o botão Voltar

// Define um objeto com os valores padrão e descrições para cada regra (igual ao modal)
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
    description:
      'Primeiro dia da semana para disparos (ex: segunda, terça, ...)',
  },
  DIA_FINAL: {
    value: 'sexta',
    description: 'Último dia da semana para disparos (ex: sexta, sábado, ...)',
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
  MIDIA: {
    value: '',
    description:
      'Nome do arquivo de mídia na pasta "media" do cliente (opcional)',
  },
};

export default function RegrasDisparoPage() {
  const params = useParams();
  const router = useRouter(); // Hook para navegação programática (ex: após salvar)
  // O clientId virá como 'ativos%2FAlpha', precisamos decodificar
  const encodedClientId = params.clientId;
  const clientId = encodedClientId ? decodeURIComponent(encodedClientId) : null;

  const [regras, setRegras] = useState({});
  const [loading, setLoading] = useState(true); // Loading geral para regras
  const [error, setError] = useState(null);
  const [listasDisponiveis, setListasDisponiveis] = useState([]);
  const [loadingListas, setLoadingListas] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false); // Estado para mensagem de sucesso

  // Estado derivado para listas selecionadas (array)
  const listasSelecionadas = regras.DISPARO_LISTAS_SELECIONADAS
    ? regras.DISPARO_LISTAS_SELECIONADAS.split(',').filter(Boolean)
    : [];

  // Função para buscar as regras atuais
  const fetchRegras = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    setSaveSuccess(false); // Limpa sucesso ao recarregar
    try {
      const response = await fetch(
        `/api/regras-disparo?clientId=${encodeURIComponent(clientId)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar regras');
      }
      const regrasCompletas = {};
      Object.keys(REGRAS_DEFAULT).forEach((key) => {
        regrasCompletas[key] =
          data[key] !== undefined ? data[key] : REGRAS_DEFAULT[key].value;
      });
      setRegras(regrasCompletas);
    } catch (err) {
      console.error('Erro ao buscar regras:', err);
      setError(`Erro ao carregar regras: ${err.message}`);
      const defaultValues = {};
      Object.keys(REGRAS_DEFAULT).forEach((key) => {
        defaultValues[key] = REGRAS_DEFAULT[key].value;
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
      // Não define o erro principal aqui para não sobrescrever erro de regras
      // Poderia ter um estado de erro separado para listas
      setListasDisponiveis([]);
    } finally {
      setLoadingListas(false);
    }
  }, [clientId]);

  // Busca regras e listas quando a página carrega (ou clientId muda)
  useEffect(() => {
    if (clientId) {
      fetchRegras();
      fetchListas();
    }
  }, [clientId, fetchRegras, fetchListas]); // Adiciona fetchRegras e fetchListas como dependências

  // Handler para mudança nos inputs normais e na estratégia
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegras((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSaveSuccess(false); // Limpa sucesso ao modificar
  };

  // Handler para mudança nos checkboxes das listas
  const handleListaSelectionChange = (e) => {
    const { value, checked } = e.target;
    const currentSelected = regras.DISPARO_LISTAS_SELECIONADAS
      ? regras.DISPARO_LISTAS_SELECIONADAS.split(',').filter(Boolean)
      : [];
    let newSelected;
    if (checked) {
      newSelected = [...currentSelected, value];
    } else {
      newSelected = currentSelected.filter((name) => name !== value);
    }
    setRegras((prev) => ({
      ...prev,
      DISPARO_LISTAS_SELECIONADAS: newSelected.join(','),
    }));
    setSaveSuccess(false); // Limpa sucesso ao modificar
  };

  // Handler para salvar as regras
  const handleSave = async () => {
    setLoading(true); // Usar loading geral
    setError(null);
    setSaveSuccess(false);
    try {
      const regrasParaSalvar = { ...regras };
      if (regrasParaSalvar.DISPARO_ESTRATEGIA !== 'selecionadas') {
        regrasParaSalvar.DISPARO_LISTAS_SELECIONADAS = '';
      }

      const response = await fetch('/api/regras-disparo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, regras: regrasParaSalvar }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar regras');
      }
      console.log('Regras salvas:', result.message);
      setSaveSuccess(true); // Indica sucesso
      // Opcional: recarregar regras após salvar para confirmar
      // fetchRegras();
      // Não redireciona automaticamente, permite que o usuário veja a mensagem de sucesso
      // router.back(); // Ou router.push('/algum-lugar');
    } catch (err) {
      console.error('Erro ao salvar regras:', err);
      setError(`Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderiza mensagem se clientId não for encontrado na URL
  if (!clientId) {
    return (
      <div className="page-container">
        <h1>Erro</h1>
        <p>ClientId não encontrado na URL.</p>
        <Link href="/" className="back-button">
          Voltar para Início
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Editar Regras de Disparo</h1>
        <p className="client-id-display">Cliente: {clientId}</p>
        {/* Link para voltar */}
        <Link href="/" className="back-button top-right">
          Voltar
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {saveSuccess && (
        <div className="success-message">Regras salvas com sucesso!</div>
      )}

      {loading && !Object.keys(regras).length ? (
        <p>Carregando regras...</p>
      ) : (
        <div className="form-content">
          {/* Seção de Estratégia de Disparo */}
          <div className="form-group strategy-group">
            <label>Estratégia de Disparo</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="DISPARO_ESTRATEGIA"
                  value="todas_ativas"
                  checked={regras.DISPARO_ESTRATEGIA === 'todas_ativas'}
                  onChange={handleChange}
                  disabled={loading}
                />
                Disparar para todas as listas ATIVAS
              </label>
              <label>
                <input
                  type="radio"
                  name="DISPARO_ESTRATEGIA"
                  value="selecionadas"
                  checked={regras.DISPARO_ESTRATEGIA === 'selecionadas'}
                  onChange={handleChange}
                  disabled={loading}
                />
                Selecionar listas específicas para disparo
              </label>
            </div>
            <p className="input-description">
              {REGRAS_DEFAULT.DISPARO_ESTRATEGIA.description}
            </p>
          </div>

          {/* Seção de Seleção de Listas (condicional) */}
          {regras.DISPARO_ESTRATEGIA === 'selecionadas' && (
            <div className="form-group list-selection-group">
              <label>Listas para Disparo</label>
              {loadingListas ? (
                <p>Carregando listas...</p>
              ) : listasDisponiveis.length === 0 ? (
                <p>Nenhuma lista encontrada na pasta de configuração.</p>
              ) : (
                <div className="checkbox-group">
                  {listasDisponiveis.map((listName) => (
                    <label key={listName}>
                      <input
                        type="checkbox"
                        value={listName}
                        checked={listasSelecionadas.includes(listName)}
                        onChange={handleListaSelectionChange}
                        disabled={loading}
                      />
                      {listName}
                    </label>
                  ))}
                </div>
              )}
              <p className="input-description">
                Marque as listas que devem ser usadas. O disparo só ocorrerá se
                a lista selecionada também estiver ATIVA.
              </p>
            </div>
          )}

          {/* Campos de Regras Normais */}
          {Object.entries(REGRAS_DEFAULT)
            .filter(
              ([key]) =>
                key !== 'DISPARO_ESTRATEGIA' &&
                key !== 'DISPARO_LISTAS_SELECIONADAS'
            )
            .map(([key, config]) => (
              <div key={key} className="form-group">
                <label htmlFor={`regra-${key}`}>{key}</label>
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
                  className="form-input"
                  disabled={loading}
                  min={
                    key.startsWith('QUANTIDADE') ||
                    key.startsWith('INTERVALO') ||
                    key.startsWith('DIAS')
                      ? '0'
                      : undefined
                  }
                />
                <p className="input-description">{config.description}</p>
              </div>
            ))}
        </div>
      )}

      <div className="button-bar">
        {/* Botão Voltar pode ir aqui ou no header */}
        {/* <button onClick={() => router.back()} className="cancel-button" disabled={loading}>Voltar</button> */}
        <button
          onClick={handleSave}
          className="save-button"
          disabled={loading || loadingListas}
        >
          {loading ? 'Salvando...' : 'Salvar Regras'}
        </button>
      </div>

      {/* Estilos adaptados para página */}
      <style jsx>{`
        .page-container {
          padding: 30px;
          max-width: 1000px; /* Limita largura do conteúdo central */
          margin: 0 auto; /* Centraliza */
          background-color: #fff; /* Fundo branco para a página */
          min-height: 100vh; /* Garante que ocupe a altura */
        }
        .page-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #dee2e6;
          position: relative; /* Para posicionar o botão Voltar */
        }
        .page-header h1 {
          margin: 0 0 10px 0;
          color: #343a40;
        }
        .client-id-display {
          color: #6c757d;
          font-size: 1rem;
          margin: 0;
        }
        .back-button {
          display: inline-block; /* Para aplicar padding */
          padding: 10px 18px;
          border-radius: 5px;
          border: none;
          color: white !important; /* Força cor do texto */
          background-color: #6c757d;
          cursor: pointer;
          font-size: 0.95rem;
          text-decoration: none; /* Remove sublinhado do Link */
          transition: background-color 0.2s ease;
        }
        .back-button:hover {
          background-color: #5a6268;
        }
        .back-button.top-right {
          position: absolute;
          top: 0;
          right: 0;
        }

        .error-message,
        .success-message {
          padding: 12px 18px;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .success-message {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .form-content {
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e9ecef;
        }
        .form-group:last-child {
          border-bottom: none;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 1rem;
          color: #495057;
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        .input-description {
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: 6px;
          margin-bottom: 0;
        }

        /* Estilos para grupo de radio/checkbox (mantidos) */
        .strategy-group,
        .list-selection-group {
          background-color: #f8f9fa; /* Fundo mais suave para página */
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 25px;
          border: 1px solid #dee2e6;
        }
        .radio-group,
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }
        .radio-group label,
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: normal;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .radio-group input[type='radio'],
        .checkbox-group input[type='checkbox'] {
          cursor: pointer;
          margin: 0;
          width: 17px; /* Ligeiramente maior */
          height: 17px;
        }
        .list-selection-group {
          max-height: 300px; /* Um pouco mais de altura */
          overflow-y: auto;
          padding: 15px; /* Padding interno */
          border: 1px solid #ced4da;
          background-color: #fff;
        }

        .button-bar {
          display: flex;
          justify-content: flex-end; /* Alinha botão Salvar à direita */
          gap: 12px;
          padding-top: 20px;
          margin-top: 20px; /* Espaço acima da barra */
          border-top: 1px solid #dee2e6;
        }
        .button-bar button {
          padding: 12px 25px;
          border-radius: 5px;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition:
            background-color 0.2s ease,
            transform 0.1s ease;
        }
        .button-bar button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        /* Reutiliza estilos de botão do modal anterior se aplicável, ou define aqui */
        .save-button {
          background-color: #28a745;
        }
        .save-button:hover:not(:disabled) {
          background-color: #218838;
        }
        .save-button:disabled {
          background-color: #adb5bd;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

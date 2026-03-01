'use client';

import { useState } from 'react';

export default function InputWithAI({
  fieldName,
  value,
  onChange,
  placeholder,
  className = '',
  type = 'text',
  rows = 3,
  clientId,
  disabled = false,
  ...props
}) {
  const [loading, setLoading] = useState(false);

  const handleImprove = async () => {
    if (!value || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName, text: value, clientId }),
      });

      const data = await response.json();
      if (data.improvedText) {
        onChange({ target: { value: data.improvedText } });
      }
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      alert('Erro ao melhorar texto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-with-ai-container">
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-input ${className}`}
          rows={rows}
          disabled={disabled}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-input ${className}`}
          disabled={disabled}
          {...props}
        />
      )}
      <button
        type="button"
        onClick={handleImprove}
        className="improve-ai-button"
        disabled={loading || !value || disabled}
        title="Melhorar com IA"
      >
        {loading ? '...' : '🧠'}
      </button>
      <style jsx>{`
        .input-with-ai-container {
          position: relative;
        }
        .form-input {
          width: 100%;
          padding: 8px 40px 8px 12px; /* Espaço para o botão */
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .improve-ai-button {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          border-radius: 3px;
          color: #007bff;
        }
        .improve-ai-button:hover:not(:disabled) {
          background: #f0f0f0;
        }
        .improve-ai-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
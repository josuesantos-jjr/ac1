'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './OptionsMenu.module.css';

export default function OptionsMenu({
  clientName,
  clientType,
  onCopy,
  onPaste,
  onDuplicate,
  onDownloadFolder, // Nova prop para a função de download
  onRename,
  existingClients = [], // Nova prop para validação de nomes existentes
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.optionsContainer} ref={menuRef}>
      <button
        className={styles.optionsButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Opções"
      >
        {/* Three dots icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.optionsMenu}>
          <button
            onClick={() => {
              onCopy();
              setIsOpen(false);
            }}
          >
            Copiar
          </button>
          <button
            onClick={() => {
              onPaste();
              setIsOpen(false);
            }}
          >
            Colar
          </button>
          <button
            onClick={() => {
              onDuplicate();
              setIsOpen(false);
            }}
          >
            Duplicar
          </button>
          <button
            onClick={async () => {
              const currentName = clientName.includes('/') ? clientName.split('/').pop() : clientName;
              const newName = window.prompt('Novo nome para o cliente:', currentName);

              if (newName && newName.trim() !== '' && newName !== currentName) {
                const trimmedName = newName.trim();

                // Validação no frontend: verifica se o nome já existe
                const nameExists = existingClients.some((client) => {
                  const existingName = client.includes('/') ? client.split('/').pop() : client;
                  return existingName.toLowerCase() === trimmedName.toLowerCase();
                });

                if (nameExists) {
                  alert(`O nome "${trimmedName}" já está em uso. Por favor, escolha outro.`);
                  setIsOpen(false);
                  return;
                }

                if (typeof onRename === 'function') {
                  await onRename(trimmedName);
                  alert(`Renomeado com sucesso para "${trimmedName}"!`);
                } else {
                  console.error('A função onRename não foi passada para o componente OptionsMenu.');
                  alert('Erro de configuração: A função de renomear não foi conectada no componente pai. Por favor, verifique o código da página principal.');
                }
              }
              setIsOpen(false);
            }}
          >
            Renomear
          </button>
          <button
            onClick={() => {
              onDownloadFolder(); // Chama a nova função de download
              setIsOpen(false);
            }}
          >
            Baixar Pasta
          </button>

        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import styles from '../page.module.css';
import DraggableCard from './DraggableCard';

export default function DroppableSection({
  type,
  title,
  clientes,
  onEditarCliente,
  onIniciarCliente,
  onCopy,
  onPaste,
  onDuplicate,
  onRename,
  onAbrirCrmModal, // Nova prop
  onAbrirRelatorioCliente, // Nova prop
  onDownloadClientFolder, // Nova prop
  existingClients = []
}) {


  return (
    <section
      className={styles.section}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.cardGrid}>
        {console.log(`[DroppableSection ${type}] Renderizando ${clientes.length} clientes:`, clientes)}
        {clientes.length > 0 ? (
          clientes.map(cliente => (
            <DraggableCard
              key={cliente.id}
              cliente={cliente}
              onEditarCliente={onEditarCliente}
              onIniciarCliente={(clientName, folderType, action) => onIniciarCliente(clientName, folderType, action)}
              onCopy={() => onCopy(type, cliente.id)}
              onPaste={() => onPaste(type, cliente.id)}
              onDuplicate={() => onDuplicate(type, cliente.id)}
              onRename={(newName) => onRename(type, cliente.id, newName)}
              onAbrirCrmModal={() => onAbrirCrmModal(cliente.id)} // Nova prop
              onAbrirRelatorioCliente={() => onAbrirRelatorioCliente(cliente.id)} // Nova prop
              onDownloadClientFolder={onDownloadClientFolder} // Passa a prop para DraggableCard
              existingClients={existingClients}
            />
          ))
        ) : (
          <p className={styles.emptyMessage}>
            {type === 'modelos' ? 'Nenhum modelo disponível' : 'Nenhum cliente nesta seção'}
          </p>
        )}
      </div>
    </section>
  );
}
'use client'; // Add this line at the top of the file

import { useState, useEffect } from 'react';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    fetch('/api/listClientes')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar clientes: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setClientes(data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
      <h1>Clientes</h1>
      <div>
        {clientes.map((cliente) => (
          <div key={cliente.id}>{cliente.nome}</div>
        ))}
      </div>
    </div>
  );
};

export default ClientesPage;

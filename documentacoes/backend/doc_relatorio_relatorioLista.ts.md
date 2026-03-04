# Nome do Arquivo: relatorio/relatorioLista.ts
**Caminho Relativo:** src/backend/relatorio/relatorioLista.ts

## Propósito
Este arquivo implementa a geração de relatórios específicos quando uma lista de contatos é completamente processada pelo sistema de disparo. Ele calcula estatísticas detalhadas de sucesso/falha dos disparos, formata um relatório conciso e o envia automaticamente via WhatsApp para o chat de destino configurado do cliente.

## Funcionamento
O código executa um processo simplificado de relatório:

1. **Cálculo de Estatísticas:** Conta contatos totais, sucessos, falhas por WhatsApp e outras falhas.

2. **Formatação de Relatório:** Estrutura mensagem com emojis, métricas organizadas e informações contextuais.

3. **Envio Automático:** Envia relatório via WhatsApp para TARGET_CHAT_ID configurado.

4. **Tratamento de Erros:** Salva relatório localmente e notifica falhas de envio.

## Entrada de Informações
- **client (any):** Instância do cliente WhatsApp para envio.
- **clientePath (string):** Caminho do diretório do cliente.
- **listaNome (string):** Nome da lista que foi concluída.
- **lista (Lista):** Objeto da lista com array de contatos e seus status.

## Processamento de Informações
1. **Contagem de Status:** Itera sobre contatos categorizando por status de disparo.

2. **Carregamento de Configuração:** Busca TARGET_CHAT_ID no arquivo infoCliente.json.

3. **Validação de Destino:** Verifica se chat de destino está configurado.

4. **Formatação de Mensagem:** Cria texto estruturado com nome cliente, lista e estatísticas.

5. **Envio Seguro:** Tenta enviar e notifica sobre falhas.

## Saída de Informações
- **Mensagem WhatsApp:** Relatório formatado enviado para TARGET_CHAT_ID.
- **Logs de Operação:** Informações sobre processamento e status de envio.

## Dependências
- **fs (node:fs):** Operações síncronas de leitura de arquivo.
- **path:** Manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { criarEnviarRelatorioLista } from './relatorioLista';

// Quando uma lista é concluída no sistema de disparo
await criarEnviarRelatorioLista(
  clienteWhatsApp,
  "/caminho/do/cliente",
  "Lista_VIP_2025",
  {
    contatos: [
      { nome: "João", telefone: "11999999999", disparo: "sim" },
      { nome: "Maria", telefone: "11888888888", disparo: "falha_wpp" }
    ]
  }
);

// Resultado: Relatório enviado via WhatsApp informando 1 sucesso e 1 falha
```

## Notas Adicionais
- **Relatório Conciso:** Focado em métricas essenciais de conclusão de lista.
- **Integração Automática:** Chamado automaticamente quando lista finaliza no sistema principal.
- **Notificações de Erro:** Sistema robusto informa quando envio falha.
- **Formatado para WhatsApp:** Usa emojis e formatação adequada para leitura móvel.
- **Configuração Obrigatória:** Requer TARGET_CHAT_ID definido para funcionar.
# Nome do Arquivo: analiseConversa/identificarAgendamento.ts
**Caminho Relativo:** src/backend/analiseConversa/identificarAgendamento.ts

## Propósito
Este arquivo implementa uma função para identificar e extrair informações de agendamento de conversas de chat usando inteligência artificial. Ele analisa o texto da conversa para detectar datas e horários de agendamentos marcados, retornando essas informações em formato estruturado para uso em sistemas de CRM ou calendários de atendimento.

## Funcionamento
O código executa os seguintes passos principais:

1. **Construção do Prompt:** Cria um prompt específico instruindo a IA a identificar agendamentos na conversa, solicitando retorno em formato estruturado com data e horário.

2. **Chamada da IA:** Utiliza a função `mainGoogleBG` (serviço Google BG) para processar o prompt com a conversa fornecida, passando parâmetros como chatId, configurações de histórico e tentativas de retry.

3. **Processamento da Resposta:** Recebe a resposta da IA e usa expressões regulares para extrair a data e horário agendados do texto retornado.

4. **Formatação e Retorno:** Retorna um objeto com os campos `data_agendada` e `horario_agendado`, preenchidos com as informações extraídas ou strings vazias em caso de erro.

5. **Tratamento de Erros:** Captura exceções durante o processo e registra no console, retornando valores vazios para indicar falha na identificação.

## Entrada de Informações
- **conversation (string):** Texto completo da conversa do chat a ser analisada para identificação de agendamentos.
- **geminiKey (string):** Chave da API Gemini (aparentemente não utilizada diretamente nesta função, mas passada como parâmetro).
- **chatId (string):** Identificador único do chat, usado na chamada do serviço Google BG.
- **clientePath (string):** Caminho do diretório do cliente, passado como `__dirname` para o serviço Google BG.

## Processamento de Informações
1. **Criação do Prompt:** Monta um prompt em português solicitando identificação de agendamento, especificando formatos desejados (dd/mm/yyyy para data, hh:mm para horário).

2. **Execução da IA:** Chama o serviço `mainGoogleBG` com o prompt construído, configurando limpeza de histórico e máximo de 3 tentativas.

3. **Extração de Dados:** Aplica regex patterns para capturar os valores entre aspas após "data_agendada:" e "horario_agendado:" na resposta da IA.

4. **Validação:** Se as regex não encontrarem correspondências, retorna strings vazias.

## Saída de Informações
- **Retorno da Função:** Objeto com duas propriedades:
  - `data_agendada` (string): Data identificada no formato esperado ou string vazia
  - `horario_agendado` (string): Horário identificado no formato esperado ou string vazia
- **Logs de Erro:** Em caso de falha, registra mensagem de erro no console com detalhes da exceção.

## Dependências
- **mainGoogleBG:** Função importada de `../service/googleBG.ts`, responsável pela integração com o serviço de IA Google BG para processamento de mensagens.

## Exemplo de Uso
```typescript
import { identificarAgendamento } from './identificarAgendamento';

const conversa = "Cliente: Podemos marcar uma reunião na quinta-feira às 14h? Atendente: Perfeito, fica agendado para 05/12/2024 às 14:00.";
const resultado = await identificarAgendamento(
  conversa,
  "chave-gemini-aqui",
  "chat123",
  "/caminho/do/cliente"
);

console.log("Data agendada:", resultado.data_agendada); // "05/12/2024"
console.log("Horário agendado:", resultado.horario_agendado); // "14:00"
```

## Notas Adicionais
- **Formato Específico:** O prompt solicita datas em formato brasileiro (dd/mm/yyyy) e horários simples (hh:mm), facilitando integração com sistemas locais.
- **Robustez:** Implementa retry automático (até 3 tentativas) para lidar com falhas temporárias da IA.
- **Tratamento de Erros:** Retorna valores vazios em vez de lançar exceções, permitindo processamento contínuo mesmo com falhas.
- **Limitações:** Depende da qualidade da resposta da IA; se o formato não for seguido exatamente, a extração pode falhar.
- **Performance:** Faz chamada síncrona para IA, o que pode impactar performance em cenários de alto volume.
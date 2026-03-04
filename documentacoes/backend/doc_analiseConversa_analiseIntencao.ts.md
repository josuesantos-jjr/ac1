# Nome do Arquivo: analiseConversa/analiseIntencao.ts
**Caminho Relativo:** src/backend/analiseConversa/analiseIntencao.ts

## Propósito
Este arquivo implementa uma função para analisar conversas de chat usando inteligência artificial (IA) do Google Gemini, com o objetivo de identificar a principal intenção do contato (usuário) baseado no histórico da conversa. Ele classifica a intenção em categorias pré-definidas, como interesse futuro, falta de interesse, pedido de informação, entre outras, auxiliando na qualificação de leads e direcionamento de respostas automáticas em sistemas de atendimento.

## Funcionamento
O código funciona através dos seguintes passos principais:

1. **Configuração Inicial:** Define configurações de geração de texto (temperatura baixa para precisão, limite de tokens) e configurações de segurança para bloquear conteúdo prejudicial.

2. **Prompt de Análise:** Utiliza um prompt estruturado que instrui a IA a analisar o histórico da conversa e responder apenas com uma categoria válida de intenção.

3. **Inicialização do Modelo:** Cria uma instância do modelo Gemini usando uma chave de API fornecida, com tratamento de erros para casos onde a chave não está disponível.

4. **Validação de Entrada:** Verifica se o histórico de conversa não está vazio, retornando "INDETERMINADO" caso contrário.

5. **Processamento IA:** Substitui o placeholder no prompt com o histórico real, inicia um chat com o modelo e envia a mensagem para análise.

6. **Validação de Resposta:** Recebe a resposta da IA, converte para maiúsculo, verifica se corresponde a uma categoria válida e retorna o resultado apropriado.

7. **Tratamento de Erros:** Captura e registra erros durante a inicialização do modelo ou análise, retornando códigos de erro específicos.

## Entrada de Informações
- **conversationHistory (string):** Histórico formatado da conversa do chat, contendo as mensagens trocadas entre o usuário e o sistema.
- **geminiKey (string):** Chave de API específica do cliente para acessar o serviço Google Generative AI (Gemini).
- **logger (objeto):** Instância de logger para registrar operações, erros e informações durante a execução.

## Processamento de Informações
1. **Validação da Chave API:** Verifica se a chave Gemini foi fornecida; caso contrário, registra um aviso.
2. **Inicialização do Modelo:** Cria uma conexão com o modelo 'gemini-2.5-flash-lite' usando a chave fornecida.
3. **Preparação do Prompt:** Substitui o marcador {conversation_history} no prompt padrão com o histórico real fornecido.
4. **Execução da Análise:** Envia o prompt completo para o modelo IA e aguarda a resposta.
5. **Processamento da Resposta:** Limpa a resposta (remove espaços extras, converte para maiúsculo) e valida contra uma lista de categorias permitidas.
6. **Classificação:** Se a resposta corresponder a uma categoria válida, retorna ela; caso contrário, classifica como "OUTRO" ou retorna erro.

## Saída de Informações
- **Retorno da Função:** Uma string representando a categoria de intenção identificada (ex: "PEDIDO_INFORMACAO", "SEM_INTERESSE") ou um código de erro (ex: "ERRO_ANALISE_MODELO", "ERRO_ANALISE_IA").
- **Logs:** Registra informações sobre o progresso da análise, avisos sobre entradas inválidas e erros ocorridos durante o processamento.

## Dependências
- **@google/generative-ai:** Biblioteca oficial do Google para integração com o serviço Generative AI (Gemini). Utilizada para criar instâncias do modelo e enviar mensagens.
- **Logger:** Um objeto de logging passado como parâmetro (não importado diretamente), usado para registrar operações e erros. Idealmente, deve ser uma instância de um logger estruturado como Winston ou similar.

## Exemplo de Uso
```typescript
import { analisarIntencao } from './analiseIntencao';

const historico = "Usuário: Olá, quanto custa o produto X?\nSistema: O preço é R$ 100.";
const chaveGemini = "sua-chave-api-aqui";
const logger = console; // Ou uma instância real de logger

analisarIntencao(historico, chaveGemini, logger)
  .then(intencao => console.log("Intenção identificada:", intencao))
  .catch(erro => console.error("Erro:", erro));
```

## Notas Adicionais
- **Configurações de Segurança:** Implementa filtros para bloquear conteúdo prejudicial em categorias como assédio, discurso de ódio e conteúdo perigoso, garantindo uso ético da IA.
- **Limitações:** Dependente da qualidade da chave API Gemini; sem ela, a análise pode falhar. A resposta é limitada a 50 tokens para manter precisão e eficiência.
- **Tratamento de Erros:** Retorna códigos específicos para diferentes tipos de falha, facilitando depuração e tratamento upstream.
- **Performance:** Usa temperatura baixa (0.2) para respostas consistentes e previsíveis, adequadas para classificação categórica.
- **Melhorias Sugeridas:** Considerar implementação de cache para prompts similares ou validação adicional da qualidade do histórico de conversa antes da análise.
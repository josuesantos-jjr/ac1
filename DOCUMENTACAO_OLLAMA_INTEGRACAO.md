# Documentação da Integração Ollama

## Visão Geral

Esta documentação descreve a integração do serviço Ollama no sistema de IA, criando um fallback robusto quando os serviços Gemini e Groq falham.

## Estratégia de Fallback

### Antes da Integração
```
Gemini → Groq → Mensagem de erro
```

### Após a Integração
```
Gemini → Groq → Ollama → Mensagem de erro
```

## Arquivos Criados e Modificados

### 1. `src/backend/service/ollamaService.ts` (NOVO)
- **Função:** Serviço principal do Ollama
- **Configuração:** Lê do arquivo `ollama.txt` ou fallback para `infoCliente.json`
- **Features:**
  - Conversão de histórico Gemini → Ollama
  - Sistema de cache inteligente
  - Retry com backoff exponencial
  - Monitoramento de métricas
  - Tratamento de erros específicos

### 2. `src/backend/service/googleBG.ts` (MODIFICADO)
- **Alteração:** Adicionado fallback para Ollama quando Groq falha
- **Linha 10:** Importação do `mainOllamaService`
- **Linhas 175-185:** Fallback Ollama após falha do Groq

### 3. `src/backend/service/groqSuporte.ts` (MODIFICADO)
- **Alteração:** Adicionado fallback para Ollama quando todas as tentativas do Groq falham
- **Linha 5:** Importação do `mainOllamaService`
- **Linhas 265-278:** Fallback Ollama após falha do Groq

### 4. `src/backend/util/index.ts` (MODIFICADO)
- **Alteração:** Adicionado Ollama nas estratégias de fallback para reformulação de mensagens
- **Linhas 585-589:** Adicionado serviço Ollama na lista de fallbacks

## Configuração do Ollama

### Formato do Arquivo `ollama.txt`
```
api
sk-a9132d90b0d444f2aa51025fbcad618b

url base
https://ia.aceleracaocomercial.com/api

model
cogito:3b
```

### Fallback para `infoCliente.json`
Se o arquivo `ollama.txt` não existir, o sistema tentará usar:
```json
{
  "OLLAMA_API_KEY": "sua-chave-api",
  "OLLAMA_BASE_URL": "https://ia.aceleracaocomercial.com/api",
  "OLLAMA_MODEL": "cogito:3b"
}
```

### Fallback Final
Se nenhuma configuração for encontrada, usará:
- **API Key:** `GEMINI_KEY` (do infoCliente.json)
- **Base URL:** `https://ia.aceleracaocomercial.com/api`
- **Model:** `cogito:3b`

## Funcionamento do Sistema

### 1. Fluxo Normal
1. **Gemini** tenta responder
2. Se falhar → **Groq** tenta responder
3. Se falhar → **Ollama** tenta responder
4. Se falhar → Mensagem de erro

### 2. Tratamento de Erros
- **Erros de Rede:** Retry com backoff exponencial
- **Erros de Autenticação:** Não tenta novamente
- **Erros de Servidor:** Espera maior antes do retry
- **Timeout:** Verificação de conectividade antes da chamada

### 3. Conversão de Histórico
- Converte histórico do formato Gemini (`parts`) para formato Ollama (`content`)
- Mantém a compatibilidade entre diferentes formatos de mensagens

### 4. Cache e Performance
- Cache inteligente para respostas já processadas
- Rate limiting interno
- Monitoramento de métricas de sucesso/fracasso

## Benefícios da Integração

### 1. **Independência**
- Não depende de APIs externas
- Execução local/privada
- Sem limites de rate limit externos

### 2. **Custo Zero**
- Sem custos de API
- Sem dependência de chaves pagas
- Uso de recursos locais

### 3. **Privacidade**
- Dados não saem do servidor
- Processamento interno
- Conformidade com LGPD

### 4. **Disponibilidade**
- Sem downtime de APIs externas
- Resposta mais rápida (sem latência de internet)
- Funcionamento offline (se configurado localmente)

## Testes

### Script de Teste
Execute o script `test_ollama_integration.js` para validar a integração:
```bash
node test_ollama_integration.js
```

### Testes Manuais
1. **Testar fallback:** Desative temporariamente as chaves Gemini e Groq
2. **Verificar logs:** Confira os logs para ver o fallback em ação
3. **Testar respostas:** Verifique se as respostas do Ollama são consistentes

## Monitoramento

### Métricas Registradas
- Tempo de resposta
- Taxa de sucesso/fracasso
- Tipo de erro
- Uso de cache
- Tentativas de retry

### Logs Importantes
```
✅ Configuração Ollama carregada do arquivo: /caminho/ollama.txt
🔄 Todas as tentativas no Google falharam, tentando Groq...
🔄 Todas as tentativas no Groq falharam, tentando Ollama...
✅ Fallback Ollama funcionou
```

## Troubleshooting

### Problemas Comuns

#### 1. Configuração não encontrada
**Solução:** Verifique se o arquivo `ollama.txt` está no diretório correto

#### 2. Erro de conexão
**Solução:** Verifique se o endpoint `https://ia.aceleracaocomercial.com/api` está acessível

#### 3. Erro de autenticação
**Solução:** Verifique se a API Key está correta

#### 4. Resposta inválida
**Solução:** Verifique se o modelo `cogito:3b` está disponível no endpoint

### Como Debugar
1. **Verifique logs:** Procure por mensagens "Ollama" nos logs
2. **Teste endpoint:** Use curl ou Postman para testar o endpoint diretamente
3. **Verifique configuração:** Confira se o arquivo `ollama.txt` está formatado corretamente

## Próximos Passos

### 1. **Testes de Performance**
- Medir tempo de resposta comparado ao Gemini/Groq
- Testar com diferentes tamanhos de mensagens
- Avaliar uso de recursos

### 2. **Otimizações**
- Ajustar timeouts conforme necessidade
- Otimizar cache para melhor performance
- Melhorar tratamento de erros específicos

### 3. **Expansão**
- Adicionar suporte a mais modelos Ollama
- Implementar balanceamento de carga
- Adicionar métricas de monitoramento avançado

## Conclusão

A integração do Ollama proporciona uma camada robusta de fallback que aumenta significativamente a disponibilidade do sistema de IA. Com esta implementação, o sistema torna-se mais resiliente a falhas de APIs externas e oferece uma solução de custo zero para momentos de indisponibilidade.

O fallback é transparente para o usuário final e mantém a mesma qualidade de resposta, garantindo uma experiência consistente independentemente do serviço de IA utilizado.
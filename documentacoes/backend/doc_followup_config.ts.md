# Nome do Arquivo: followup/config.ts
**Caminho Relativo:** src/backend/followup/config.ts

## Propósito
Este arquivo implementa o sistema de gerenciamento de configurações para o módulo de follow-up automático, fornecendo uma estrutura padronizada para armazenar e recuperar configurações de follow-up por cliente. Ele define a interface de configuração, valores padrão e funções para carregar/salvar configurações customizadas por cliente.

## Funcionamento
O código gerencia configurações de follow-up através de três operações principais:

1. **Definição de Interface:** Estabelece estrutura de dados para configurações de follow-up.

2. **Valores Padrão:** Fornece configuração base com valores sensíveis para novo clientes.

3. **Persistência:** Carrega e salva configurações em arquivos JSON específicos do cliente.

4. **Fallback:** Cria automaticamente configurações padrão se arquivo não existir.

## Entrada de Informações
- **clientePath (string):** Caminho do diretório do cliente para localizar arquivo de configuração.

## Processamento de Informações
1. **Resolução de Caminho:** Constrói caminho completo para `followupConfig.json`.

2. **Carregamento:** Lê arquivo JSON existente ou cria novo com valores padrão.

3. **Mesclagem:** Combina configurações carregadas com valores padrão para garantir completude.

4. **Validação:** Garante que todos os campos necessários estejam presentes.

## Saída de Informações
- **Arquivo followupConfig.json:** Configurações persistidas por cliente.
- **Objeto FollowUpConfig:** Retornado pelas funções de carregamento.

## Dependências
- **fs (node:fs/promises):** Operações assíncronas de arquivo.
- **path:** Manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { getFollowUpConfig, saveFollowUpConfig } from './config';

// Carregar configuração existente ou padrão
const config = await getFollowUpConfig("/caminho/do/cliente");

// Configuração contém:
// {
//   ativo: false,
//   niveis: 5,
//   promptGeral: true,
//   prompt: "Gere uma mensagem de follow-up...",
//   promptsPorNivel: ["", "", "", "", ""],
//   intervalosDias: [1, 3, 7, 15, 30],
//   recorrencia: false,
//   diasRecorrencia: 30,
//   promptAnalise: "Analise a conversa..."
// }

// Salvar configuração customizada
await saveFollowUpConfig("/caminho/do/cliente", {
  ...config,
  ativo: true,
  niveis: 3,
  intervalosDias: [2, 5, 10]
});
```

## Notas Adicionais
- **Flexibilidade:** Suporte a prompts gerais ou específicos por nível de follow-up.
- **Escalabilidade:** Intervalos configuráveis permitem sequências personalizadas.
- **Robustez:** Criação automática de diretórios e arquivos quando necessário.
- **Padronização:** Valores padrão garantem funcionamento imediato para novos clientes.
- **Validação:** Mesclagem automática evita campos ausentes em configurações existentes.
- **Recorrência:** Suporte a follow-ups recorrentes para manutenção de relacionamento.
# Nome do Arquivo: disparo/extrairListas.ts
**Caminho Relativo:** src/backend/disparo/extrairListas.ts

## Propósito
Este arquivo implementa um sistema de extração automatizada de listas de contatos a partir de fontes externas, especificamente páginas web com tabelas HTML. Ele converte dados web em estruturas JSON estruturadas para uso no sistema de disparo de mensagens, permitindo importar contatos de fontes externas de forma automatizada.

## Funcionamento
O código executa um processo de ETL (Extract, Transform, Load) para dados de contato:

1. **Leitura de Arquivo CSV:** Processa arquivo .listas contendo nomes e URLs de listas.

2. **Web Scraping:** Faz requisições HTTP para URLs especificadas e extrai dados de tabelas HTML.

3. **Parsing HTML:** Utiliza Cheerio para navegar no DOM e extrair telefone e nome de cada linha da tabela.

4. **Deduplicação:** Remove telefones duplicados usando Set para garantir unicidade.

5. **Persistência:** Salva dados extraídos como arquivos JSON estruturados.

6. **Rate Limiting:** Implementa delays entre requisições para evitar bloqueios.

## Entrada de Informações
- **arquivoListas (string):** Caminho para arquivo CSV contendo lista de fontes (nome=URL).
- **clientePath (string):** Caminho base do diretório do cliente para salvar arquivos processados.

## Processamento de Informações
1. **Parsing CSV:** Lê arquivo linha por linha, separando nome da lista e URL.

2. **Requisições HTTP:** Faz GET requests para cada URL com delay de 1-5 segundos.

3. **Extração de Tabelas:** Localiza primeira tabela HTML e itera sobre linhas de dados.

4. **Mapeamento de Dados:** Converte células da tabela em objetos {Telefone, Nome}.

5. **Validação:** Garante que pelo menos telefone está presente em cada entrada.

6. **Estruturação Final:** Retorna array de objetos com nome da lista e array de telefones únicos.

## Saída de Informações
- **Arquivos JSON:** Dados estruturados salvos em `config/listas/download/{nomeLista}.json`.
- **Array de Listas:** Retorno da função com estrutura `{nome, telefones[]}`.
- **Logs do Console:** Informações detalhadas sobre processamento de cada lista.

## Dependências
- **axios:** Cliente HTTP para fazer requisições web.
- **cheerio:** Biblioteca jQuery-like para parsing HTML.
- **csv-parser:** Parser para arquivos CSV.
- **fs (node:fs):** Operações de sistema de arquivos.
- **path:** Manipulação de caminhos de arquivo.

## Exemplo de Uso
```typescript
import { extrairListas } from './extrairListas';

// Arquivo .listas contém:
// Lista1=https://exemplo.com/contatos1
// Lista2=https://exemplo.com/contatos2

const listas = await extrairListas(
  "/caminho/para/listas.listas",
  "/caminho/do/cliente"
);

// Resultado: Array de listas processadas com telefones únicos
// [
//   { nome: "Lista1", telefones: ["11999999999", "11888888888"] },
//   { nome: "Lista2", telefones: ["11777777777", "11666666666"] }
// ]
```

## Notas Adicionais
- **Rate Limiting:** Delays configuráveis (1-5 segundos) para respeitar limites de servidores.
- **Resiliente:** Continua processamento mesmo se uma lista falhar.
- **Deduplicação:** Garante que não há telefones duplicados nas listas finais.
- **Estrutura Fixa:** Espera tabelas HTML com colunas específicas (Telefone, Nome).
- **Persistência:** Cria diretórios automaticamente se não existirem.
- **Logs Detalhados:** Facilita debugging de problemas de extração.
- **Flexibilidade:** Pode ser adaptado para diferentes formatos de tabela HTML.
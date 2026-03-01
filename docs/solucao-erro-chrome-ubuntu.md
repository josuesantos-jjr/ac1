# Solução para Erro de Dependências do Chrome no Ubuntu

## Problema Identificado
Erro: `libatk-1.0.so.0: cannot open shared object file: No such file or directory`

**Nota:** No Ubuntu 24.04 (Noble), os nomes dos pacotes foram atualizados com sufixo `t64`.

## Solução - Script Automático Corrigido

### Script Melhorado (RECOMENDADO)
```bash
# Usar o novo script corrigido
chmod +x install-chrome-deps-fixed.sh
./install-chrome-deps-fixed.sh
```

O script `install-chrome-deps-fixed.sh`:
- ✅ Detecta automaticamente a versão do Ubuntu
- ✅ Instala pacotes específicos para Ubuntu 24.04 (com sufixo t64)
- ✅ Resolve conflito do libasound2 (pacote virtual)
- ✅ Cria links simbólicos para compatibilidade
- ✅ Faz limpeza completa do cache do Puppeteer
- ✅ Força reinstalação do Chrome do Puppeteer
- ✅ Verifica se todas as dependências foram instaladas

## Solução Manual - Instalar Dependências do Chrome/Chromium

### Opção 1: Instalar Manualmente (Ubuntu 24.04)
```bash
sudo apt update
sudo apt install -y \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libatspi2.0-0t64 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2t64 \
    libcups2t64 \
    libdrm2 \
    libxkbcommon0 \
    libgbm-dev \
    libgtk-3-0t64 \
    libnss3 \
    libnspr4 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    ca-certificates \
    fonts-liberation \
    wget \
    xvfb \
    libu2f-udev \
    libsecret-1-0 \
    fonts-dejavu-core \
    xdg-utils

# Resolver conflito específico do libasound2
sudo apt install -y libasound2t64
sudo apt --fix-broken install -y

# Recriar cache do Puppeteer
npm rebuild puppeteer
```

### Opção 2: Instalar Chrome/Chromium Completo
```bash
# Instalar Chromium como alternativa
sudo apt install -y chromium-browser

# OU instalar Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable
```

## Após Instalar as Dependências

1. **Limpar cache do Puppeteer:**
   ```bash
   rm -rf ~/.cache/puppeteer
   rm -rf ./node_modules/.cache
   ```

2. **Recompilar Puppeteer:**
   ```bash
   npm rebuild puppeteer
   ```

3. **Testar novamente:**
   ```bash
   bun run clientes/CMW/index.ts
   ```

## Dependências Críticas para Ubuntu 24.04

| Pacote Original | Ubuntu 24.04 | Propósito |
|----------------|--------------|-----------|
| `libatk1.0-0` | `libatk1.0-0t64` | Acessibilidade |
| `libcups2` | `libcups2t64` | Suporte a impressão |
| `libasound2` | `libasound2t64` | Sistema de áudio |
| `libgtk-3-0` | `libgtk-3-0t64` | Interface gráfica |

## Solução para Problema Específico do libasound2

Se você receber o erro `libasound2 is a virtual package provided by...`, execute:

```bash
# Instalar versão específica
sudo apt install -y libasound2t64

# Criar links simbólicos se necessário
sudo ln -sf /usr/lib/x86_64-linux-gnu/libasound.so.2.0.0 /usr/lib/x86_64-linux-gnu/libasound.so.2
sudo ln -sf /usr/lib/x86_64-linux-gnu/libasound.so.2 /usr/lib/x86_64-linux-gnu/libasound.so

# Corrigir dependências quebradas
sudo apt --fix-broken install -y
```

## Verificação das Dependências

Para verificar se todas as dependências foram instaladas corretamente:

```bash
for lib in libatk-1.0 libcups-2 libasound-2 libgtk-3-0 libxss1 libgbm1 libxcomposite1 libxdamage1 libxrandr2; do
    if ldconfig -p | grep -q "$lib"; then
        echo "✅ $lib instalado"
    else
        echo "❌ $lib NÃO encontrado"
    fi
done
```

## Explicação Técnica

O Ubuntu 24.04 (Noble) atualizou seus pacotes para incluir sufixo `t64`, que indica transições ABI. Isso pode causar erros se os nomes antigos forem usados.

### Dependências Essenciais:
- **Acessibilidade:** `libatk1.0-0t64`
- **Impressão:** `libcups2t64` 
- **Áudio:** `libasound2t64`
- **Interface:** `libgtk-3-0t64`
- **UI Virtual:** `xvfb`
- **USB/Autenticação:** `libu2f-udev`
- **Fechaduras:** `libsecret-1-0`
- **Utilitários:** `xdg-utils`

A instalação completa resolve todos os erros de dependências em Ubuntu 24.04.
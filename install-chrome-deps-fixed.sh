#!/bin/bash

# Script para instalar dependências do Chrome/Chromium no Ubuntu
# Resolve erro: "libatk-1.0.so.0: cannot open shared object file"
# Versão corrigida para Ubuntu 24.04

echo "🔧 Instalando dependências do Chrome/Chromium (versão corrigida)..."

# Detectar versão do Ubuntu
UBUNTU_VERSION=$(lsb_release -rs)
UBUNTU_CODENAME=$(lsb_release -cs)

echo "📋 Sistema detectado: Ubuntu $UBUNTU_VERSION ($UBUNTU_CODENAME)"

# Atualizar lista de pacotes
echo "📦 Atualizando lista de pacotes..."
sudo apt update

# Instalar dependências base
echo "🔍 Instalando dependências essenciais..."

# Para Ubuntu 24.04 (Noble)
if [[ "$UBUNTU_CODENAME" == "noble" ]]; then
    echo "🎯 Detectado Ubuntu 24.04, usando pacotes t64..."
    
    # Instalar dependências específicas para Ubuntu 24.04
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
        libxcb-icccm4 \
        libxcb-image0 \
        libxcb-keysyms1 \
        libxcb-randr0 \
        libxcb-render-util0 \
        libxcb-shape0 \
        libxcb-sync1 \
        libxcb-xfixes0 \
        libxcb-xinerama0 \
        libxcb-xinput0 \
        libxcb-xtest0 \
        ca-certificates \
        fonts-liberation \
        wget \
        unzip \
        curl \
        xvfb \
        libu2f-udev \
        libvulkan1 \
        libsecret-1-0 \
        gconf-service \
        libappindicator1 \
        fonts-dejavu-core \
        lsb-release \
        xdg-utils

else
    echo "🎯 Usando pacotes padrão para Ubuntu $UBUNTU_VERSION..."
    
    # Para versões mais antigas do Ubuntu
    sudo apt install -y \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libatspi2.0-0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libxss1 \
        libasound2 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libgbm-dev \
        libgtk-3-0 \
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
fi

# Instalar dependências adicionais importantes
echo "🔧 Instalando dependências adicionais..."
sudo apt install -y \
    gconf-service \
    libappindicator1 \
    libasound2t64 \
    libatk-bridge2.0-0t64 \
    libatk1.0-0t64 \
    libdrm2 \
    libgtk-3-0t64 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libgbm-dev \
    libgbm1 \
    libxkbcommon0 \
    xvfb \
    fonts-dejavu-core \
    fonts-liberation \
    ca-certificates \
    xdg-utils \
    lsb-release

# Resolver problema específico do libasound2 (pacote virtual)
echo "🔧 Resolvendo conflito do libasound2..."
sudo apt install -y libasound2t64
sudo apt --fix-broken install -y

# Criar links simbólicos para compatibilidade
echo "🔗 Criando links simbólicos para compatibilidade..."
if [[ -f "/usr/lib/x86_64-linux-gnu/libasound.so.2.0.0" ]]; then
    sudo ln -sf /usr/lib/x86_64-linux-gnu/libasound.so.2.0.0 /usr/lib/x86_64-linux-gnu/libasound.so.2
    sudo ln -sf /usr/lib/x86_64-linux-gnu/libasound.so.2 /usr/lib/x86_64-linux-gnu/libasound.so
fi

# Verificar instalação das dependências
echo "✅ Verificando dependências instaladas..."
for lib in libatk-1.0 libcups-2 libasound-2 libgtk-3-0 libxss1 libgbm1 libxcomposite1 libxdamage1 libxrandr2; do
    if ldconfig -p | grep -q "$lib"; then
        echo "✅ $lib instalado"
    else
        echo "❌ $lib NÃO encontrado"
    fi
done

# Limpeza completa do cache do Puppeteer
echo "🧹 Limpando cache do Puppeteer..."
if [ -d "~/.cache/puppeteer" ]; then
    rm -rf ~/.cache/puppeteer
    echo "✅ Cache do Puppeteer removido"
fi

if [ -d "./node_modules/.cache" ]; then
    rm -rf ./node_modules/.cache
    echo "✅ Cache do node_modules removido"
fi

# Forçar reinstalação do Puppeteer
echo "🔄 Reinstalando Puppeteer..."
npm rebuild puppeteer

# Verificar se o Chrome está funcionando
echo "🔍 Testando Chrome..."
if [ -f "/usr/bin/chromium" ]; then
    echo "✅ Chromium encontrado em /usr/bin/chromium"
elif [ -f "/usr/bin/google-chrome" ]; then
    echo "✅ Google Chrome encontrado em /usr/bin/google-chrome"
else
    echo "⚠️ Nenhum Chrome/Chromium encontrado no sistema"
fi

echo "🎯 Instalação concluída! Execute os comandos abaixo:"
echo "1. npm rebuild puppeteer"
echo "2. bun run clientes/CMW/index.ts"

echo "✅ Script de correção executado com sucesso!"
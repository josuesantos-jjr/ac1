#!/bin/bash

# Script para instalar dependências do Chrome/Chromium no Ubuntu
# Resolve erro: "libatk-1.0.so.0: cannot open shared object file"

echo "🔧 Instalando dependências do Chrome/Chromium..."

# Atualizar lista de pacotes
sudo apt update

# Instalar dependências essenciais do Chrome (Ubuntu 24.04 Compatible)
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
    curl

# Instalar dependências adicionais para estabilidade
sudo apt install -y \
    xvfb \
    libu2f-udev \
    libvulkan1 \
    libsecret-1-0 \
    gconf-service \
    libappindicator1 \
    fonts-dejavu-core \
    lsb-release \
    xdg-utils

echo "✅ Dependências do Chrome/Chromium instaladas com sucesso!"

# Limpar cache do Puppeteer para forçar download novamente
echo "🧹 Limpando cache do Puppeteer..."
rm -rf ~/.cache/puppeteer

echo "🎯 Instalação concluída! Tente executar o cliente novamente."
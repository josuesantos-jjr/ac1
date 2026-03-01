# Use Bun como runtime
FROM oven/bun:1-debian

# Instala dependências do sistema operacional necessárias para o Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    chromium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia package.json e bun.lock
COPY package.json bun.lock* ./

# Instala as dependências do projeto usando bun
RUN bun install

# Instala dependências globais
RUN bun add -g pm2

# Copia o restante do código da aplicação para o diretório de trabalho
COPY . .

# Configura variáveis de ambiente para o Puppeteer usar o Chromium instalado via apt
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Faz o build da aplicação Next.js
RUN bun run build

# Expõe a porta que o Next.js usa por padrão
EXPOSE 3000

# Comando para iniciar a aplicação usando pm2 com o arquivo de configuração
CMD ["pm2", "start", "ecosystem.config.cjs"]

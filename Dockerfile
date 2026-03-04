FROM oven/bun:1-debian

# Instalar dependências do Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libgtk-3-0 \
    libxss1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências primeiro para cache
COPY package.json bun.lock* ./

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar todo o código
COPY . .

# Configurações de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV NODE_ENV=production

# Build do Next.js
RUN bun run build

# Expor porta
EXPOSE 3000

# Iniciar o Next.js diretamente (sem PM2 para evitar problemas de timeout)
# O start.js será executado apenas se necessário para Ngrok
CMD ["bun", "run", "start-prod"]

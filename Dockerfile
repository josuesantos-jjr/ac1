FROM debian:bookworm-slim

# Instalar Bun
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://bun.sh/install | bash && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Adicionar Bun ao PATH
ENV PATH="/root/.bun/bin:$PATH"

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
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --global pm2

COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "src/start.js"]

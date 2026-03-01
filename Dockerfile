# Use uma imagem oficial do Node.js LTS (Alpine é menor, mas pode exigir mais dependências manuais)
# Usaremos a versão Debian (bullseye/bookworm) que tende a ter melhor compatibilidade de libs
FROM node:24-bookworm

# Instala dependências do sistema operacional necessárias para o Puppeteer/Chromium
# Fonte: https://pptr.dev/troubleshooting#running-puppeteer-on-docker
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
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
    wget \
    xdg-utils \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    # Criar symlink para compatibilidade com WppConnect que procura chromium-browser
    && ln -sf /usr/bin/google-chrome-stable /bin/chromium-browser \
    # Limpa o cache do apt para reduzir o tamanho da imagem
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia package.json e package-lock.json (ou yarn.lock, pnpm-lock.yaml)
# Usar lockfile garante instalações consistentes
COPY package.json package-lock.json* ./

# Instala as dependências do projeto
# Usar --legacy-peer-deps para resolver conflitos de dependências
RUN npm install --legacy-peer-deps && npm cache clean --force
RUN npm install -g pm2 && npm cache clean --force
# Cria um link simbólico para garantir que o comando 'pm2' seja encontrado pelo /bin/sh
RUN ln -sf $(which pm2) /usr/bin/pm2

# Configura variáveis de ambiente para o Puppeteer usar o Chrome instalado via apt
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copia o restante do código da aplicação para o diretório de trabalho
COPY . .

# Faz o build da aplicação Next.js
RUN npm run build

# Adiciona o diretório de binários locais ao PATH para garantir que o pm2 seja encontrado pelo shell
ENV PATH="/app/node_modules/.bin:$PATH"

# Expõe a porta que o Next.js usa por padrão (ou a que você configurar)
EXPOSE 3000

# Define variáveis de ambiente (opcional, melhor configurar no Render)
# ENV NODE_ENV=production
# ENV PORT=3000

# Comando para iniciar a aplicação usando pm2-runtime com o arquivo de configuração
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
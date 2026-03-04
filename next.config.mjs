/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de Turbopack
  turbopack: {
    root: '.',
  },
  
  // Configurações de build
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configurações de imagens
  images: {
    unoptimized: true
  },
  
  // Configurações de compilação
  output: 'standalone',
  
  // Configurações de compressão
  compress: true,
  
  // Configurações de headers para produção
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
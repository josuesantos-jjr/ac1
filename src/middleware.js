import { NextResponse } from 'next/server';

// Configuração do middleware
export const config = {
  matcher: [
    '/api/listas/upload-media/:path*',
    '/api/listas/media/:path*'
  ],
};

export default async function middleware(request) {
  // Verifica se é uma rota de upload de mídia
  if (request.nextUrl.pathname.startsWith('/api/listas/upload-media')) {
    // Verifica o Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Tipo de conteúdo inválido' },
        { status: 415 }
      );
    }

    // Adiciona headers de segurança
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
  }

  // Para rotas de acesso à mídia
  if (request.nextUrl.pathname.startsWith('/api/listas/media/')) {
    // Verifica se o arquivo solicitado é um tipo permitido
    const path = request.nextUrl.pathname;
    const fileType = path.split('.').pop()?.toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav', 'ogg', 'webm'];
    
    if (!fileType || !allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 403 }
      );
    }

    // Adiciona headers de segurança para arquivos de mídia
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    
    // Adiciona cache para arquivos de mídia
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    return response;
  }

  return NextResponse.next();
}
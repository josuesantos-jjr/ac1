import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsAuth } from '../../../../../backend/service/googleSheetsAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Erro na autorização OAuth:', error);
      return NextResponse.redirect(
        new URL('/?auth_error=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      return NextResponse.json({
        error: 'Código de autorização não fornecido'
      }, { status: 400 });
    }

    // Processa o código de autorização
    const success = await googleSheetsAuth.handleAuthCallback(code);

    if (success) {
      // Retornar página HTML que envia postMessage para a janela pai e fecha popup
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Autenticação Concluída</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px;
                background: #f8f9fa;
              }
              .success {
                color: #28a745;
                font-size: 18px;
                margin-bottom: 20px;
              }
              .loading {
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="success">✅ Autenticação realizada com sucesso!</div>
            <div class="loading">Fechando janela...</div>
            <script>
              // Enviar mensagem para a janela pai
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_SUCCESS',
                  scope: 'drive',
                  timestamp: Date.now()
                }, window.location.origin);
              }

              // Fechar popup após um breve delay
              setTimeout(function() {
                window.close();
              }, 1000);
            </script>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      // Em caso de erro, redirecionar normalmente
      return NextResponse.redirect(
        new URL('/?auth_error=callback_failed', request.url)
      );
    }

  } catch (error) {
    console.error('Erro no callback OAuth:', error);
    return NextResponse.redirect(
      new URL('/?auth_error=server_error', request.url)
    );
  }
}
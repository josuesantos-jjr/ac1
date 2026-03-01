// force_google_logout.ts
// Este script força o logout da conta Google, removendo o token salvo.
import { googleSheetsAuth } from './src/backend/service/googleSheetsAuth';

async function forceLogout() {
  console.log('Forçando o logout do Google OAuth...');
  try {
    // O método logout() já existe em googleSheetsAuth.ts e remove o token.json
    googleSheetsAuth.logout();
    console.log('Logout forçado com sucesso. O arquivo token.json foi removido.');
    console.log('Agora, execute o script para gerar a nova URL de autenticação.');
  } catch (error) {
    console.error('Ocorreu um erro durante o logout forçado:', error);
  }
}

forceLogout();

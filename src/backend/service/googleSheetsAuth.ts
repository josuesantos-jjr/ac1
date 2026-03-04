import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from '../util/logger.ts';
import { syncManager } from '../../database/sync.ts';

const logger = createLogger({
  categoria: 'google-sheets-auth',
  fonte: 'src/backend/service/googleSheetsAuth.ts'
});

// Configurações OAuth
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// Classe para gerenciar autenticação OAuth do Google Sheets
export class GoogleSheetsAuth {
  private oauth2Client?: OAuth2Client;
  private credentials: any;

  constructor() {
    this.initializeOAuth();
  }

  private initializeOAuth() {
    try {
      // Carrega credenciais do arquivo ou variáveis de ambiente
      const credentialsPath = path.join(process.cwd(), 'credentials.json');

      if (fs.existsSync(credentialsPath)) {
        const rawCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
        // Verifica se tem a estrutura 'web' (formato padrão do Google)
        if (rawCredentials.web) {
          this.credentials = rawCredentials.web;
        } else {
          this.credentials = rawCredentials;
        }
      } else {
        // Fallback para variáveis de ambiente
        this.credentials = {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback']
        };
      }

      const { client_id, client_secret, redirect_uris } = this.credentials;

      if (!client_id || !client_secret) {
        logger.warn('Credenciais do Google OAuth não encontradas. Funcionalidade limitada até configuração.');
        // Não falha mais aqui, apenas registra aviso
        return;
      }

      this.oauth2Client = new OAuth2Client(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      // Carrega token salvo se existir
      this.loadSavedToken();

    } catch (error) {
      logger.error('Erro ao inicializar OAuth do Google:', error);
      // Não lança erro, apenas registra
    }
  }

  private loadSavedToken() {
    try {
      if (this.oauth2Client && fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        this.oauth2Client.setCredentials(token);
        logger.info('Token OAuth carregado com sucesso');
      }
    } catch (error) {
      logger.warn('Erro ao carregar token salvo:', error);
    }
  }

  private async saveToken(token: any) {
    try {
      // 🔄 SALVAR NO SQLITE (sincronização automática)
      const clientId = path.basename(process.cwd());
      try {
        await syncManager.saveClientData(clientId, {
          googleAuthToken: token
        });
        console.log(`[Google Sheets Auth] Token OAuth salvo no SQLite para ${clientId}`);
      } catch (sqliteError) {
        console.error(`[Google Sheets Auth] Erro ao salvar no SQLite:`, sqliteError);
        // Continua com o salvamento JSON mesmo se SQLite falhar
      }

      // 📄 SALVAR NO JSON (manter funcionalidade original)
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
      logger.info('Token OAuth salvo com sucesso');
    } catch (error) {
      logger.error('Erro ao salvar token:', error);
    }
  }

  // Gera URL de autorização para o usuário
  generateAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2Client não inicializado. Verifique as credenciais.');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Força re-autorização para obter refresh_token
    });

    logger.info('URL de autorização gerada:', authUrl);
    return authUrl;
  }

  // Processa o callback de autorização
  async handleAuthCallback(code: string): Promise<boolean> {
    if (!this.oauth2Client) {
      logger.error('OAuth2Client não inicializado');
      return false;
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.saveToken(tokens);

      logger.info('Autenticação OAuth bem-sucedida');
      return true;
    } catch (error) {
      logger.error('Erro no callback de autenticação:', error);
      return false;
    }
  }

  // Verifica se o usuário está autenticado
  isAuthenticated(): boolean {
    try {
      if (!this.oauth2Client) return false;

      const credentials = this.oauth2Client.credentials;
      if (!credentials.access_token) return false;

      // Verifica se o token não expirou
      const now = Date.now();
      const expiryDate = credentials.expiry_date;

      if (expiryDate && now >= expiryDate) {
        logger.warn('Token OAuth expirado');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  // Renova o token se necessário
  private async refreshTokenIfNeeded(): Promise<void> {
    try {
      if (!this.oauth2Client) return;

      const credentials = this.oauth2Client.credentials;
      const now = Date.now();
      const expiryDate = credentials.expiry_date;

      if (expiryDate && now >= (expiryDate - (5 * 60 * 1000))) { // 5 minutos antes de expirar
        logger.info('Renovando token OAuth...');
        const { credentials: newCredentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(newCredentials);
        this.saveToken(newCredentials);
        logger.info('Token OAuth renovado');
      }
    } catch (error) {
      logger.error('Erro ao renovar token:', error);
      throw error;
    }
  }

  // Retorna cliente autenticado do Google Sheets
  async getSheetsClient() {
    await this.refreshTokenIfNeeded();

    return google.sheets({
      version: 'v4',
      auth: this.oauth2Client
    });
  }

  // Retorna cliente autenticado do Google Drive
  async getDriveClient() {
    await this.refreshTokenIfNeeded();

    return google.drive({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  // Retorna cliente autenticado do Google Calendar
  async getCalendarClient() {
    await this.refreshTokenIfNeeded();

    return google.calendar({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  // Logout - remove token
  logout(): void {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      if (this.oauth2Client) {
        this.oauth2Client.setCredentials({});
      }
      logger.info('Logout realizado - token removido');
    } catch (error) {
      logger.error('Erro no logout:', error);
    }
  }
}

// Instância singleton
export const googleSheetsAuth = new GoogleSheetsAuth();
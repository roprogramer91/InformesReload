const crypto = require('node:crypto');
const { google } = require('googleapis');

const GOOGLE_SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',
]);

const REQUIRED_CONFIGURATION = Object.freeze([
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
]);

/**
 * Almacenamiento temporal: los tokens se pierden cuando el proceso se reinicia.
 * Una implementación persistente futura debe exponer getTokens() y setTokens().
 */
class InMemoryGoogleTokenStore {
  constructor() {
    this.tokens = null;
  }

  async getTokens() {
    return this.tokens ? { ...this.tokens } : null;
  }

  async setTokens(tokens) {
    this.tokens = tokens ? { ...tokens } : null;
  }
}

/**
 * Almacenamiento temporal del parámetro OAuth state para proteger el callback.
 * No reemplaza una sesión o almacenamiento distribuido para múltiples réplicas.
 */
class InMemoryOAuthStateStore {
  constructor({ ttlMs = 10 * 60 * 1000 } = {}) {
    this.ttlMs = ttlMs;
    this.states = new Map();
  }

  issue() {
    const state = crypto.randomBytes(32).toString('base64url');
    this.states.set(state, Date.now() + this.ttlMs);
    return state;
  }

  consume(state) {
    const expiresAt = this.states.get(state);
    this.states.delete(state);
    return Boolean(expiresAt && expiresAt > Date.now());
  }
}

class GoogleAuthService {
  constructor({
    env = process.env,
    tokenStore = new InMemoryGoogleTokenStore(),
    stateStore = new InMemoryOAuthStateStore(),
    oauth2ClientFactory,
  } = {}) {
    this.env = env;
    this.tokenStore = tokenStore;
    this.stateStore = stateStore;
    this.oauth2ClientFactory = oauth2ClientFactory;
  }

  isConfigured() {
    return this.getMissingConfiguration().length === 0;
  }

  async getStatus() {
    const configured = this.isConfigured();
    const tokens = await this.tokenStore.getTokens();

    return {
      configured,
      authenticated: configured && Boolean(tokens?.access_token || tokens?.refresh_token),
    };
  }

  generateAuthorizationUrl() {
    const oauth2Client = this.createOAuth2Client();
    const state = this.stateStore.issue();

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: GOOGLE_SCOPES,
      state,
    });
  }

  async exchangeCodeForTokens(code, state) {
    if (!code || typeof code !== 'string') {
      throw this.error('El código de autorización de Google es obligatorio', 400, 'GOOGLE_AUTH_CODE_REQUIRED');
    }
    if (!state || typeof state !== 'string' || !this.stateStore.consume(state)) {
      throw this.error('El estado OAuth de Google es inválido o expiró', 400, 'GOOGLE_AUTH_STATE_INVALID');
    }

    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code.trim());
    await this.tokenStore.setTokens(tokens);

    return this.getStatus();
  }

  async getAuthenticatedClient() {
    const oauth2Client = this.createOAuth2Client();
    const tokens = await this.tokenStore.getTokens();

    if (!tokens?.access_token && !tokens?.refresh_token) {
      throw this.error('Google todavía no está autorizado', 401, 'GOOGLE_AUTH_REQUIRED');
    }

    oauth2Client.setCredentials(tokens);
    oauth2Client.on('tokens', refreshedTokens => {
      void this.storeRefreshedTokens(tokens, refreshedTokens);
    });

    return oauth2Client;
  }

  createOAuth2Client() {
    this.assertConfigured();

    if (this.oauth2ClientFactory) {
      return this.oauth2ClientFactory({
        clientId: this.env.GOOGLE_CLIENT_ID,
        clientSecret: this.env.GOOGLE_CLIENT_SECRET,
        redirectUri: this.env.GOOGLE_REDIRECT_URI,
      });
    }

    return new google.auth.OAuth2(
      this.env.GOOGLE_CLIENT_ID,
      this.env.GOOGLE_CLIENT_SECRET,
      this.env.GOOGLE_REDIRECT_URI
    );
  }

  assertConfigured() {
    const missing = this.getMissingConfiguration();
    if (missing.length) {
      throw this.error(
        `Falta configurar Google OAuth: ${missing.join(', ')}`,
        503,
        'GOOGLE_AUTH_NOT_CONFIGURED'
      );
    }
  }

  getMissingConfiguration() {
    return REQUIRED_CONFIGURATION.filter(name => {
      const value = this.env[name];
      return typeof value !== 'string' || !value.trim();
    });
  }

  async storeRefreshedTokens(currentTokens, refreshedTokens) {
    await this.tokenStore.setTokens({
      ...currentTokens,
      ...refreshedTokens,
      refresh_token: refreshedTokens.refresh_token || currentTokens.refresh_token,
    });
  }

  error(message, statusCode, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }
}

const googleAuthService = new GoogleAuthService();

module.exports = googleAuthService;
module.exports.GoogleAuthService = GoogleAuthService;
module.exports.InMemoryGoogleTokenStore = InMemoryGoogleTokenStore;
module.exports.InMemoryOAuthStateStore = InMemoryOAuthStateStore;
module.exports.GOOGLE_SCOPES = GOOGLE_SCOPES;


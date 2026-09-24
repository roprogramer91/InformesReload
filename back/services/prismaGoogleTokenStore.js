const { PrismaClient } = require('@prisma/client');

const DEFAULT_PROVIDER = 'google';
const DEFAULT_ACCOUNT_KEY = 'default';

/**
 * Persistencia OAuth para Railway/PostgreSQL.
 *
 * Los tokens se almacenan actualmente sin cifrado a nivel aplicación. La base
 * debe mantenerse privada y el cifrado con una clave externa queda pendiente.
 */
class PrismaGoogleTokenStore {
  constructor({
    prisma,
    provider = DEFAULT_PROVIDER,
    accountKey = DEFAULT_ACCOUNT_KEY,
  } = {}) {
    this.prisma = prisma || new PrismaClient();
    this.ownsPrismaClient = !prisma;
    this.provider = provider;
    this.accountKey = accountKey;
  }

  async getTokens() {
    const record = await this.prisma.googleAuthToken.findUnique({
      where: {
        provider_accountKey: {
          provider: this.provider,
          accountKey: this.accountKey,
        },
      },
    });

    if (!record) return null;

    return compactTokens({
      access_token: record.accessToken,
      refresh_token: record.refreshToken,
      scope: record.scope,
      token_type: record.tokenType,
      expiry_date: record.expiryDate?.getTime(),
    });
  }

  async setTokens(tokens) {
    if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) {
      throw new TypeError('Los tokens de Google deben ser un objeto');
    }

    const create = {
      provider: this.provider,
      accountKey: this.accountKey,
      accessToken: nullableString(tokens.access_token),
      refreshToken: validRefreshToken(tokens.refresh_token),
      scope: nullableString(tokens.scope),
      tokenType: nullableString(tokens.token_type),
      expiryDate: nullableExpiryDate(tokens.expiry_date),
    };
    const update = {};

    copyNullableString(tokens, 'access_token', update, 'accessToken');
    copyNullableString(tokens, 'scope', update, 'scope');
    copyNullableString(tokens, 'token_type', update, 'tokenType');

    if (Object.prototype.hasOwnProperty.call(tokens, 'expiry_date') && tokens.expiry_date !== undefined) {
      update.expiryDate = nullableExpiryDate(tokens.expiry_date);
    }

    const refreshToken = validRefreshToken(tokens.refresh_token);
    if (refreshToken) update.refreshToken = refreshToken;

    await this.prisma.googleAuthToken.upsert({
      where: {
        provider_accountKey: {
          provider: this.provider,
          accountKey: this.accountKey,
        },
      },
      create,
      update,
    });
  }

  disconnect() {
    return this.ownsPrismaClient ? this.prisma.$disconnect() : Promise.resolve();
  }
}

function copyNullableString(source, sourceKey, target, targetKey) {
  if (Object.prototype.hasOwnProperty.call(source, sourceKey) && source[sourceKey] !== undefined) {
    target[targetKey] = nullableString(source[sourceKey]);
  }
}

function nullableString(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new TypeError('Los campos de token deben ser texto');
  return value;
}

function validRefreshToken(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nullableExpiryDate(value) {
  if (value === undefined || value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('expiry_date no es una fecha válida');
  return date;
}

function compactTokens(tokens) {
  return Object.fromEntries(
    Object.entries(tokens).filter(([, value]) => value !== null && value !== undefined)
  );
}

module.exports = PrismaGoogleTokenStore;
module.exports.DEFAULT_PROVIDER = DEFAULT_PROVIDER;
module.exports.DEFAULT_ACCOUNT_KEY = DEFAULT_ACCOUNT_KEY;

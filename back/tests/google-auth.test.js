const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgresql://informesreload:informesreload_local@localhost:5432/informes_reload_test?schema=public';

if (!new URL(TEST_DATABASE_URL).pathname.endsWith('/informes_reload_test')) {
  throw new Error('TEST_DATABASE_URL debe apuntar exclusivamente a la base informes_reload_test');
}

const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = TEST_DATABASE_URL;

const ORIGINAL_GOOGLE_ENV = Object.fromEntries(
  ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI']
    .map(name => [name, process.env[name]])
);

delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
delete process.env.GOOGLE_REDIRECT_URI;

const { startServer } = require('../index');
const googleAuthService = require('../services/googleAuthService');
const PrismaGoogleTokenStore = require('../services/prismaGoogleTokenStore');

let server;
let baseUrl;
const prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
const tokenStore = new PrismaGoogleTokenStore({ prisma });

before(async () => {
  await prisma.googleAuthToken.deleteMany();
  googleAuthService.tokenStore = tokenStore;
  server = startServer(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await prisma.googleAuthToken.deleteMany();
  await prisma.$disconnect();

  for (const [name, value] of Object.entries(ORIGINAL_GOOGLE_ENV)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  if (ORIGINAL_DATABASE_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
});

test('GET /api/google/status informa configuración ausente sin exponer secretos', async () => {
  const response = await fetch(`${baseUrl}/api/google/status`);
  const text = await response.text();
  const body = JSON.parse(text);

  assert.equal(response.status, 200);
  assert.deepEqual(body, { configured: false, authenticated: false });
  assert.doesNotMatch(text, /client_secret|access_token|refresh_token/i);
});

test('GET /api/google/auth falla de forma clara cuando falta configuración', async () => {
  const response = await fetch(`${baseUrl}/api/google/auth`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.success, false);
  assert.equal(body.code, 'GOOGLE_AUTH_NOT_CONFIGURED');
  assert.match(body.message, /GOOGLE_CLIENT_ID/);
  assert.match(body.message, /GOOGLE_CLIENT_SECRET/);
  assert.match(body.message, /GOOGLE_REDIRECT_URI/);
});

test('status configurado y URL de autorización nunca exponen el client secret', async () => {
  process.env.GOOGLE_CLIENT_ID = 'google-client-id-for-test';
  process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-for-test';
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost/api/google/callback';

  const statusResponse = await fetch(`${baseUrl}/api/google/status`);
  const statusText = await statusResponse.text();
  assert.deepEqual(JSON.parse(statusText), { configured: true, authenticated: false });
  assert.doesNotMatch(statusText, /google-client-secret-for-test/);

  const authResponse = await fetch(`${baseUrl}/api/google/auth`);
  const authText = await authResponse.text();
  const authBody = JSON.parse(authText);

  assert.equal(authResponse.status, 200);
  assert.match(authBody.authorizationUrl, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  assert.doesNotMatch(authText, /google-client-secret-for-test/);
  assert.match(authBody.authorizationUrl, /gmail\.send/);
  assert.match(authBody.authorizationUrl, /auth%2Fdrive/);
});

test('guarda y recupera tokens OAuth desde PostgreSQL', async () => {
  const expiryDate = Date.now() + 60 * 60 * 1000;
  await tokenStore.setTokens({
    access_token: 'access-token-persisted',
    refresh_token: 'refresh-token-persisted',
    scope: 'scope-a scope-b',
    token_type: 'Bearer',
    expiry_date: expiryDate,
  });

  const reloadedStore = new PrismaGoogleTokenStore({ prisma });
  assert.deepEqual(await reloadedStore.getTokens(), {
    access_token: 'access-token-persisted',
    refresh_token: 'refresh-token-persisted',
    scope: 'scope-a scope-b',
    token_type: 'Bearer',
    expiry_date: expiryDate,
  });
});

test('preserva el refresh token cuando Google no devuelve uno nuevo', async () => {
  const newExpiryDate = Date.now() + 2 * 60 * 60 * 1000;
  await tokenStore.setTokens({
    access_token: 'access-token-refreshed',
    expiry_date: newExpiryDate,
  });
  await tokenStore.setTokens({
    access_token: 'access-token-refreshed-again',
    refresh_token: null,
  });

  const tokens = await tokenStore.getTokens();
  assert.equal(tokens.access_token, 'access-token-refreshed-again');
  assert.equal(tokens.refresh_token, 'refresh-token-persisted');
  assert.equal(tokens.expiry_date, newExpiryDate);
});

test('actualiza el refresh token cuando Google devuelve uno nuevo', async () => {
  await tokenStore.setTokens({ refresh_token: 'refresh-token-rotated' });

  const tokens = await tokenStore.getTokens();
  assert.equal(tokens.refresh_token, 'refresh-token-rotated');
});

test('GET /api/google/status usa PostgreSQL sin exponer tokens', async () => {
  const response = await fetch(`${baseUrl}/api/google/status`);
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(text), { configured: true, authenticated: true });
  assert.doesNotMatch(text, /access-token-refreshed|refresh-token-persisted|refresh-token-rotated/i);
  assert.doesNotMatch(text, /access_token|refresh_token/i);
});

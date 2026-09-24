const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');

const ORIGINAL_GOOGLE_ENV = Object.fromEntries(
  ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI']
    .map(name => [name, process.env[name]])
);

delete process.env.GOOGLE_CLIENT_ID;
delete process.env.GOOGLE_CLIENT_SECRET;
delete process.env.GOOGLE_REDIRECT_URI;

const { startServer } = require('../index');

let server;
let baseUrl;

before(async () => {
  server = startServer(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));

  for (const [name, value] of Object.entries(ORIGINAL_GOOGLE_ENV)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
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


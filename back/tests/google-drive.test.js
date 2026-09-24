const { EventEmitter } = require('node:events');
const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { GoogleAuthService } = require('../services/googleAuthService');
const { GoogleDriveService, FOLDER_MIME_TYPE } = require('../services/googleDriveService');
const { createGoogleDriveRouter } = require('../routes/googleDriveRoutes');

function createAuthError() {
  const error = new Error('Google todavía no está autorizado');
  error.statusCode = 401;
  error.code = 'GOOGLE_AUTH_REQUIRED';
  return error;
}

async function startTestServer(service) {
  const app = express();
  app.use('/api', createGoogleDriveRouter(service));
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  return {
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  };
}

test('rechaza el listado cuando Google no está autenticado', async () => {
  const service = new GoogleDriveService({
    authService: {
      getAuthenticatedClient: async () => { throw createAuthError(); },
    },
  });
  const { server, baseUrl } = await startTestServer(service);

  try {
    const response = await fetch(`${baseUrl}/api/google/drive/folders`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, {
      success: false,
      code: 'GOOGLE_AUTH_REQUIRED',
      message: 'Google todavía no está autorizado',
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('lista carpetas, pagina todos los resultados y no expone tokens', async () => {
  const calls = [];
  const authClient = { kind: 'oauth-client' };
  let tokenWritesWaited = false;
  const pages = [
    {
      files: [{
        id: 'folder-1',
        name: '23-09',
        parents: ['root-1'],
        createdTime: '2026-09-23T10:00:00.000Z',
        modifiedTime: '2026-09-23T11:00:00.000Z',
        trashed: false,
      }],
      nextPageToken: 'page-2',
    },
    {
      files: [{
        id: 'folder-2',
        name: '24-09',
        createdTime: '2026-09-24T10:00:00.000Z',
        modifiedTime: '2026-09-24T11:00:00.000Z',
        trashed: false,
      }],
    },
  ];
  const service = new GoogleDriveService({
    authService: {
      getAuthenticatedClient: async () => authClient,
      waitForPendingTokenWrites: async client => {
        assert.equal(client, authClient);
        tokenWritesWaited = true;
      },
    },
    driveFactory: auth => {
      assert.equal(auth, authClient);
      return {
        files: {
          list: async options => {
            calls.push(options);
            return { data: pages[calls.length - 1] };
          },
        },
      };
    },
  });
  const { server, baseUrl } = await startTestServer(service);

  try {
    const response = await fetch(`${baseUrl}/api/google/drive/folders`);
    const text = await response.text();
    const body = JSON.parse(text);

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      folders: [
        {
          id: 'folder-1',
          name: '23-09',
          parents: ['root-1'],
          createdTime: '2026-09-23T10:00:00.000Z',
          modifiedTime: '2026-09-23T11:00:00.000Z',
          trashed: false,
        },
        {
          id: 'folder-2',
          name: '24-09',
          parents: [],
          createdTime: '2026-09-24T10:00:00.000Z',
          modifiedTime: '2026-09-24T11:00:00.000Z',
          trashed: false,
        },
      ],
    });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].q, `mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`);
    assert.equal(calls[0].pageToken, undefined);
    assert.equal(calls[1].pageToken, 'page-2');
    assert.equal(calls[0].pageSize, 1000);
    assert.equal(calls[0].supportsAllDrives, true);
    assert.equal(calls[0].includeItemsFromAllDrives, true);
    assert.equal(tokenWritesWaited, true);
    assert.doesNotMatch(text, /access_token|refresh_token|client_secret/i);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('persiste tokens renovados emitidos por el cliente OAuth', async () => {
  const storedTokens = {
    access_token: 'expired-access-token',
    refresh_token: 'persistent-refresh-token',
  };
  const writes = [];
  const oauth2Client = new EventEmitter();
  oauth2Client.setCredentials = tokens => {
    oauth2Client.credentials = tokens;
  };
  const authService = new GoogleAuthService({
    env: {
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost/callback',
    },
    tokenStore: {
      getTokens: async () => storedTokens,
      setTokens: async tokens => { writes.push(tokens); },
    },
    oauth2ClientFactory: () => oauth2Client,
  });

  const client = await authService.getAuthenticatedClient();
  client.emit('tokens', {
    access_token: 'refreshed-access-token',
    expiry_date: 1790280000000,
  });
  await authService.waitForPendingTokenWrites(client);

  assert.deepEqual(writes, [{
    access_token: 'refreshed-access-token',
    refresh_token: 'persistent-refresh-token',
    expiry_date: 1790280000000,
  }]);
});

test('convierte errores de Google en una respuesta controlada sin detalles sensibles', async () => {
  const service = new GoogleDriveService({
    authService: {
      getAuthenticatedClient: async () => ({ kind: 'oauth-client' }),
    },
    driveFactory: () => ({
      files: {
        list: async () => {
          const error = new Error('upstream detail with access_token=secret-value');
          error.response = { status: 503 };
          throw error;
        },
      },
    }),
  });
  const { server, baseUrl } = await startTestServer(service);

  try {
    const response = await fetch(`${baseUrl}/api/google/drive/folders`);
    const text = await response.text();

    assert.equal(response.status, 502);
    assert.deepEqual(JSON.parse(text), {
      success: false,
      code: 'GOOGLE_DRIVE_LIST_FAILED',
      message: 'No se pudieron listar las carpetas de Google Drive',
    });
    assert.doesNotMatch(text, /secret-value|access_token/i);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

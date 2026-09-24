const { EventEmitter } = require('node:events');
const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { GoogleAuthService } = require('../services/googleAuthService');
const {
  GoogleDriveService,
  FOLDER_MIME_TYPE,
  WORK_FOLDER_NAME_PATTERN,
} = require('../services/googleDriveService');
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

test('rechaza la jerarquía MAPA cuando falta configurar la raíz', async () => {
  let authenticationAttempted = false;
  const service = new GoogleDriveService({
    env: {},
    authService: {
      getAuthenticatedClient: async () => {
        authenticationAttempted = true;
        return {};
      },
    },
  });
  const { server, baseUrl } = await startTestServer(service);

  try {
    const response = await fetch(`${baseUrl}/api/google/drive/mapa/work-folders`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      success: false,
      code: 'GOOGLE_DRIVE_MAPA_ROOT_NOT_CONFIGURED',
      message: 'Falta configurar GOOGLE_DRIVE_MAPA_ROOT_FOLDER_ID',
    });
    assert.equal(authenticationAttempted, false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('construye la jerarquía MAPA con múltiples meses, vacíos, nombres inválidos y paginación', async () => {
  const rootId = 'mapa-root-id';
  const listCalls = [];
  const responsesByQueryAndPage = new Map([
    [
      `'${rootId}' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false|first`,
      {
        files: [{ id: 'month-09', name: 'SEPTIEMBRE', parents: [rootId], trashed: false }],
        nextPageToken: 'months-page-2',
      },
    ],
    [
      `'${rootId}' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false|months-page-2`,
      { files: [{ id: 'month-10', name: 'OCTUBRE', parents: [rootId], trashed: false }] },
    ],
    [
      `'month-09' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false|first`,
      {
        files: [
          {
            id: 'work-23-09',
            name: 'MAPA 23-09',
            parents: ['month-09'],
            createdTime: '2026-09-24T15:21:02.286Z',
            modifiedTime: '2026-09-24T15:21:02.286Z',
            trashed: false,
          },
          {
            id: 'not-work-folder',
            name: 'Notas del mes',
            parents: ['month-09'],
            createdTime: '2026-09-01T10:00:00.000Z',
            modifiedTime: '2026-09-01T10:00:00.000Z',
            trashed: false,
          },
        ],
        nextPageToken: 'work-page-2',
      },
    ],
    [
      `'month-09' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false|work-page-2`,
      {
        files: [{
          id: 'work-24-09',
          name: 'MAPA 24-09',
          parents: ['month-09'],
          createdTime: '2026-09-25T12:00:00.000Z',
          modifiedTime: '2026-09-25T12:30:00.000Z',
          trashed: false,
        }],
      },
    ],
    [
      `'month-10' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false|first`,
      { files: [] },
    ],
  ]);
  const authClient = { kind: 'oauth-client' };
  const service = new GoogleDriveService({
    env: { GOOGLE_DRIVE_MAPA_ROOT_FOLDER_ID: `  ${rootId}  ` },
    authService: {
      getAuthenticatedClient: async () => authClient,
      waitForPendingTokenWrites: async client => assert.equal(client, authClient),
    },
    driveFactory: auth => {
      assert.equal(auth, authClient);
      return {
        files: {
          get: async options => {
            assert.deepEqual(options, {
              fileId: rootId,
              fields: 'id, name',
              supportsAllDrives: true,
            });
            return { data: { id: rootId, name: 'Para Informar' } };
          },
          list: async options => {
            listCalls.push(options);
            const key = `${options.q}|${options.pageToken || 'first'}`;
            const data = responsesByQueryAndPage.get(key);
            assert.ok(data, `Respuesta mock ausente para ${key}`);
            return { data };
          },
        },
      };
    },
  });
  const { server, baseUrl } = await startTestServer(service);

  try {
    const response = await fetch(`${baseUrl}/api/google/drive/mapa/work-folders`);
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(text), {
      root: { id: rootId, name: 'Para Informar' },
      months: [
        {
          id: 'month-09',
          name: 'SEPTIEMBRE',
          workFolders: [
            {
              id: 'work-23-09',
              name: 'MAPA 23-09',
              createdTime: '2026-09-24T15:21:02.286Z',
              modifiedTime: '2026-09-24T15:21:02.286Z',
            },
            {
              id: 'work-24-09',
              name: 'MAPA 24-09',
              createdTime: '2026-09-25T12:00:00.000Z',
              modifiedTime: '2026-09-25T12:30:00.000Z',
            },
          ],
        },
        {
          id: 'month-10',
          name: 'OCTUBRE',
          workFolders: [],
        },
      ],
    });
    assert.equal(listCalls.length, 5);
    assert.equal(listCalls[0].pageToken, undefined);
    assert.equal(listCalls[1].pageToken, 'months-page-2');
    assert.equal(listCalls[3].pageToken, 'work-page-2');
    assert.doesNotMatch(text, /Notas del mes|access_token|refresh_token/i);
    assert.equal(WORK_FOLDER_NAME_PATTERN.test('MAPA 01-01'), true);
    assert.equal(WORK_FOLDER_NAME_PATTERN.test('MAPA 1-01'), false);
    assert.equal(WORK_FOLDER_NAME_PATTERN.test('mapa 01-01'), false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('devuelve un error controlado si Google falla al leer la jerarquía MAPA', async () => {
  const service = new GoogleDriveService({
    env: { GOOGLE_DRIVE_MAPA_ROOT_FOLDER_ID: 'mapa-root-id' },
    authService: {
      getAuthenticatedClient: async () => ({ kind: 'oauth-client' }),
    },
    driveFactory: () => ({
      files: {
        get: async () => {
          const error = new Error('sensitive Google error');
          error.response = { status: 500 };
          throw error;
        },
      },
    }),
  });
  const { server, baseUrl } = await startTestServer(service);

  try {
    const response = await fetch(`${baseUrl}/api/google/drive/mapa/work-folders`);
    const text = await response.text();

    assert.equal(response.status, 502);
    assert.deepEqual(JSON.parse(text), {
      success: false,
      code: 'GOOGLE_DRIVE_LIST_FAILED',
      message: 'No se pudieron listar las carpetas de Google Drive',
    });
    assert.doesNotMatch(text, /sensitive Google error/i);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
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

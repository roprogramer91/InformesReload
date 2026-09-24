const { google } = require('googleapis');
const googleAuthService = require('./googleAuthService');

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FOLDER_FIELDS = 'nextPageToken, files(id, name, parents, createdTime, modifiedTime, trashed)';
const MAPA_ROOT_FOLDER_ENV = 'GOOGLE_DRIVE_MAPA_ROOT_FOLDER_ID';
const WORK_FOLDER_NAME_PATTERN = /^MAPA\s+\d{2}-\d{2}$/;

class GoogleDriveService {
  constructor({ authService = googleAuthService, driveFactory, env = process.env } = {}) {
    this.authService = authService;
    this.driveFactory = driveFactory || (auth => google.drive({ version: 'v3', auth }));
    this.env = env;
  }

  async listFolders() {
    try {
      const auth = await this.authService.getAuthenticatedClient();
      const drive = this.driveFactory(auth);
      return await this.listFoldersByQuery({
        auth,
        drive,
        query: `mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
      });
    } catch (error) {
      throw toDriveError(error);
    }
  }

  async listChildFolders(folderId, { auth, drive } = {}) {
    try {
      const activeAuth = auth || await this.authService.getAuthenticatedClient();
      const activeDrive = drive || this.driveFactory(activeAuth);
      const escapedFolderId = escapeDriveQueryValue(folderId);

      return await this.listFoldersByQuery({
        auth: activeAuth,
        drive: activeDrive,
        query: `'${escapedFolderId}' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
      });
    } catch (error) {
      throw toDriveError(error);
    }
  }

  async getMapaWorkFolders() {
    const rootFolderId = this.getMapaRootFolderId();

    try {
      const auth = await this.authService.getAuthenticatedClient();
      const drive = this.driveFactory(auth);
      const rootResponse = await drive.files.get({
        fileId: rootFolderId,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      await this.authService.waitForPendingTokenWrites?.(auth);

      const monthFolders = await this.listChildFolders(rootFolderId, { auth, drive });
      const months = [];

      for (const month of monthFolders) {
        const children = await this.listChildFolders(month.id, { auth, drive });
        months.push({
          id: month.id,
          name: month.name,
          workFolders: children
            .filter(folder => WORK_FOLDER_NAME_PATTERN.test(folder.name))
            .map(toWorkFolderResponse),
        });
      }

      return {
        root: {
          id: rootResponse.data.id,
          name: rootResponse.data.name,
        },
        months,
      };
    } catch (error) {
      throw toDriveError(error);
    }
  }

  getMapaRootFolderId() {
    const rootFolderId = this.env[MAPA_ROOT_FOLDER_ENV];
    if (typeof rootFolderId !== 'string' || !rootFolderId.trim()) {
      const error = new Error(`Falta configurar ${MAPA_ROOT_FOLDER_ENV}`);
      error.statusCode = 503;
      error.code = 'GOOGLE_DRIVE_MAPA_ROOT_NOT_CONFIGURED';
      error.exposeMessage = true;
      throw error;
    }

    return rootFolderId.trim();
  }

  async listFoldersByQuery({ auth, drive, query }) {
    const folders = [];
    let pageToken;

    do {
      const response = await drive.files.list({
        q: query,
        fields: FOLDER_FIELDS,
        spaces: 'drive',
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      await this.authService.waitForPendingTokenWrites?.(auth);
      folders.push(...(response.data.files || []).map(toFolderResponse));
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return folders;
  }
}

function toDriveError(error) {
  if (error.statusCode) return error;

  const googleStatus = error.response?.status || error.code;
  const statusCode = googleStatus === 401 || googleStatus === 403 ? googleStatus : 502;
  const driveError = new Error('No se pudieron listar las carpetas de Google Drive');
  driveError.statusCode = statusCode;
  driveError.code = 'GOOGLE_DRIVE_LIST_FAILED';
  return driveError;
}

function escapeDriveQueryValue(value) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error('El ID de la carpeta de Google Drive es obligatorio');
    error.statusCode = 400;
    error.code = 'GOOGLE_DRIVE_FOLDER_ID_REQUIRED';
    error.exposeMessage = true;
    throw error;
  }

  return value.trim().replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function toWorkFolderResponse(folder) {
  return {
    id: folder.id,
    name: folder.name,
    createdTime: folder.createdTime,
    modifiedTime: folder.modifiedTime,
  };
}

function toFolderResponse(folder) {
  return {
    id: folder.id,
    name: folder.name,
    parents: folder.parents || [],
    createdTime: folder.createdTime,
    modifiedTime: folder.modifiedTime,
    trashed: Boolean(folder.trashed),
  };
}

module.exports = new GoogleDriveService();
module.exports.GoogleDriveService = GoogleDriveService;
module.exports.FOLDER_MIME_TYPE = FOLDER_MIME_TYPE;
module.exports.FOLDER_FIELDS = FOLDER_FIELDS;
module.exports.MAPA_ROOT_FOLDER_ENV = MAPA_ROOT_FOLDER_ENV;
module.exports.WORK_FOLDER_NAME_PATTERN = WORK_FOLDER_NAME_PATTERN;

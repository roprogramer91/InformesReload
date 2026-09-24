const { google } = require('googleapis');
const googleAuthService = require('./googleAuthService');

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FOLDER_FIELDS = 'nextPageToken, files(id, name, parents, createdTime, modifiedTime, trashed)';

class GoogleDriveService {
  constructor({ authService = googleAuthService, driveFactory } = {}) {
    this.authService = authService;
    this.driveFactory = driveFactory || (auth => google.drive({ version: 'v3', auth }));
  }

  async listFolders() {
    try {
      const auth = await this.authService.getAuthenticatedClient();
      const drive = this.driveFactory(auth);
      const folders = [];
      let pageToken;

      do {
        const response = await drive.files.list({
          q: `mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
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
    } catch (error) {
      if (error.statusCode) throw error;

      const googleStatus = error.response?.status || error.code;
      const statusCode = googleStatus === 401 || googleStatus === 403 ? googleStatus : 502;
      const driveError = new Error('No se pudieron listar las carpetas de Google Drive');
      driveError.statusCode = statusCode;
      driveError.code = 'GOOGLE_DRIVE_LIST_FAILED';
      throw driveError;
    }
  }
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

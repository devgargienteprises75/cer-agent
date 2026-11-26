import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { google } from 'googleapis'
import config from '../config/config.js'

const defaultKeyFile = fileURLToPath(new URL('../../service-client.json', import.meta.url))
const oauthCredentials = [
    config.GOOGLE_OAUTH_CLIENT_ID,
    config.GOOGLE_OAUTH_CLIENT_SECRET,
    config.GOOGLE_OAUTH_REFRESH_TOKEN
]
const hasOAuthCredentials = oauthCredentials.some(Boolean)

let auth
if (hasOAuthCredentials) {
    if (oauthCredentials.some((value) => !value)) {
        throw new Error('Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN together')
    }

    auth = new google.auth.OAuth2(
        config.GOOGLE_OAUTH_CLIENT_ID,
        config.GOOGLE_OAUTH_CLIENT_SECRET
    )
    auth.setCredentials({ refresh_token: config.GOOGLE_OAUTH_REFRESH_TOKEN })
} else {
    auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultKeyFile,
        scopes: ['https://www.googleapis.com/auth/drive.file']
    })
}

const drive = google.drive({ version: 'v3', auth })

export async function uploadImage(file) {
    if (!config.GOOGLE_DRIVE_FOLDER_ID) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured')
    }

    const response = await drive.files.create({
        requestBody: {
            name: file.originalname.replaceAll('\\', '/').split('/').pop().slice(0, 255),
            parents: [config.GOOGLE_DRIVE_FOLDER_ID]
        },
        media: {
            mimeType: file.mimetype,
            // Keep the Buffer as one stream chunk instead of iterating its bytes.
            body: Readable.from([file.buffer])
        },
        supportsAllDrives: true,
        fields: 'id, name, mimeType, webViewLink'
    })

    const { id, name, mimeType, webViewLink } = response.data
    if (!id) {
        throw new Error('Google Drive did not return a file ID')
    }

    return {
        id,
        name,
        mimeType,
        url: webViewLink || `https://drive.google.com/file/d/${id}/view`
    }
}

export async function deleteImage(fileId) {
    await drive.files.delete({ fileId, supportsAllDrives: true })
}

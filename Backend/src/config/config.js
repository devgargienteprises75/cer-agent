import 'dotenv/config'

if(!process.env.MONGO_URI){
    console.error('MONGO_URI is not defined in environment variable');
}

if(!process.env.OPENROUTER_API_KEY){
    console.error('OPENROUTER_API_KEY is not defined in environment variable');
}

if(!process.env.GOOGLE_DRIVE_FOLDER_ID){
    console.error('GOOGLE_DRIVE_FOLDER_ID is not defined in environment variable');
}

const config = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    MONGO_URI: process.env.MONGO_URI,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
}

export default config;

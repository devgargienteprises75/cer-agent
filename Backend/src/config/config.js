import 'dotenv/config'

if(!ASSEMBLYAI_API_KEY){
    console.error('ASSEMBLYAI_API_KEY is not defined in environment variable');
}

const config = {
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY
}

export default config;
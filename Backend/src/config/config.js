import 'dotenv/config'

if(!process.env.OPENROUTER_API_KEY){
    console.error('OPENROUTER_API_KEY is not defined in environment variable');
}

const config = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
}

export default config;
import 'dotenv/config'

if(!process.env.MONGO_URI){
    console.error('MONGO_URI is not defined in environment variable');
}



const config = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    MONGO_URI: process.env.MONGO_URI

}

export default config;
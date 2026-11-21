import mongoose from "mongoose";
import config from "./config.js";

const connectToDb = async () => {
    try {
        await mongoose.connect(config.MONGO_URI)
        console.log("Connected to DB")
    } catch (err) {
        console.error(`Failed to connect DB: ${err.message}`)
        process.exit(1)
    }
}

export default connectToDb;
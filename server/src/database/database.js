import mongoose from "mongoose";
import { useFallbackDnsIfNeeded } from "../utils/dnsFallback.js";

const connectDB = async () => {
    try {
        useFallbackDnsIfNeeded();
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected || DB Host : ${ connectionInstance.connection.host }`);
    } catch (error) {
        console.log("mogoDB connection Error : ", error);
        process.exit(1);
    }
}

export default connectDB;
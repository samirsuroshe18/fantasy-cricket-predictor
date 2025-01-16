import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { Client, auth } from 'cassandra-driver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ASTRA_DB_SECURE_BUNDLE_PATH = path.join(__dirname, '../../secure-connect-fantasy11.zip');

const astraDB = async () => {
    try {
        if (!process.env.ASTRA_DB_APPLICATION_TOKEN) {
            throw new Error("Astra DB Application Token is not defined in environment variables.");
        }

        const cloud = {
            secureConnectBundle: ASTRA_DB_SECURE_BUNDLE_PATH
        };

        const authProvider = new auth.PlainTextAuthProvider(
            'token',
            process.env.ASTRA_DB_APPLICATION_TOKEN
        );

        const client = new Client({ cloud, authProvider });
        await client.connect(); 
        return client;
    } catch (error) {
        console.error("astraDB connection error: ", error.message);
        throw error;  // Re-throw error to be handled by calling code
    }
};

export default astraDB;


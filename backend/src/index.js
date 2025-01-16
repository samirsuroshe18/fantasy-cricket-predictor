import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { Client, auth } from 'cassandra-driver';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const app = express();

app.use(cors({ origin: ["http://localhost:5173", process.env.CORS_ORIGIN] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ASTRA_DB_SECURE_BUNDLE_PATH = path.join(__dirname, 'secure-connect-dummyone.zip');

app.get("/users", async (req, res) => {
    try {
        const cloud = {
            secureConnectBundle: ASTRA_DB_SECURE_BUNDLE_PATH
        };

        const authProvider = new auth.PlainTextAuthProvider(
            'token',
            process.env.ASTRA_DB_APPLICATION_TOKEN
        );

        const client = new Client({ cloud, authProvider });
        await client.connect();

        const query = 'SELECT * FROM default_keyspace.dummy';
        const result = await client.execute(query);
        
        await client.shutdown();
        return res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 8001, process.env.SERVER_HOST, () => {
    console.log(`Server is running at on : http://${process.env.SERVER_HOST}:${process.env.PORT}`);
})

export default app;

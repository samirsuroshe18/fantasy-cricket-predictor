import dotenv from "dotenv";
dotenv.config();
import { DataAPIClient } from '@datastax/astra-db-ts';

const client2 = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);

// Connect to database by database endpoint and
// override default options for keyspace and token.
const astraConnection = client2.db(process.env.END_POINT, {
    keyspace: 'default_keyspace',
    token: process.env.WEAKER_TOKEN_2,
});

export {astraConnection};
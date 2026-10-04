// must stay first: ES imports are hoisted, and the modules below read process.env
import 'dotenv/config';
import connectDB from './database/database.js';
import app from './app.js';
import { User } from './models/user.model.js';
import { Usage } from './models/usage.model.js';

const PORT = process.env.PORT || 3005;

// without it no login can be made, so the server says so at once instead of at the first login
if (!process.env.ACCESS_TOKEN_SECRET) {
    console.log('ACCESS_TOKEN_SECRET is not set. See server/.env.example.');
    process.exit(1);
}

connectDB().then(async () => {
    // accounts and daily counts rely on unique indexes: they are in place before the
    // first request
    await Promise.all([User.init(), Usage.init()]);

    app.listen(PORT, process.env.SERVER_HOST, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}).catch((err) => {
    console.log('MongoDB Failed !!!', err);
});

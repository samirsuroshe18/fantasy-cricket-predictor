import { User } from '../models/user.model.js';

// Ends every session of a user: the tokens issued so far stop being accepted.
// Used on logout and after a password change.
const endSessions = async (userId) => {
    await User.updateOne(
        { _id: userId },
        { $inc: { tokenVersion: 1 } }
    );
};

export { endSessions }

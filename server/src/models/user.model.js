import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

// how long a login lasts; the cookie that carries it lasts as long
export const SESSION_DAYS = 7;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

    // the shared account visitors can try the app with
    isDemo: {
        type: Boolean,
        default: false,
    },

    // raised on logout and password change; a token carrying an older value is refused
    tokenVersion: {
        type: Number,
        default: 0,
    },

    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,

}, { timestamps: true });

// the password is hashed whenever it changes, never stored as typed
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            tokenVersion: this.tokenVersion,
        }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: `${SESSION_DAYS}d`
        }
    );
}

// never send secrets or one-time tokens to a client
userSchema.set('toJSON', {
    transform: (_, ret) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.verifyToken;
        delete ret.verifyTokenExpiry;
        delete ret.forgotPasswordToken;
        delete ret.forgotPasswordTokenExpiry;
        delete ret.__v;
        return ret;
    }
});

export const User = mongoose.model("User", userSchema);

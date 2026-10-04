import { Router } from "express";
import { visitorLimiter } from '../middlewares/rateLimit.middleware.js'
import { checkResetToken, setNewPassword, verifyEmail } from "../controllers/verify.controller.js";

const router = Router();

// the links that arrive by email; the pages of the web app call these
router.route('/verify-email').get(visitorLimiter, verifyEmail);
router.route('/reset-password').get(visitorLimiter, checkResetToken).post(visitorLimiter, setNewPassword);


export default router;

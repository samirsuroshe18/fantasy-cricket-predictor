import { Router } from "express";
import { requireVerified, verifyJwt } from '../middlewares/auth.middleware.js'
import { publicLimiter, writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { getMatches, getOneMatch, predict } from "../controllers/match.controller.js";

const router = Router();

// open to everyone
router.route('/').get(publicLimiter, getMatches);
router.route('/:id').get(publicLimiter, getOneMatch);

// with a login and a verified address
router.route('/:id/prediction').post(verifyJwt, requireVerified, writeLimiter, predict);


export default router;

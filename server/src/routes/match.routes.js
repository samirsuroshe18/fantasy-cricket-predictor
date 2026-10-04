import { Router } from "express";
import { publicLimiter } from '../middlewares/rateLimit.middleware.js'
import { getMatches, getOneMatch } from "../controllers/match.controller.js";

const router = Router();

// open to everyone
router.route('/').get(publicLimiter, getMatches);
router.route('/:id').get(publicLimiter, getOneMatch);


export default router;

import { Router } from "express";
import { requireVerified, verifyJwt } from '../middlewares/auth.middleware.js'
import { writeLimiter } from '../middlewares/rateLimit.middleware.js'
import { createTeam, deleteTeam, getTeam, listTeams, updateTeam } from "../controllers/team.controller.js";

const router = Router();

// a user's own saved teams
router.use(verifyJwt);

router.route('/').get(listTeams).post(requireVerified, writeLimiter, createTeam);
router.route('/:id').get(getTeam).put(requireVerified, writeLimiter, updateTeam).delete(writeLimiter, deleteTeam);


export default router;

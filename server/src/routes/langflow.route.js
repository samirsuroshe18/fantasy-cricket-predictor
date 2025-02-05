import {Router} from 'express';
import { getInfo } from '../controllers/langflow.controller.js';

const router = Router();

router.route('/get-info').get(getInfo);


export default router;
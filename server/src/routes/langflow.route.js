import {Router} from 'express';
import { getData, getInfo, putData } from '../controllers/langflow.controller.js';

const router = Router();

router.route('/put-data').post(putData);
router.route('/get-data').get(getData);
router.route('/get-info').get(getInfo);


export default router;
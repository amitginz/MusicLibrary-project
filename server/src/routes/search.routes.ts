import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { search } from '../controllers/search.controller';

const router = Router();
router.get('/', authenticate, search);

export default router;

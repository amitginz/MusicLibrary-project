import { Router } from 'express';
import authRoutes from './auth.routes';
import playlistRoutes from './playlist.routes';
import searchRoutes from './search.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/playlists', playlistRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);

export default router;

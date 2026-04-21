import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { uploadMp3 } from '../controllers/upload.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed'));
    }
  },
});

const router = Router();
router.post('/mp3', authenticate, upload.single('mp3'), uploadMp3);

export default router;

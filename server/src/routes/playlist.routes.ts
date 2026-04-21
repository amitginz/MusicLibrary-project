import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  addSong,
  updateSongRating,
  deleteSong,
} from '../controllers/playlist.controller';

const router = Router();

router.use(authenticate);

router.get('/', getPlaylists);
router.post('/', createPlaylist);
router.delete('/:playlistId', deletePlaylist);
router.post('/:playlistId/songs', addSong);
router.patch('/:playlistId/songs/:songId', updateSongRating);
router.delete('/:playlistId/songs/:songId', deleteSong);

export default router;

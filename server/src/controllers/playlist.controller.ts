import { Response } from 'express';
import { AuthRequest } from '../types';
import { Playlist } from '../models/Playlist';
import mongoose from 'mongoose';

export async function getPlaylists(req: AuthRequest, res: Response): Promise<void> {
  const playlists = await Playlist.find({ owner: req.user!.id });
  res.json(playlists);
}

export async function createPlaylist(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const playlist = await Playlist.create({ owner: req.user!.id, name: name.trim() });
  res.status(201).json(playlist);
}

export async function deletePlaylist(req: AuthRequest, res: Response): Promise<void> {
  const playlist = await Playlist.findOneAndDelete({ _id: req.params.playlistId, owner: req.user!.id });
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }
  res.json({ success: true });
}

export async function addSong(req: AuthRequest, res: Response): Promise<void> {
  const { videoId, title, rating, isLocal, cloudinaryUrl } = req.body;
  if (!videoId || !title) {
    res.status(400).json({ error: 'videoId and title are required' });
    return;
  }

  const playlist = await Playlist.findOne({ _id: req.params.playlistId, owner: req.user!.id });
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }

  const duplicate = playlist.songs.find(s => s.videoId === videoId);
  if (duplicate) {
    res.status(409).json({ error: 'Song already in playlist' });
    return;
  }

  playlist.songs.push({ title, videoId, isLocal: isLocal ?? false, cloudinaryUrl, rating: rating ?? 0, addedAt: new Date() } as any);
  await playlist.save();
  res.status(201).json(playlist);
}

export async function updateSongRating(req: AuthRequest, res: Response): Promise<void> {
  const { rating } = req.body;
  if (rating === undefined || rating < 0 || rating > 5) {
    res.status(400).json({ error: 'Rating must be 0–5' });
    return;
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.playlistId, owner: req.user!.id, 'songs._id': req.params.songId },
    { $set: { 'songs.$.rating': rating } },
    { new: true }
  );
  if (!playlist) {
    res.status(404).json({ error: 'Song or playlist not found' });
    return;
  }
  res.json(playlist);
}

export async function deleteSong(req: AuthRequest, res: Response): Promise<void> {
  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.playlistId, owner: req.user!.id },
    { $pull: { songs: { _id: new mongoose.Types.ObjectId(req.params.songId) } } },
    { new: true }
  );
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }
  res.json(playlist);
}

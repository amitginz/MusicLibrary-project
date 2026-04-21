import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { Readable } from 'stream';
import { AuthRequest } from '../types';
import { Playlist } from '../models/Playlist';
import { env } from '../config/env';

const useCloudinary = () =>
  env.CLOUDINARY_CLOUD_NAME && !env.CLOUDINARY_CLOUD_NAME.includes('your');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

export async function uploadMp3(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { playlistId } = req.body;
  if (!playlistId) {
    res.status(400).json({ error: 'playlistId is required' });
    return;
  }

  const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user!.id });
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }

  let fileUrl: string;
  let publicId: string;

  if (useCloudinary()) {
    const cloudinary = (await import('../services/cloudinary.service')).default;
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'musictube_mp3', resource_type: 'video', format: 'mp3' },
        (err, res) => {
          if (err || !res) return reject(err ?? new Error('Upload failed'));
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        }
      );
      Readable.from(req.file!.buffer).pipe(stream);
    });
    fileUrl = result.secure_url;
    publicId = result.public_id;
  } else {
    // Local disk fallback
    const filename = `${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    fileUrl = `/uploads/${filename}`;
    publicId = fileUrl;
  }

  const title = req.file.originalname.replace(/\.mp3$/i, '');
  playlist.songs.push({ title, videoId: publicId, isLocal: true, cloudinaryUrl: fileUrl, rating: 0, addedAt: new Date() } as any);
  await playlist.save();

  res.status(201).json({ success: true, cloudinaryUrl: fileUrl, publicId });
}

import { Request } from 'express';

export interface AuthPayload {
  id: string;
  username: string;
  firstName: string;
  photoUrl: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface YouTubeItem {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
}

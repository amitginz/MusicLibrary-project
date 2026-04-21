export interface User {
  id: string;
  username: string;
  firstName: string;
  photoUrl: string;
}

export interface Song {
  _id: string;
  title: string;
  videoId: string;
  isLocal: boolean;
  cloudinaryUrl?: string;
  rating: number;
  addedAt: string;
}

export interface Playlist {
  _id: string;
  name: string;
  songs: Song[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
}

import api from './client';
import type { Playlist } from '../types';

export const getPlaylists = () => api.get<Playlist[]>('/playlists');
export const createPlaylist = (name: string) => api.post<Playlist>('/playlists', { name });
export const deletePlaylist = (id: string) => api.delete(`/playlists/${id}`);
export const addSong = (playlistId: string, song: { videoId: string; title: string; rating?: number; isLocal?: boolean; cloudinaryUrl?: string }) =>
  api.post<Playlist>(`/playlists/${playlistId}/songs`, song);
export const updateRating = (playlistId: string, songId: string, rating: number) =>
  api.patch<Playlist>(`/playlists/${playlistId}/songs/${songId}`, { rating });
export const deleteSong = (playlistId: string, songId: string) =>
  api.delete<Playlist>(`/playlists/${playlistId}/songs/${songId}`);

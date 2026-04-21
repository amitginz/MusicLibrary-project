import api from './client';

export const uploadMp3 = (file: File, playlistId: string) => {
  const formData = new FormData();
  formData.append('mp3', file);
  formData.append('playlistId', playlistId);
  return api.post<{ cloudinaryUrl: string; publicId: string }>('/upload/mp3', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

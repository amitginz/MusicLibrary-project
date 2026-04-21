import api from './client';
import type { User } from '../types';

export const loginUser = (body: { username: string; password: string }) =>
  api.post<{ token: string; user: User }>('/auth/login', body);

export const registerUser = (body: {
  userId: string;
  username: string;
  firstName: string;
  password: string;
  photoUrl?: string;
}) => api.post('/auth/register', body);

export const getMe = () => api.get<User>('/auth/me');

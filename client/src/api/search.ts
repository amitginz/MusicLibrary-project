import api from './client';
import type { SearchResult } from '../types';

export const searchYouTube = (q: string) =>
  api.get<{ items: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}`);

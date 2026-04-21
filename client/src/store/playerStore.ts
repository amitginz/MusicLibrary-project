import { create } from 'zustand';
import type { Song } from '../types';

interface PlayerState {
  queue: Song[];
  currentIndex: number;
  isOpen: boolean;
  setQueue: (songs: Song[], startIndex?: number) => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  current: () => Song | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isOpen: false,
  setQueue: (songs, startIndex = 0) => set({ queue: songs, currentIndex: startIndex, isOpen: true }),
  next: () => set(s => ({ currentIndex: Math.min(s.currentIndex + 1, s.queue.length - 1) })),
  prev: () => set(s => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
  close: () => set({ isOpen: false }),
  current: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },
}));

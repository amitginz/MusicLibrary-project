import type { SearchResult, Playlist } from '../types';
import { useState } from 'react';
import { addSong } from '../api/playlists';
import toast from 'react-hot-toast';
import { usePlayerStore } from '../store/playerStore';

interface Props {
  item: SearchResult;
  playlists: Playlist[];
  onPlaylistsUpdated: () => void;
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const [, h, m, s] = match;
  const parts = [];
  if (h) parts.push(h.padStart(2, '0'));
  parts.push((m ?? '0').padStart(2, '0'));
  parts.push((s ?? '0').padStart(2, '0'));
  return parts.join(':');
}

function formatViews(n: string): string {
  const num = parseInt(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`;
  return `${num} views`;
}

export default function SearchCard({ item, playlists, onPlaylistsUpdated }: Props) {
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [adding, setAdding] = useState(false);
  const setQueue = usePlayerStore(s => s.setQueue);

  const handleAdd = async () => {
    if (!selectedPlaylist) return toast.error('Select a playlist first');
    setAdding(true);
    try {
      await addSong(selectedPlaylist, { videoId: item.videoId, title: item.title });
      toast.success('Added to playlist');
      onPlaylistsUpdated();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Failed to add song');
    } finally {
      setAdding(false);
    }
  };

  const handlePlay = () => {
    setQueue([{ _id: item.videoId, title: item.title, videoId: item.videoId, isLocal: false, rating: 0, addedAt: '' }], 0);
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden hover:ring-1 hover:ring-indigo-500 transition-all group">
      <div className="relative cursor-pointer" onClick={handlePlay}>
        <img src={item.thumbnail} alt={item.title} className="w-full aspect-video object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-4xl">▶</span>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded">
          {formatDuration(item.duration)}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 mb-1">{item.title}</p>
        <p className="text-xs text-gray-400 mb-3">{item.channelTitle} · {formatViews(item.viewCount)}</p>
        <div className="flex gap-2">
          <select
            value={selectedPlaylist}
            onChange={e => setSelectedPlaylist(e.target.value)}
            className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300"
          >
            <option value="">Select playlist</option>
            {playlists.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {adding ? '...' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}

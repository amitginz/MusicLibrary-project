import type { Song } from '../types';
import { updateRating, deleteSong } from '../api/playlists';
import toast from 'react-hot-toast';
import { usePlayerStore } from '../store/playerStore';

interface Props {
  song: Song;
  index: number;
  playlistId: string;
  allSongs: Song[];
  onUpdated: () => void;
}

export default function SongRow({ song, index, playlistId, allSongs, onUpdated }: Props) {
  const setQueue = usePlayerStore(s => s.setQueue);

  const handleRating = async (rating: number) => {
    try {
      await updateRating(playlistId, song._id, rating);
      onUpdated();
    } catch {
      toast.error('Failed to update rating');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSong(playlistId, song._id);
      toast.success('Song removed');
      onUpdated();
    } catch {
      toast.error('Failed to remove song');
    }
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50 group">
      <td className="px-4 py-3 text-gray-400 text-sm w-8">{index + 1}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => setQueue(allSongs, index)}
          className="text-sm text-left hover:text-indigo-400 transition-colors line-clamp-1"
        >
          {song.title}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className={`text-lg transition-colors ${star <= song.rating ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full ${song.isLocal ? 'bg-green-900/50 text-green-400' : 'bg-indigo-900/50 text-indigo-400'}`}>
          {song.isLocal ? 'Local' : 'YouTube'}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleDelete}
          className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlaylists, createPlaylist, deletePlaylist } from '../api/playlists';
import { uploadMp3 } from '../api/upload';
import SongRow from '../components/SongRow';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { usePlayerStore } from '../store/playerStore';

export default function PlaylistsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const setQueue = usePlayerStore(s => s.setQueue);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => getPlaylists().then(r => r.data),
  });

  const selected = playlists.find(p => p._id === selectedId) ?? playlists[0] ?? null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createPlaylist(newName.trim());
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    } catch {
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlaylist(id);
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted');
    } catch {
      toast.error('Failed to delete playlist');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    try {
      await uploadMp3(file, selected._id);
      toast.success('MP3 uploaded');
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Upload failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New playlist…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-2 py-2 rounded-lg text-xs"
            >
              +
            </button>
          </form>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {playlists.map(p => (
            <li key={p._id}>
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                  (selected?._id === p._id) ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-gray-800 text-gray-300'
                }`}
                onClick={() => setSelectedId(p._id)}
              >
                <span className="text-sm truncate">{p.name}</span>
                <span className="text-xs text-gray-500 group-hover:hidden">{p.songs.length}</span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(p._id); }}
                  className="text-gray-600 hover:text-red-400 hidden group-hover:block text-xs"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
          {playlists.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-8">No playlists yet</p>
          )}
        </ul>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 pb-40">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selected.name}</h2>
                <p className="text-sm text-gray-400">{selected.songs.length} songs</p>
              </div>
              <div className="flex gap-3">
                {selected.songs.length > 0 && (
                  <button
                    onClick={() => setQueue(selected.songs, 0)}
                    className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ▶ Play All
                  </button>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ↑ Upload MP3
                </button>
                <input ref={fileRef} type="file" accept=".mp3,audio/mpeg" className="hidden" onChange={handleUpload} />
              </div>
            </div>

            {selected.songs.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="px-4 py-2 text-left w-8">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Rating</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {selected.songs.map((song, i) => (
                    <SongRow
                      key={song._id}
                      song={song}
                      index={i}
                      playlistId={selected._id}
                      allSongs={selected.songs}
                      onUpdated={() => queryClient.invalidateQueries({ queryKey: ['playlists'] })}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-4">🎵</p>
                <p>No songs yet — search for music or upload an MP3</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">📂</p>
            <p>Create a playlist to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}

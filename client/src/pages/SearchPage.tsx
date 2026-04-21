import { useState, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchYouTube } from '../api/search';
import { getPlaylists } from '../api/playlists';
import SearchCard from '../components/SearchCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const queryClient = useQueryClient();

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => getPlaylists().then(r => r.data),
  });

  const { data, isFetching, error } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => searchYouTube(submitted).then(r => r.data.items),
    enabled: !!submitted,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim());
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto pb-40">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search YouTube…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Search
        </button>
      </form>

      {isFetching && <LoadingSpinner />}
      {error && <p className="text-red-400 text-center">Search failed. Try again.</p>}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map(item => (
            <SearchCard
              key={item.videoId}
              item={item}
              playlists={playlists}
              onPlaylistsUpdated={() => queryClient.invalidateQueries({ queryKey: ['playlists'] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

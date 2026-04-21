import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl font-bold text-white mb-4">🎵 MusicTube</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-md">
        Search YouTube, build playlists, and upload your own MP3s — all in one place.
      </p>
      {user ? (
        <div className="flex gap-4">
          <Link to="/search" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-medium transition-colors">
            Search Music
          </Link>
          <Link to="/playlists" className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-medium transition-colors">
            My Playlists
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-medium transition-colors">
            Get Started
          </Link>
          <Link to="/login" className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-medium transition-colors">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

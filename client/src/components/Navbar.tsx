import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold text-indigo-400 tracking-tight">
        🎵 MusicTube
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/search" className="text-sm text-gray-300 hover:text-white transition-colors">Search</Link>
            <Link to="/playlists" className="text-sm text-gray-300 hover:text-white transition-colors">Playlists</Link>
            <span className="text-sm text-gray-400">Hi, {user.firstName}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

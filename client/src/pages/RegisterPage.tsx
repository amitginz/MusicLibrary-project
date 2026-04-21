import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ userId: '', username: '', firstName: '', password: '', confirm: '', photoUrl: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerUser({ userId: form.userId, username: form.username, firstName: form.firstName, password: form.password, photoUrl: form.photoUrl });
      toast.success('Registered! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        <h2 className="text-2xl font-bold mb-6">Create Account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { field: 'userId', placeholder: 'ID Number', type: 'text' },
            { field: 'username', placeholder: 'Username', type: 'text' },
            { field: 'firstName', placeholder: 'First Name', type: 'text' },
            { field: 'photoUrl', placeholder: 'Photo URL (optional)', type: 'url' },
            { field: 'password', placeholder: 'Password', type: 'password' },
            { field: 'confirm', placeholder: 'Confirm Password', type: 'password' },
          ].map(({ field, placeholder, type }) => (
            <input
              key={field}
              type={type}
              placeholder={placeholder}
              value={form[field as keyof typeof form]}
              onChange={set(field)}
              required={field !== 'photoUrl'}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          ))}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

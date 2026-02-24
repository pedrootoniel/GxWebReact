import { useState } from 'react';
import { X, Loader2, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, muMode } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(identifier, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card-dark shadow-2xl shadow-black/60 p-8 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5a5040] hover:text-[#d4c9b0] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b8862f] to-[#8b5c28] flex items-center justify-center">
            <Swords className="w-4 h-4 text-[#0a0a0f]" />
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#d4af52] tracking-wide">Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">
              {muMode ? 'Username' : 'Email'}
            </label>
            <input
              type={muMode ? 'text' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={muMode ? 'Enter your username' : 'Enter your email'}
              required
              maxLength={muMode ? 10 : undefined}
              className="input-dark w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="input-dark w-full"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 btn-gold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Login
          </button>
        </form>

        <div className="divider-gold mt-5 mb-4" />

        <p className="text-center text-sm text-[#5a5040]">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-[#c9a44a] hover:text-[#d4af52] font-medium transition-colors"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

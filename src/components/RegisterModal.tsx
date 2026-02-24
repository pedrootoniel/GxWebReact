import { useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password, username);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
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
            <UserPlus className="w-4 h-4 text-[#0a0a0f]" />
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#d4af52] tracking-wide">Create Account</h2>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              Account created successfully! You can now log in.
            </div>
            <button
              onClick={onSwitchToLogin}
              className="text-[#c9a44a] hover:text-[#d4af52] font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  className="input-dark w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="input-dark w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="input-dark w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
                Register
              </button>
            </form>

            <div className="divider-gold mt-5 mb-4" />

            <p className="text-center text-sm text-[#5a5040]">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-[#c9a44a] hover:text-[#d4af52] font-medium transition-colors"
              >
                Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

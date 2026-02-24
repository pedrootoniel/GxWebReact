import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Crown, Server,
  CreditCard, Coins, CircleDot, LogOut, KeyRound,
  RotateCcw, Loader2, Skull, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accountApi, authApi, type MuCharacter } from '../services/api';
import Layout from '../components/layout/Layout';

const API_URL = import.meta.env.VITE_API_URL || '';
const useMuBackend = !!API_URL;

const VIP_NAMES: Record<number, string> = {
  0: 'None',
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
};

export default function AccountPage() {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<MuCharacter[]>([]);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    if (useMuBackend) {
      if (profile.characters) {
        setCharacters(profile.characters);
      } else {
        accountApi.getCharacters().then(d => setCharacters(d.characters)).catch(() => {});
      }
    }
  }, [user, profile]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword.length < 4) {
      setPasswordMsg('Password must be at least 4 characters');
      return;
    }
    try {
      const result = await authApi.changePassword(currentPassword, newPassword);
      setPasswordMsg(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setChangingPassword(false);
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  const doAction = async (charName: string, action: string) => {
    setActionLoading(`${action}-${charName}`);
    setActionMsg('');
    try {
      let result: { message: string };
      if (action === 'reset') {
        const r = await accountApi.resetCharacter(charName);
        result = r;
      } else if (action === 'clearPk') {
        result = await accountApi.clearPk(charName);
      } else if (action === 'unstick') {
        result = await accountApi.unstick(charName);
      } else {
        return;
      }
      setActionMsg(result.message);
      await refreshProfile();
      try {
        const data = await accountApi.getCharacters();
        setCharacters(data.characters);
      } catch { /* empty */ }
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Action failed');
    }
    setActionLoading(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !profile) {
    return (
      <Layout title="Account Panel" subtitle="Loading your account...">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#c9a44a] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Account Panel" subtitle="Manage your account and characters.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card-dark p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#b8862f] to-[#8b5c28] flex items-center justify-center">
                <User className="w-6 h-6 text-[#0a0a0f]" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-[#d4af52]">{profile.username}</h3>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  profile.isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  <CircleDot className="w-2.5 h-2.5" /> {profile.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {profile.server && (
                <div className="flex items-center gap-2 text-[#8a7e6a]">
                  <Server className="w-3.5 h-3.5 text-[#5a5040]" />
                  Server: <strong className="text-[#d4c9b0]">{profile.server}</strong>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#8a7e6a]">
                <Mail className="w-3.5 h-3.5 text-[#5a5040]" />
                Email: <strong className="text-[#d4c9b0]">{profile.email || 'N/A'}</strong>
              </div>
              <div className="flex items-center gap-2 text-[#8a7e6a]">
                <Crown className="w-3.5 h-3.5 text-[#5a5040]" />
                VIP: <strong className="text-[#c9a44a]">{VIP_NAMES[profile.vip_type] || `VIP ${profile.vip_type}`}</strong>
              </div>
              {profile.vip_time && (
                <div className="flex items-center gap-2 text-[#8a7e6a] pl-5">
                  Expires: <strong className="text-[#d4c9b0]">{new Date(profile.vip_time).toLocaleDateString()}</strong>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#8b5c28]/10">
              <button
                onClick={() => setChangingPassword(!changingPassword)}
                className="px-3 py-1.5 text-xs font-medium text-[#d4af52] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors"
              >
                <KeyRound className="w-3 h-3 inline mr-1" />
                Change Password
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3 h-3 inline mr-1" />
                Logout
              </button>
            </div>

            {changingPassword && (
              <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-[#8b5c28]/10 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="input-dark w-full"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 4 chars)"
                  className="input-dark w-full"
                />
                {passwordMsg && (
                  <p className={`text-xs ${passwordMsg.toLowerCase().includes('success') || passwordMsg.toLowerCase().includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passwordMsg}
                  </p>
                )}
                <button type="submit" className="btn-gold px-4 py-2 text-sm rounded-lg">
                  Update Password
                </button>
              </form>
            )}
          </div>

          <div className="card-dark p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cinzel font-bold text-[#d4af52]">Wallet Overview</h3>
              <CreditCard className="w-5 h-5 text-[#5a5040]" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#b8862f]/15 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-[#c9a44a]" />
                </div>
                <div>
                  <p className="text-xs text-[#5a5040]">Credits</p>
                  <p className="text-lg font-bold text-[#d4c9b0]">{profile.credits}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-[#5a5040]">WCoins</p>
                  <p className="text-lg font-bold text-[#d4c9b0]">{profile.credits2}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3d2e1a]/50 flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-[#8a7e6a]" />
                </div>
                <div>
                  <p className="text-xs text-[#5a5040]">Goblin Points</p>
                  <p className="text-lg font-bold text-[#d4c9b0]">{profile.credits3}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {characters.length > 0 && (
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#d4af52] mb-4">Character Info</h2>
            {actionMsg && (
              <div className={`mb-3 text-sm px-4 py-2 rounded-lg ${
                actionMsg.toLowerCase().includes('success') ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'
              }`}>
                {actionMsg}
              </div>
            )}
            <div className="space-y-3">
              {characters.map((char) => (
                <div
                  key={char.name}
                  className="card-dark p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-[#14100c] border border-[#8b5c28]/10 overflow-hidden shrink-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-[#5a5040]">{char.name?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#d4c9b0]">{char.name}</h4>
                      <p className="text-xs text-[#5a5040]">{char.class}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#8a7e6a]">
                        <span>Level: <strong className="text-[#d4c9b0]">{char.level}</strong></span>
                        <span>Resets: <strong className="text-[#d4c9b0]">{char.resets}</strong><sup className="text-[#5a5040]">{char.grandResets}</sup></span>
                        {char.strength !== undefined && (
                          <span>STR: {char.strength} / AGI: {char.dexterity} / VIT: {char.vitality} / ENE: {char.energy}</span>
                        )}
                      </div>
                      {char.money !== undefined && (
                        <div className="flex items-center gap-4 mt-0.5 text-xs text-[#8a7e6a]">
                          <span>Zen: <strong className="text-[#c9a44a]">{char.money?.toLocaleString()}</strong></span>
                          {char.levelUpPoint !== undefined && (
                            <span>Points: <strong className="text-[#d4c9b0]">{char.levelUpPoint}</strong></span>
                          )}
                          {(char.pkCount ?? 0) > 0 && (
                            <span className="text-red-400">PK: {char.pkCount}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {useMuBackend && (
                        <>
                          <button
                            onClick={() => doAction(char.name, 'reset')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#c9a44a] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `reset-${char.name}`
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <RotateCcw className="w-3 h-3" />}
                            Reset
                          </button>
                          <button
                            onClick={() => doAction(char.name, 'clearPk')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#8a7e6a] border border-[#8b5c28]/15 rounded-lg hover:bg-[#8b5c28]/10 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `clearPk-${char.name}`
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Skull className="w-3 h-3" />}
                            Clear PK
                          </button>
                          <button
                            onClick={() => doAction(char.name, 'unstick')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#8a7e6a] border border-[#8b5c28]/15 rounded-lg hover:bg-[#8b5c28]/10 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `unstick-${char.name}`
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <MapPin className="w-3 h-3" />}
                            Unstick
                          </button>
                        </>
                      )}
                      <span className={char.isOnline ? 'badge-online' : 'badge-offline'}>
                        {char.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

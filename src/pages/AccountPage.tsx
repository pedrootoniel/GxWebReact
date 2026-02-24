import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Calendar, Clock, Crown, Server,
  CreditCard, Coins, CircleDot, LogOut, KeyRound,
  ArrowLeftRight, Star, Users, HeadphonesIcon, ChevronDown,
  RotateCcw, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { accountApi, authApi, type MuCharacter } from '../services/api';
import Layout from '../components/layout/Layout';

const API_URL = import.meta.env.VITE_API_URL || '';
const useMuBackend = !!API_URL;

interface SupabaseCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  master_level: number;
  resets: number;
  grand_resets: number;
  is_online: boolean;
}

const services = [
  { icon: Coins, title: 'Currency Exchange', desc: 'Exchange credits to WCoins or other currencies' },
  { icon: Star, title: 'VIP', desc: 'Gain XP boosts, enhanced stats, and exclusive in-game rewards.' },
  { icon: Users, title: 'Referral', desc: 'Invite friends and earn rewards' },
  { icon: HeadphonesIcon, title: 'Support', desc: 'Contact support for help or inquiries.' },
];

export default function AccountPage() {
  const { user, profile, signOut, loading, muMode, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<(MuCharacter | SupabaseCharacter)[]>([]);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    const load = async () => {
      if (useMuBackend) {
        if (profile.characters) {
          setCharacters(profile.characters);
        } else {
          try {
            const data = await accountApi.getCharacters();
            setCharacters(data.characters);
          } catch { /* empty */ }
        }
      } else {
        const { data } = await supabase
          .from('characters')
          .select('*')
          .eq('owner_id', user.id);
        if (data) setCharacters(data);
      }
    };
    load();
  }, [user, profile]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');

    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      return;
    }

    if (useMuBackend) {
      try {
        const result = await authApi.changePassword(currentPassword, newPassword);
        setPasswordMsg(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setChangingPassword(false);
      } catch (err) {
        setPasswordMsg(err instanceof Error ? err.message : 'Failed to update password');
      }
    } else {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMsg(error.message);
      } else {
        setPasswordMsg('Password updated successfully!');
        setNewPassword('');
        setChangingPassword(false);
      }
    }
  };

  const handleReset = async (charName: string) => {
    if (!useMuBackend) return;
    setResetting(charName);
    setResetMsg('');
    try {
      const result = await accountApi.resetCharacter(charName);
      setResetMsg(result.message);
      await refreshProfile();
      try {
        const data = await accountApi.getCharacters();
        setCharacters(data.characters);
      } catch { /* empty */ }
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : 'Reset failed');
    }
    setResetting(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !profile) {
    return (
      <Layout title="Account Panel" subtitle="Loading your account...">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const getCharName = (c: MuCharacter | SupabaseCharacter) => c.name;
  const getCharClass = (c: MuCharacter | SupabaseCharacter) => c.class;
  const getCharLevel = (c: MuCharacter | SupabaseCharacter) => c.level;
  const getCharMl = (c: MuCharacter | SupabaseCharacter) => ('masterLevel' in c ? c.masterLevel : (c as SupabaseCharacter).master_level);
  const getCharResets = (c: MuCharacter | SupabaseCharacter) => c.resets;
  const getCharGr = (c: MuCharacter | SupabaseCharacter) => ('grandResets' in c ? c.grandResets : (c as SupabaseCharacter).grand_resets);
  const getCharOnline = (c: MuCharacter | SupabaseCharacter) => ('isOnline' in c ? c.isOnline : (c as SupabaseCharacter).is_online);

  return (
    <Layout title="Account Panel" subtitle="Manage your account and characters.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{profile.username}</h3>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  profile.isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  <CircleDot className="w-2.5 h-2.5" /> {profile.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                Current Server: <strong className="text-white">{profile.server}</strong>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email: <strong className="text-white">{profile.email}</strong>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Created: <strong className="text-white">{new Date(profile.created_at).toISOString().split('T')[0]}</strong>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last Login: <strong className="text-white">{new Date(profile.last_login).toLocaleString()}</strong>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Crown className="w-3.5 h-3.5 text-slate-500" />
                VIP Type: <strong className="text-amber-400 capitalize">{profile.vip_type}</strong>
              </div>
              {profile.vip_expires && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Expires: <strong className="text-white">{new Date(profile.vip_expires).toISOString().split('T')[0]}</strong>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/30">
              <button className="px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors">
                <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                Switch Server
              </button>
              <button
                onClick={() => setChangingPassword(!changingPassword)}
                className="px-3 py-1.5 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
              >
                <KeyRound className="w-3 h-3 inline mr-1" />
                Change Password
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3 h-3 inline mr-1" />
                Logout
              </button>
            </div>

            {changingPassword && (
              <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-slate-700/30 space-y-3">
                {muMode && (
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordMsg && (
                  <p className={`text-xs ${passwordMsg.toLowerCase().includes('success') || passwordMsg.toLowerCase().includes('updated') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passwordMsg}
                  </p>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Wallet Overview</h3>
              <CreditCard className="w-5 h-5 text-slate-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Credits</p>
                  <p className="text-lg font-bold text-white">{profile.credits}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">WCoins</p>
                  <p className="text-lg font-bold text-white">{profile.wcoins}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Goblin Points</p>
                  <p className="text-lg font-bold text-white">{profile.goblin_points}</p>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full py-2 text-sm font-medium text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors">
              Get More
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Available Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {services.map((svc) => (
              <div
                key={svc.title}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
              >
                <svc.icon className="w-6 h-6 text-blue-400 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">{svc.title}</h4>
                <p className="text-xs text-slate-400 mb-3">{svc.desc}</p>
                <button className="px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors">
                  Use Service
                </button>
              </div>
            ))}
          </div>
        </div>

        {characters.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Character Info</h2>
            {resetMsg && (
              <div className={`mb-3 text-sm px-4 py-2 rounded-lg ${
                resetMsg.toLowerCase().includes('success') ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'
              }`}>
                {resetMsg}
              </div>
            )}
            <div className="space-y-3">
              {characters.map((char) => (
                <div
                  key={getCharName(char)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-lg bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-500">{getCharName(char)[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white">{getCharName(char)}</h4>
                    <p className="text-xs text-slate-400">{getCharClass(char)}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>Level: <strong className="text-white">{getCharLevel(char)}</strong><sup className="text-slate-500">{getCharMl(char)}</sup></span>
                      <span>Resets: <strong className="text-white">{getCharResets(char)}</strong><sup className="text-slate-500">{getCharGr(char)}</sup></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {useMuBackend && (
                      <button
                        onClick={() => handleReset(getCharName(char))}
                        disabled={resetting === getCharName(char)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                      >
                        {resetting === getCharName(char)
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RotateCcw className="w-3 h-3" />}
                        Reset
                      </button>
                    )}
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors">
                      Options <ChevronDown className="w-3 h-3" />
                    </button>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                      getCharOnline(char) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {getCharOnline(char) ? 'ONLINE' : 'OFFLINE'}
                    </span>
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

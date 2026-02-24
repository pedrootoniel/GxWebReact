import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Shield, Coins, Swords, RefreshCw, RotateCcw, Zap, MapPin,
  Lock, LogOut, Loader2, ChevronDown, Crown, Skull, BarChart3, Star
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { accountApi, authApi, vipApi, type MuCharacter, type VipPackage } from '../services/api';

type Tab = 'overview' | 'characters' | 'password' | 'vip';

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile, muMode } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user || !profile) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Swords className="w-4 h-4" /> },
    { id: 'vip', label: 'VIP', icon: <Crown className="w-4 h-4" /> },
    { id: 'password', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <Layout title="Account Panel" subtitle={`Welcome back, ${profile.username}`} showSidebar={false}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="card-dark p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#8b5c28]/20 text-[#c9a44a]'
                    : 'text-[#8a7e6a] hover:text-[#d4c9b0] hover:bg-[#1a1614]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <div className="divider-gold my-2" />
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && <OverviewTab profile={profile} muMode={muMode} />}
          {activeTab === 'characters' && <CharactersTab refreshProfile={refreshProfile} />}
          {activeTab === 'vip' && <VipTab profile={profile} muMode={muMode} />}
          {activeTab === 'password' && <PasswordTab />}
        </div>
      </div>
    </Layout>
  );
}

function OverviewTab({ profile, muMode }: { profile: { username: string; email: string; server: string; vip_type: number; vip_time: string | null; credits: number; credits2: number; credits3: number; isOnline?: boolean; is_admin: boolean }; muMode: boolean }) {
  return (
    <div className="space-y-6">
      <div className="card-dark p-6">
        <h3 className="font-cinzel text-lg font-bold text-[#d4af52] mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-[#5a5040]">Username</span>
            <p className="font-semibold text-[#d4c9b0]">{profile.username}</p>
          </div>
          <div>
            <span className="text-xs text-[#5a5040]">Email</span>
            <p className="font-semibold text-[#d4c9b0]">{profile.email}</p>
          </div>
          <div>
            <span className="text-xs text-[#5a5040]">Status</span>
            <p>{profile.isOnline ? <span className="badge-online">Online</span> : <span className="badge-offline">Offline</span>}</p>
          </div>
          <div>
            <span className="text-xs text-[#5a5040]">VIP</span>
            <p className="font-semibold text-[#d4c9b0]">
              {profile.vip_type > 0 ? (
                <span className="text-[#c9a44a]">Active (expires {profile.vip_time ? new Date(profile.vip_time).toLocaleDateString() : 'N/A'})</span>
              ) : (
                <span className="text-[#5a5040]">None</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {muMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-dark p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-[#c9a44a]" />
              <span className="text-xs text-[#5a5040]">Credits</span>
            </div>
            <p className="text-2xl font-bold text-[#d4af52]">{profile.credits.toLocaleString()}</p>
          </div>
          <div className="card-dark p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-[#5a5040]">WCoins</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{profile.credits2.toLocaleString()}</p>
          </div>
          <div className="card-dark p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-[#5a5040]">Goblin Points</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{profile.credits3.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CharactersTab({ refreshProfile }: { refreshProfile: () => Promise<void> }) {
  const [characters, setCharacters] = useState<MuCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [statsForm, setStatsForm] = useState({ str: 0, agi: 0, vit: 0, ene: 0, cmd: 0 });

  useEffect(() => { loadCharacters(); }, []);

  const loadCharacters = async () => {
    try {
      const data = await accountApi.getCharacters();
      setCharacters(data.characters || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const performAction = async (action: string, charName: string) => {
    setActionLoading(`${action}-${charName}`);
    setMessage({ text: '', type: '' });
    try {
      let result;
      switch (action) {
        case 'reset': result = await accountApi.resetCharacter(charName); break;
        case 'grand-reset': result = await accountApi.grandResetCharacter(charName); break;
        case 'reset-stats': result = await accountApi.resetStats(charName); break;
        case 'clear-pk': result = await accountApi.clearPk(charName); break;
        case 'unstick': result = await accountApi.unstick(charName); break;
        default: return;
      }
      setMessage({ text: result.message, type: 'success' });
      loadCharacters();
      refreshProfile();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Action failed', type: 'error' });
    } finally {
      setActionLoading('');
    }
  };

  const handleAddStats = async (charName: string) => {
    const total = statsForm.str + statsForm.agi + statsForm.vit + statsForm.ene + statsForm.cmd;
    if (total <= 0) return;
    setActionLoading(`stats-${charName}`);
    setMessage({ text: '', type: '' });
    try {
      const result = await accountApi.addStats(charName, statsForm.str, statsForm.agi, statsForm.vit, statsForm.ene, statsForm.cmd || undefined);
      setMessage({ text: result.message, type: 'success' });
      setStatsForm({ str: 0, agi: 0, vit: 0, ene: 0, cmd: 0 });
      loadCharacters();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to add stats', type: 'error' });
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#c9a44a] animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      {message.text && (
        <div className={`text-sm rounded-lg px-4 py-3 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>{message.text}</div>
      )}

      {characters.length === 0 ? (
        <div className="text-center py-12 text-[#5a5040]">No characters found</div>
      ) : characters.map(char => (
        <div key={char.name} className="card-dark overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === char.name ? null : char.name)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-[#d4c9b0]">{char.name}</h4>
                  {char.isOnline ? <span className="badge-online">Online</span> : <span className="badge-offline">Offline</span>}
                </div>
                <p className="text-xs text-[#5a5040]">{char.class}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-[#d4c9b0]">Lv. {char.level}</p>
                <p className="text-xs text-[#5a5040]">{char.resets}R / {char.grandResets}GR</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#5a5040] transition-transform ${expanded === char.name ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {expanded === char.name && (
            <div className="px-4 pb-4 animate-fade-in">
              <div className="divider-gold mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatBlock label="Level" value={char.level} />
                <StatBlock label="Resets" value={char.resets} />
                <StatBlock label="Grand Resets" value={char.grandResets} />
                <StatBlock label="Zen" value={(char.money || 0).toLocaleString()} />
                <StatBlock label="STR" value={char.strength || 0} />
                <StatBlock label="AGI" value={char.dexterity || 0} />
                <StatBlock label="VIT" value={char.vitality || 0} />
                <StatBlock label="ENE" value={char.energy || 0} />
                {(char.leadership || 0) > 0 && <StatBlock label="CMD" value={char.leadership || 0} />}
                <StatBlock label="Points" value={char.levelUpPoint || 0} />
                <StatBlock label="PK Level" value={char.pkLevel || 0} />
                <StatBlock label="PK Count" value={char.pkCount || 0} />
              </div>

              {(char.levelUpPoint || 0) > 0 && (
                <div className="bg-[#0a0a0f]/40 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-medium text-[#c9a44a] mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Add Stats ({char.levelUpPoint} points available)
                  </h5>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {['str', 'agi', 'vit', 'ene', 'cmd'].map(stat => (
                      <div key={stat}>
                        <label className="text-xs text-[#5a5040] uppercase">{stat}</label>
                        <input
                          type="number"
                          min={0}
                          value={statsForm[stat as keyof typeof statsForm]}
                          onChange={e => setStatsForm(f => ({ ...f, [stat]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="input-dark w-full text-center text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddStats(char.name)}
                    disabled={actionLoading === `stats-${char.name}` || (statsForm.str + statsForm.agi + statsForm.vit + statsForm.ene + statsForm.cmd <= 0)}
                    className="btn-gold px-4 py-1.5 rounded text-xs disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === `stats-${char.name}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Apply Stats
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <ActionButton label="Reset" icon={<RefreshCw className="w-3 h-3" />} loading={actionLoading === `reset-${char.name}`} onClick={() => performAction('reset', char.name)} />
                <ActionButton label="Grand Reset" icon={<Star className="w-3 h-3" />} loading={actionLoading === `grand-reset-${char.name}`} onClick={() => performAction('grand-reset', char.name)} />
                <ActionButton label="Reset Stats" icon={<RotateCcw className="w-3 h-3" />} loading={actionLoading === `reset-stats-${char.name}`} onClick={() => performAction('reset-stats', char.name)} />
                <ActionButton label="Clear PK" icon={<Skull className="w-3 h-3" />} loading={actionLoading === `clear-pk-${char.name}`} onClick={() => performAction('clear-pk', char.name)} variant="warning" />
                <ActionButton label="Unstick" icon={<MapPin className="w-3 h-3" />} loading={actionLoading === `unstick-${char.name}`} onClick={() => performAction('unstick', char.name)} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VipTab({ profile, muMode }: { profile: { vip_type: number; vip_time: string | null }; muMode: boolean }) {
  const [packages, setPackages] = useState<VipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (muMode) loadPackages();
    else setLoading(false);
  }, [muMode]);

  const loadPackages = async () => {
    try {
      const data = await vipApi.getPackages();
      setPackages(data.packages || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const handlePurchase = async (pkgId: number) => {
    setPurchasing(pkgId);
    setMessage({ text: '', type: '' });
    try {
      const result = await vipApi.purchase(pkgId);
      setMessage({ text: result.message, type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Purchase failed', type: 'error' });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#c9a44a] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {profile.vip_type > 0 && (
        <div className="card-dark p-4 border-[#c9a44a]/30">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-[#c9a44a]" />
            <span className="font-cinzel font-bold text-[#d4af52]">VIP Active</span>
          </div>
          <p className="text-sm text-[#8a7e6a]">
            Expires: {profile.vip_time ? new Date(profile.vip_time).toLocaleString() : 'N/A'}
          </p>
        </div>
      )}

      {message.text && (
        <div className={`text-sm rounded-lg px-4 py-3 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>{message.text}</div>
      )}

      {!muMode ? (
        <div className="text-center py-12 text-[#5a5040]">VIP requires SQL Server backend mode.</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 text-[#5a5040]">No VIP packages available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="card-dark p-5 hover:border-[#8b5c28]/40 transition-all">
              <h4 className="font-cinzel font-bold text-[#d4af52] mb-1">{pkg.package_title}</h4>
              <p className="text-xs text-[#5a5040] mb-4">{pkg.vip_time} days</p>
              <div className="space-y-2 text-xs text-[#8a7e6a] mb-4">
                {pkg.shop_discount > 0 && <div>Shop Discount: <span className="text-[#d4c9b0]">{pkg.shop_discount}%</span></div>}
                {pkg.reset_bonus_points > 0 && <div>Reset Bonus: <span className="text-[#d4c9b0]">+{pkg.reset_bonus_points}</span></div>}
                {pkg.wcoins > 0 && <div>Bonus WCoins: <span className="text-[#d4c9b0]">+{pkg.wcoins}</span></div>}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Coins className={`w-5 h-5 ${pkg.payment_type === 2 ? 'text-emerald-400' : 'text-[#c9a44a]'}`} />
                <span className={`text-xl font-bold ${pkg.payment_type === 2 ? 'text-emerald-400' : 'text-[#d4af52]'}`}>{pkg.price.toLocaleString()}</span>
                <span className="text-xs text-[#5a5040]">{pkg.payment_type === 2 ? 'Gold' : 'Credits'}</span>
              </div>
              <button onClick={() => handlePurchase(pkg.id)} disabled={purchasing === pkg.id} className="w-full py-2 btn-gold rounded-lg text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
                {purchasing === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />} Purchase
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) { setMessage({ text: 'Passwords do not match', type: 'error' }); return; }
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const result = await authApi.changePassword(current, newPw);
      setMessage({ text: result.message, type: 'success' });
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md">
      <div className="card-dark p-6">
        <h3 className="font-cinzel text-lg font-bold text-[#d4af52] mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Change Password
        </h3>
        {message.text && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{message.text}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#8a7e6a] mb-1">Current Password</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required className="input-dark w-full" />
          </div>
          <div>
            <label className="block text-sm text-[#8a7e6a] mb-1">New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={4} className="input-dark w-full" />
          </div>
          <div>
            <label className="block text-sm text-[#8a7e6a] mb-1">Confirm New Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="input-dark w-full" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 btn-gold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#0a0a0f]/60 rounded-lg p-2.5">
      <span className="text-xs text-[#5a5040]">{label}</span>
      <p className="font-bold text-sm text-[#d4c9b0]">{value}</p>
    </div>
  );
}

function ActionButton({ label, icon, loading, onClick, variant = 'default' }: {
  label: string; icon: React.ReactNode; loading: boolean; onClick: () => void; variant?: 'default' | 'warning';
}) {
  return (
    <button onClick={onClick} disabled={loading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
      variant === 'warning' ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'bg-[#8b5c28]/10 text-[#c9a44a] hover:bg-[#8b5c28]/20'
    }`}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon} {label}
    </button>
  );
}

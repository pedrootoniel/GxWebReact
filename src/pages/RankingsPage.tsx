import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, Users, Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { rankingsApi, type MuCharacter, type MuGuild } from '../services/api';
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
  vip_badge: string;
  image_url: string;
}

const classes = [
  'All Classes',
  'Dark Knight', 'Blade Knight', 'Blade Master',
  'Dark Wizard', 'Soul Master', 'Grand Master',
  'Fairy Elf', 'Muse Elf', 'High Elf',
  'Magic Gladiator', 'Duel Master',
  'Dark Lord', 'Lord Emperor',
  'Summoner', 'Bloody Summoner', 'Dimension Master',
  'Rage Fighter', 'Fist Master',
  'Grow Lancer', 'Mirage Lancer',
  'Rune Wizard', 'Rune Spell Master',
];

type Tab = 'players' | 'guilds';

export default function RankingsPage() {
  const [characters, setCharacters] = useState<(MuCharacter | SupabaseCharacter)[]>([]);
  const [guilds, setGuilds] = useState<MuGuild[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [tab, setTab] = useState<Tab>('players');
  const [selectedChar, setSelectedChar] = useState<MuCharacter | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<{ name: string; members: MuCharacter[] } | null>(null);
  const [page, setPage] = useState(1);

  const loadPlayers = useCallback(async () => {
    if (useMuBackend) {
      try {
        const data = await rankingsApi.getPlayers({ page, limit: 20, className: classFilter, search });
        setCharacters(data.characters);
      } catch {
        setCharacters([]);
      }
    } else {
      let query = supabase
        .from('characters')
        .select('*')
        .order('resets', { ascending: false })
        .order('level', { ascending: false })
        .limit(50);

      if (classFilter !== 'All Classes') query = query.eq('class', classFilter);
      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);

      const { data } = await query;
      if (data) setCharacters(data);
    }
  }, [page, classFilter, search]);

  const loadGuilds = useCallback(async () => {
    if (useMuBackend) {
      try {
        const data = await rankingsApi.getGuilds({ page, limit: 20, search });
        setGuilds(data.guilds);
      } catch {
        setGuilds([]);
      }
    } else {
      setGuilds([
        { name: 'DarkLegion', score: 5000, masterName: 'Canute', masterLevel: 400, masterResets: 15, memberCount: 12 },
        { name: 'Phoenix', score: 4200, masterName: 'pulse2', masterLevel: 390, masterResets: 12, memberCount: 8 },
        { name: 'Legends', score: 3800, masterName: 'Chicken', masterLevel: 385, masterResets: 10, memberCount: 6 },
      ]);
    }
  }, [page, search]);

  useEffect(() => {
    if (tab === 'players') loadPlayers();
    else loadGuilds();
  }, [tab, loadPlayers, loadGuilds]);

  const handleCharClick = async (name: string) => {
    if (!useMuBackend) return;
    try {
      const char = await rankingsApi.getCharacter(name);
      setSelectedChar(char);
    } catch { /* empty */ }
  };

  const handleGuildClick = async (guildName: string) => {
    if (!useMuBackend) return;
    try {
      const data = await rankingsApi.getGuildMembers(guildName);
      setSelectedGuild({ name: guildName, members: data.members });
    } catch { /* empty */ }
  };

  const getName = (c: MuCharacter | SupabaseCharacter) => 'name' in c ? c.name : '';
  const getClass = (c: MuCharacter | SupabaseCharacter) => 'class' in c ? c.class : '';
  const getLevel = (c: MuCharacter | SupabaseCharacter) => 'level' in c ? c.level : 0;
  const getMl = (c: MuCharacter | SupabaseCharacter) => ('masterLevel' in c ? c.masterLevel : ('master_level' in c ? (c as SupabaseCharacter).master_level : 0));
  const getResets = (c: MuCharacter | SupabaseCharacter) => 'resets' in c ? c.resets : 0;
  const getGr = (c: MuCharacter | SupabaseCharacter) => ('grandResets' in c ? c.grandResets : ('grand_resets' in c ? (c as SupabaseCharacter).grand_resets : 0));
  const getOnline = (c: MuCharacter | SupabaseCharacter) => ('isOnline' in c ? c.isOnline : ('is_online' in c ? (c as SupabaseCharacter).is_online : false));

  return (
    <Layout title="Rankings" subtitle="Check the top players in our MuOnline server.">
      <div className="space-y-5">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={tab === 'players' ? 'Search player...' : 'Search guild...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          {tab === 'players' && (
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setTab('players'); setPage(1); setSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === 'players' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Swords className="w-3.5 h-3.5" /> Players
            </button>
            <button
              onClick={() => { setTab('guilds'); setPage(1); setSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === 'guilds' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Guilds
            </button>
          </div>
        </div>

        {tab === 'players' && (
          <div className="space-y-3">
            {characters.map((char, index) => (
              <div
                key={getName(char) + index}
                onClick={() => handleCharClick(getName(char))}
                className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 hover:border-slate-600/50 transition-all ${useMuBackend ? 'cursor-pointer' : ''}`}
              >
                <span className={`text-lg font-bold w-8 text-center ${
                  index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {(page - 1) * 20 + index + 1}
                </span>

                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-500">{getName(char)?.[0]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{getName(char)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{getClass(char)}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
                  <span className="text-white">Lv: {getLevel(char)}</span>
                  <span>ML: {getMl(char)}</span>
                  <span>Resets: <strong className="text-white">{getResets(char)}</strong></span>
                  <span>GR: <strong className="text-white">{getGr(char)}</strong></span>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded shrink-0 ${
                  getOnline(char) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {getOnline(char) ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            ))}

            {characters.length === 0 && (
              <div className="text-center py-12 text-slate-500">No characters found.</div>
            )}

            {useMuBackend && characters.length >= 20 && (
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white text-sm rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-slate-400">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'guilds' && (
          <div className="space-y-3">
            {guilds.map((guild, index) => (
              <div
                key={guild.name}
                onClick={() => handleGuildClick(guild.name)}
                className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 hover:border-slate-600/50 transition-all ${useMuBackend ? 'cursor-pointer' : ''}`}
              >
                <span className={`text-lg font-bold w-8 text-center ${
                  index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {index + 1}
                </span>

                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white text-sm">{guild.name}</span>
                  <p className="text-xs text-slate-400">Master: {guild.masterName}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
                  <span>Score: <strong className="text-white">{guild.score}</strong></span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {guild.memberCount}</span>
                  <span>Resets: <strong className="text-white">{guild.masterResets}</strong></span>
                </div>
              </div>
            ))}

            {guilds.length === 0 && (
              <div className="text-center py-12 text-slate-500">No guilds found.</div>
            )}
          </div>
        )}

        {selectedChar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedChar(null)} />
            <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-4">{selectedChar.name}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-white font-semibold">{selectedChar.class}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-xs text-slate-500">Level / ML</p>
                  <p className="text-white font-semibold">{selectedChar.level} / {selectedChar.masterLevel}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-xs text-slate-500">Resets / GR</p>
                  <p className="text-white font-semibold">{selectedChar.resets} / {selectedChar.grandResets}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={selectedChar.isOnline ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {selectedChar.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                {selectedChar.strength !== undefined && (
                  <>
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                      <p className="text-xs text-slate-500">STR / AGI</p>
                      <p className="text-white font-semibold">{selectedChar.strength} / {selectedChar.dexterity}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                      <p className="text-xs text-slate-500">VIT / ENE</p>
                      <p className="text-white font-semibold">{selectedChar.vitality} / {selectedChar.energy}</p>
                    </div>
                  </>
                )}
                {selectedChar.guildName && (
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 col-span-2">
                    <p className="text-xs text-slate-500">Guild</p>
                    <p className="text-white font-semibold">{selectedChar.guildName}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedChar(null)}
                className="mt-4 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {selectedGuild && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedGuild(null)} />
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold text-white">{selectedGuild.name}</h3>
                <span className="text-sm text-slate-400">({selectedGuild.members.length} members)</span>
              </div>
              <div className="space-y-2">
                {selectedGuild.members.map((m) => (
                  <div key={m.name} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white">{m.name}</span>
                      <p className="text-xs text-slate-400">{m.class}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Lv: {m.level}</span>
                      <span>R: {m.resets}</span>
                      <span className={m.isOnline ? 'text-emerald-400' : 'text-red-400'}>
                        {m.isOnline ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedGuild(null)}
                className="mt-4 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

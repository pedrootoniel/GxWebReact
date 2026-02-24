import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, Users, Swords } from 'lucide-react';
import { rankingsApi, type MuCharacter, type MuGuild, type MuGuildMember } from '../services/api';
import Layout from '../components/layout/Layout';

const API_URL = import.meta.env.VITE_API_URL || '';
const useMuBackend = !!API_URL;

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
  const [characters, setCharacters] = useState<MuCharacter[]>([]);
  const [guilds, setGuilds] = useState<MuGuild[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [tab, setTab] = useState<Tab>('players');
  const [selectedChar, setSelectedChar] = useState<MuCharacter | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<{ name: string; members: MuGuildMember[] } | null>(null);
  const [page, setPage] = useState(1);

  const loadPlayers = useCallback(async () => {
    if (!useMuBackend) return;
    try {
      const data = await rankingsApi.getPlayers({ page, limit: 20, className: classFilter, search });
      setCharacters(data.characters);
    } catch {
      setCharacters([]);
    }
  }, [page, classFilter, search]);

  const loadGuilds = useCallback(async () => {
    if (!useMuBackend) return;
    try {
      const data = await rankingsApi.getGuilds({ page, limit: 20, search });
      setGuilds(data.guilds);
    } catch {
      setGuilds([]);
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

  return (
    <Layout title="Rankings" subtitle="Check the top players in our MuOnline server.">
      <div className="space-y-5">
        <div className="card-dark p-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5040]" />
            <input
              type="text"
              placeholder={tab === 'players' ? 'Search player...' : 'Search guild...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-dark w-full pl-10"
            />
          </div>

          {tab === 'players' && (
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="input-dark w-full appearance-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setTab('players'); setPage(1); setSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                tab === 'players' ? 'btn-gold' : 'text-[#8a7e6a] border border-[#8b5c28]/20 hover:bg-[#8b5c28]/10'
              }`}
            >
              <Swords className="w-3.5 h-3.5" /> Players
            </button>
            <button
              onClick={() => { setTab('guilds'); setPage(1); setSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                tab === 'guilds' ? 'btn-gold' : 'text-[#8a7e6a] border border-[#8b5c28]/20 hover:bg-[#8b5c28]/10'
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
                key={char.name + index}
                onClick={() => handleCharClick(char.name)}
                className="card-dark p-4 flex items-center gap-4 hover:border-[#8b5c28]/30 transition-all cursor-pointer"
              >
                <span className={`text-lg font-bold w-8 text-center font-cinzel ${
                  index === 0 ? 'text-[#c9a44a]' : index === 1 ? 'text-[#d4c9b0]' : index === 2 ? 'text-[#8b5c28]' : 'text-[#5a5040]'
                }`}>
                  {(page - 1) * 20 + index + 1}
                </span>

                <div className="w-12 h-12 rounded-lg bg-[#14100c] border border-[#8b5c28]/10 overflow-hidden shrink-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#5a5040]">{char.name?.[0]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#d4c9b0] text-sm">{char.name}</span>
                  </div>
                  <p className="text-xs text-[#5a5040]">{char.class}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-sm text-[#8a7e6a]">
                  <span className="text-[#d4c9b0]">Lv: {char.level}</span>
                  <span>Resets: <strong className="text-[#d4c9b0]">{char.resets}</strong></span>
                  <span>GR: <strong className="text-[#d4c9b0]">{char.grandResets}</strong></span>
                </div>

                <span className={char.isOnline ? 'badge-online' : 'badge-offline'}>
                  {char.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            ))}

            {characters.length === 0 && (
              <div className="text-center py-12 text-[#5a5040]">No characters found.</div>
            )}

            {characters.length >= 20 && (
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/20 rounded-lg hover:bg-[#8b5c28]/10 disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-[#5a5040]">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/20 rounded-lg hover:bg-[#8b5c28]/10 transition-colors"
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
                className="card-dark p-4 flex items-center gap-4 hover:border-[#8b5c28]/30 transition-all cursor-pointer"
              >
                <span className={`text-lg font-bold w-8 text-center font-cinzel ${
                  index === 0 ? 'text-[#c9a44a]' : index === 1 ? 'text-[#d4c9b0]' : index === 2 ? 'text-[#8b5c28]' : 'text-[#5a5040]'
                }`}>
                  {index + 1}
                </span>

                <div className="w-12 h-12 rounded-lg bg-[#14100c] border border-[#8b5c28]/10 overflow-hidden shrink-0 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#5a5040]" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[#d4c9b0] text-sm">{guild.name}</span>
                  <p className="text-xs text-[#5a5040]">Master: {guild.master}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-sm text-[#8a7e6a]">
                  <span>Score: <strong className="text-[#d4c9b0]">{guild.score}</strong></span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {guild.memberCount}</span>
                  <span>Resets: <strong className="text-[#d4c9b0]">{guild.masterResets}</strong></span>
                </div>
              </div>
            ))}

            {guilds.length === 0 && (
              <div className="text-center py-12 text-[#5a5040]">No guilds found.</div>
            )}
          </div>
        )}

        {selectedChar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedChar(null)} />
            <div className="relative w-full max-w-lg card-dark shadow-2xl shadow-black/60 p-6 animate-fade-in">
              <h3 className="text-xl font-cinzel font-bold text-[#d4af52] mb-4">{selectedChar.name}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
                  <p className="text-xs text-[#5a5040]">Class</p>
                  <p className="text-[#d4c9b0] font-semibold">{selectedChar.class}</p>
                </div>
                <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
                  <p className="text-xs text-[#5a5040]">Level</p>
                  <p className="text-[#d4c9b0] font-semibold">{selectedChar.level}</p>
                </div>
                <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
                  <p className="text-xs text-[#5a5040]">Resets / GR</p>
                  <p className="text-[#d4c9b0] font-semibold">{selectedChar.resets} / {selectedChar.grandResets}</p>
                </div>
                <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
                  <p className="text-xs text-[#5a5040]">Status</p>
                  <p className={selectedChar.isOnline ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {selectedChar.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                {selectedChar.strength !== undefined && (
                  <>
                    <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
                      <p className="text-xs text-[#5a5040]">STR / AGI</p>
                      <p className="text-[#d4c9b0] font-semibold">{selectedChar.strength} / {selectedChar.dexterity}</p>
                    </div>
                    <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
                      <p className="text-xs text-[#5a5040]">VIT / ENE</p>
                      <p className="text-[#d4c9b0] font-semibold">{selectedChar.vitality} / {selectedChar.energy}</p>
                    </div>
                  </>
                )}
                {selectedChar.guildName && (
                  <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10 col-span-2">
                    <p className="text-xs text-[#5a5040]">Guild</p>
                    <p className="text-[#d4c9b0] font-semibold">{selectedChar.guildName}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedChar(null)}
                className="mt-4 px-5 py-2 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {selectedGuild && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedGuild(null)} />
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto card-dark shadow-2xl shadow-black/60 p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-[#c9a44a]" />
                <h3 className="text-xl font-cinzel font-bold text-[#d4af52]">{selectedGuild.name}</h3>
                <span className="text-sm text-[#5a5040]">({selectedGuild.members.length} members)</span>
              </div>
              <div className="space-y-2">
                {selectedGuild.members.map((m) => (
                  <div key={m.name} className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#d4c9b0]">{m.name}</span>
                        {m.role !== 'Member' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#8b5c28]/20 text-[#c9a44a]">{m.role}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#5a5040]">{m.class}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#8a7e6a]">
                      <span>Lv: {m.level}</span>
                      <span>R: {m.resets}</span>
                      <span>GR: {m.grandResets}</span>
                      <span className={m.isOnline ? 'text-emerald-400' : 'text-red-400'}>
                        {m.isOnline ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedGuild(null)}
                className="mt-4 px-5 py-2 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors"
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

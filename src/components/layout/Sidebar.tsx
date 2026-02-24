import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, UserPlus, Shield, Flame, Trophy, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCountdown } from '../../hooks/useCountdown';
import { useAuth } from '../../context/AuthContext';

interface Server {
  id: string;
  name: string;
  is_online: boolean;
  players_online: number;
  max_players: number;
  load_percent: number;
}

interface EventData {
  id: string;
  name: string;
  next_run: string;
}

interface CastleSiegeData {
  owner_guild: string;
  next_siege: string;
}

interface TopPlayer {
  name: string;
  level: number;
  master_level: number;
  resets: number;
  grand_resets: number;
}

function EventCountdown({ date }: { date: string }) {
  const time = useCountdown(date);
  return <span className="text-[#c9a44a] font-mono text-xs">{time}</span>;
}

function SiegeCountdown({ date }: { date: string }) {
  const time = useCountdown(date);
  return <span className="text-[#c9a44a] font-mono text-sm">{time}</span>;
}

export default function Sidebar() {
  const [servers, setServers] = useState<Server[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [siege, setSiege] = useState<CastleSiegeData | null>(null);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const { user, profile } = useAuth();

  useEffect(() => {
    const load = async () => {
      const [srvRes, evtRes, csRes, tpRes] = await Promise.all([
        supabase.from('servers').select('*'),
        supabase.from('events').select('*'),
        supabase.from('castle_siege').select('*').limit(1).maybeSingle(),
        supabase.from('characters').select('name, level, master_level, resets, grand_resets').order('resets', { ascending: false }).order('level', { ascending: false }).limit(5),
      ]);
      if (srvRes.data) setServers(srvRes.data);
      if (evtRes.data) setEvents(evtRes.data);
      if (csRes.data) setSiege(csRes.data);
      if (tpRes.data) setTopPlayers(tpRes.data);
    };
    load();
  }, []);

  return (
    <aside className="space-y-5">
      {user && profile ? (
        <div className="card-dark glow-gold p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b8862f] to-[#8b5c28] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#0a0a0f]" />
            </div>
            <div>
              <h3 className="text-sm font-cinzel font-bold text-[#d4af52]">{profile.username}</h3>
              <p className="text-[11px] text-[#8a7e6a]">Welcome back, adventurer</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#8a7e6a]">
              <span>Credits:</span>
              <span className="text-[#d4af52] font-semibold">{profile.credits}</span>
            </div>
            <div className="flex justify-between text-[#8a7e6a]">
              <span>WCoins:</span>
              <span className="text-[#d4af52] font-semibold">{profile.wcoins}</span>
            </div>
            <div className="flex justify-between text-[#8a7e6a]">
              <span>Goblin Points:</span>
              <span className="text-[#d4af52] font-semibold">{profile.goblin_points}</span>
            </div>
            <div className="divider-gold my-2" />
            <div className="flex justify-between text-[#8a7e6a]">
              <span>Server:</span>
              <span className="text-[#d4c9b0] font-semibold">{profile.server}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Link to="/account" className="block w-full text-center py-2 btn-gold text-sm rounded-lg">
              Buy Credits
            </Link>
            <Link to="/account" className="block w-full text-center py-2 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors">
              Vote Reward
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-dark glow-gold p-5 text-center">
          <h3 className="font-cinzel text-lg font-bold text-[#d4af52] mb-1">Join the Adventure</h3>
          <p className="text-sm text-[#8a7e6a] mb-4">Play MuOnline with thousands of players!</p>
          <div className="space-y-2">
            <Link
              to="/download"
              className="flex items-center justify-center gap-2 w-full py-2.5 btn-gold text-sm rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download Game
            </Link>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-register'))}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>
        </div>
      )}

      <div className="card-dark glow-gold p-5">
        <h3 className="text-center font-cinzel text-sm font-bold text-[#d4af52] tracking-wider uppercase mb-4">Servers</h3>
        <div className="space-y-3">
          {servers.map((server) => (
            <div key={server.id} className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#d4c9b0]">{server.name}</span>
                <span className={server.is_online ? 'badge-online' : 'badge-offline'}>
                  {server.is_online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#8a7e6a]">
                <span>
                  Players: <strong className="text-[#d4c9b0]">{server.players_online}/{server.max_players}</strong>
                </span>
                <span>
                  Load: <strong className="text-[#d4c9b0]">{server.load_percent}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark glow-gold p-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#c9a44a]" />
          <h3 className="font-cinzel text-sm font-bold text-[#d4af52] tracking-wider uppercase">Castle Siege</h3>
        </div>
        {siege && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b8862f] to-[#8b5c28] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#0a0a0f]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[#5a5040]">Current Owner</p>
                <p className="text-sm font-bold text-[#d4c9b0]">{siege.owner_guild}</p>
              </div>
            </div>
            <div className="bg-[#0f0d0a]/50 rounded-lg p-3 border border-[#8b5c28]/10">
              <p className="text-xs text-[#5a5040] mb-1">Next Siege:</p>
              <SiegeCountdown date={siege.next_siege} />
            </div>
          </div>
        )}
      </div>

      <div className="card-dark glow-gold p-5">
        <h3 className="text-center font-cinzel text-sm font-bold text-[#d4af52] tracking-wider uppercase mb-4">Upcoming Events</h3>
        <div className="space-y-2">
          {events.map((evt) => (
            <div key={evt.id} className="flex items-center justify-between bg-[#0f0d0a]/50 rounded-lg px-3 py-2.5 border border-[#8b5c28]/10">
              <span className="text-sm text-[#d4c9b0]">{evt.name}</span>
              <EventCountdown date={evt.next_run} />
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark glow-gold p-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-[#c9a44a]" />
          <h3 className="font-cinzel text-sm font-bold text-[#d4af52] tracking-wider uppercase">Top Players</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#c9a44a]/70 border-b border-[#8b5c28]/15">
              <th className="text-left pb-2 font-medium text-xs">Player</th>
              <th className="text-center pb-2 font-medium text-xs">Lvl/ML</th>
              <th className="text-center pb-2 font-medium text-xs">Resets</th>
              <th className="text-center pb-2 font-medium text-xs">GR</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.map((p, i) => (
              <tr key={p.name} className="border-b border-[#8b5c28]/8 last:border-0">
                <td className="py-2 text-[#d4c9b0]">
                  <span className={`mr-1.5 text-xs font-bold ${i === 0 ? 'text-[#c9a44a]' : i === 1 ? 'text-[#d4c9b0]' : i === 2 ? 'text-[#8b5c28]' : 'text-[#5a5040]'}`}>
                    {i + 1}.
                  </span>
                  {p.name}
                </td>
                <td className="py-2 text-center text-[#8a7e6a]">{p.level}/{p.master_level}</td>
                <td className="py-2 text-center text-[#8a7e6a]">{p.resets}</td>
                <td className="py-2 text-center text-[#8a7e6a]">{p.grand_resets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

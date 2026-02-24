import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, UserPlus, Shield, Flame, Trophy } from 'lucide-react';
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
  return <span className="text-emerald-400 font-mono text-sm">{time}</span>;
}

function SiegeCountdown({ date }: { date: string }) {
  const time = useCountdown(date);
  return <span className="text-emerald-400 font-mono text-sm">{time}</span>;
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
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-center text-lg font-bold text-white mb-1">Welcome, {profile.username}!</h3>
          <p className="text-center text-xs text-slate-400 mb-4">Manage your account and enjoy your journey in MuOnline</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Credits:</span>
              <span className="text-white font-semibold">{profile.credits}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>WCoins:</span>
              <span className="text-white font-semibold">{profile.wcoins}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Goblin Points:</span>
              <span className="text-white font-semibold">{profile.goblin_points}</span>
            </div>
            <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-700/50">
              <span>Server:</span>
              <span className="text-white font-semibold">{profile.server}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Link to="/account" className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
              Buy Credits
            </Link>
            <Link to="/account" className="block w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-slate-600 transition-colors">
              Vote Reward
            </Link>
            <Link to="/account" className="block w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-slate-600 transition-colors">
              Warehouse
            </Link>
            <Link to="/account" className="block w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-slate-600 transition-colors">
              Account Logs
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-center">
          <h3 className="text-lg font-bold text-white mb-1">Join the Adventure</h3>
          <p className="text-sm text-slate-400 mb-4">Play MuOnline with thousands of players!</p>
          <div className="space-y-2">
            <Link
              to="/download"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Game
            </Link>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-register'))}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-slate-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-center text-lg font-bold text-white mb-4">Servers</h3>
        <div className="space-y-3">
          {servers.map((server) => (
            <div key={server.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{server.name}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    server.is_online
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {server.is_online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Players: <strong className="text-slate-200">{server.players_online}/{server.max_players}</strong>
                </span>
                <span>
                  Load: <strong className="text-slate-200">{server.load_percent}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Castle Siege</h3>
        </div>
        {siege && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400">Current Owner</p>
                <p className="text-sm font-bold text-white">{siege.owner_guild}</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-400 mb-1">Next Siege:</p>
              <SiegeCountdown date={siege.next_siege} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-center text-lg font-bold text-white mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {events.map((evt) => (
            <div key={evt.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2.5 border border-slate-700/30">
              <span className="text-sm text-slate-300">{evt.name}</span>
              <EventCountdown date={evt.next_run} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Top Players</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-blue-400 border-b border-slate-700/50">
              <th className="text-left pb-2 font-medium">Player</th>
              <th className="text-center pb-2 font-medium">Lvl/ML</th>
              <th className="text-center pb-2 font-medium">Resets</th>
              <th className="text-center pb-2 font-medium">GR</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.map((p) => (
              <tr key={p.name} className="border-b border-slate-700/20 last:border-0">
                <td className="py-2 text-slate-300">{p.name}</td>
                <td className="py-2 text-center text-slate-400">{p.level} / {p.master_level}</td>
                <td className="py-2 text-center text-slate-400">{p.resets}</td>
                <td className="py-2 text-center text-slate-400">{p.grand_resets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

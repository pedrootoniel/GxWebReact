import { Swords } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-sm font-bold text-white">Pulse MuCMS</p>
            <p className="text-xs text-slate-400">The ultimate CMS for your MuOnline private server</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">&copy; 2026 Pulse MuCMS</p>
      </div>
    </footer>
  );
}

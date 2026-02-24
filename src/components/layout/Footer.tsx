import { Swords } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#8b5c28]/15 py-8 bg-[#060608]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#b8862f] to-[#8b5c28] flex items-center justify-center">
            <Swords className="w-3.5 h-3.5 text-[#0a0a0f]" />
          </div>
          <div>
            <p className="text-sm font-cinzel font-bold text-[#c9a44a] tracking-wider">PULSE</p>
            <p className="text-xs text-[#5a5040]">The ultimate CMS for your MuOnline private server</p>
          </div>
        </div>
        <p className="text-xs text-[#5a5040]">&copy; 2026 GxGA MuCMS. All rights reserved.</p>
      </div>
    </footer>
  );
}

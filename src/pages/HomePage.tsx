import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ShoppingCart, Store, Trophy, Users, Swords, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewsCard from '../components/NewsCard';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  image_url: string;
  created_at: string;
}

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setNews(data);
    };
    load();
  }, []);

  const featured = news.find((n) => n.category === 'featured');
  const rest = news.filter((n) => n.id !== featured?.id);

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/7862362/pexels-photo-7862362.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Hero"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-[#0a0a0f]/40 to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,40,0.08)_0%,transparent_70%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5c28]/10 border border-[#8b5c28]/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-[#c9a44a]">Server Online</span>
          </div>

          <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl font-bold text-[#d4af52] tracking-wider mb-4 leading-tight">
            PULSE<span className="text-[#8a7e6a]"> MuOnline</span>
          </h1>
          <p className="text-[#8a7e6a] max-w-xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            Experience the ultimate MuOnline private server with custom features, active community, and competitive gameplay.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/download" className="btn-gold px-8 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#b8862f]/10">
              <Download className="w-4 h-4" /> Download Client
            </Link>
            <Link to="/rankings" className="px-8 py-3 rounded-lg text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/25 hover:bg-[#8b5c28]/10 transition-colors flex items-center gap-2">
              <Trophy className="w-4 h-4" /> View Rankings
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 mb-12 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <ShoppingCart className="w-5 h-5" />, label: 'WebShop', desc: 'Buy items', path: '/shop', color: 'text-[#c9a44a]' },
            { icon: <Store className="w-5 h-5" />, label: 'Market', desc: 'Player trades', path: '/market', color: 'text-emerald-400' },
            { icon: <Trophy className="w-5 h-5" />, label: 'Rankings', desc: 'Top players', path: '/rankings', color: 'text-cyan-400' },
            { icon: <Users className="w-5 h-5" />, label: 'Community', desc: 'Join us', path: '/support', color: 'text-blue-400' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.path}
              className="card-dark p-4 hover:border-[#8b5c28]/40 transition-all group"
            >
              <div className={`${item.color} mb-2 group-hover:scale-110 transition-transform`}>{item.icon}</div>
              <h3 className="font-semibold text-[#d4c9b0] text-sm">{item.label}</h3>
              <p className="text-xs text-[#5a5040]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-cinzel text-xl font-bold text-[#d4af52] tracking-wide">Latest News</h2>
              <span className="text-xs text-[#5a5040]">{news.length} articles</span>
            </div>

            <div className="space-y-5">
              {featured && (
                <NewsCard {...featured} featured onClick={() => setSelectedNews(featured)} />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rest.map((item) => (
                  <NewsCard key={item.id} {...item} onClick={() => setSelectedNews(item)} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </section>

      <section className="border-t border-[#8b5c28]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="font-cinzel text-xl font-bold text-[#d4af52] text-center mb-8 tracking-wide">Server Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Swords className="w-6 h-6" />, title: 'PvP System', desc: 'Balanced competitive gameplay with custom PvP arenas and Castle Siege.' },
              { icon: <ShoppingCart className="w-6 h-6" />, title: 'WebShop', desc: 'Browse and purchase items directly to your warehouse from our integrated shop.' },
              { icon: <Store className="w-6 h-6" />, title: 'Player Market', desc: 'Trade items with other players through our secure marketplace system.' },
              { icon: <Trophy className="w-6 h-6" />, title: 'Rankings', desc: 'Compete for the top positions in our real-time character and guild rankings.' },
              { icon: <Users className="w-6 h-6" />, title: 'Active Community', desc: 'Join thousands of players in our thriving community and events.' },
              { icon: <Download className="w-6 h-6" />, title: 'Auto Updater', desc: 'Stay up to date with our auto-patching client system.' },
            ].map(feat => (
              <div key={feat.title} className="card-dark p-5 hover:border-[#8b5c28]/30 transition-all group">
                <div className="text-[#c9a44a] mb-3 group-hover:scale-110 transition-transform">{feat.icon}</div>
                <h3 className="font-semibold text-[#d4c9b0] mb-1">{feat.title}</h3>
                <p className="text-xs text-[#5a5040] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedNews(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto card-dark shadow-2xl shadow-black/60">
            <button onClick={() => setSelectedNews(null)} className="absolute top-4 right-4 z-10 text-[#5a5040] hover:text-[#d4c9b0] transition-colors">
              <X className="w-5 h-5" />
            </button>
            {selectedNews.image_url && (
              <img src={selectedNews.image_url} alt={selectedNews.title} className="w-full h-56 object-cover rounded-t-xl" />
            )}
            <div className="p-6">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded ${
                selectedNews.category === 'featured' ? 'bg-gradient-to-r from-[#b8862f] to-[#c9a44a] text-[#0a0a0f]' :
                selectedNews.category === 'event' ? 'bg-emerald-500/15 text-emerald-400' :
                selectedNews.category === 'patch_note' ? 'bg-red-500/15 text-red-400' :
                selectedNews.category === 'announcement' ? 'bg-[#b8862f]/20 text-[#d4af52]' :
                'bg-[#8b5c28]/30 text-[#c9a44a]'
              }`}>
                {selectedNews.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <h2 className="text-2xl font-cinzel font-bold text-[#d4af52] mt-3 mb-2">{selectedNews.title}</h2>
              <p className="text-xs text-[#5a5040] mb-4">
                {new Date(selectedNews.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="text-[#d4c9b0] leading-relaxed whitespace-pre-line text-sm">{selectedNews.content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

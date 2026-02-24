import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import NewsCard from '../components/NewsCard';

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
    <Layout title="News" subtitle="Stay updated with the latest news, updates, and events.">
      <div className="space-y-6">
        {featured && (
          <NewsCard
            {...featured}
            featured
            onClick={() => setSelectedNews(featured)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {rest.map((item) => (
            <NewsCard
              key={item.id}
              {...item}
              onClick={() => setSelectedNews(item)}
            />
          ))}
        </div>
      </div>

      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedNews(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto card-dark shadow-2xl shadow-black/60">
            {selectedNews.image_url && (
              <img
                src={selectedNews.image_url}
                alt={selectedNews.title}
                className="w-full h-56 object-cover rounded-t-xl"
              />
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
              <button
                onClick={() => setSelectedNews(null)}
                className="mt-6 px-5 py-2 text-sm font-medium text-[#d4c9b0] border border-[#8b5c28]/25 rounded-lg hover:bg-[#8b5c28]/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

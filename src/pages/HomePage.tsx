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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNews(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
            {selectedNews.image_url && (
              <img
                src={selectedNews.image_url}
                alt={selectedNews.title}
                className="w-full h-56 object-cover rounded-t-2xl"
              />
            )}
            <div className="p-6">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded ${
                selectedNews.category === 'featured' ? 'bg-blue-600 text-white' :
                selectedNews.category === 'event' ? 'bg-emerald-500 text-white' :
                selectedNews.category === 'patch_note' ? 'bg-red-500 text-white' :
                selectedNews.category === 'announcement' ? 'bg-amber-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {selectedNews.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <h2 className="text-2xl font-bold text-white mt-3 mb-2">{selectedNews.title}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {new Date(selectedNews.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedNews.content}</div>
              <button
                onClick={() => setSelectedNews(null)}
                className="mt-6 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
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

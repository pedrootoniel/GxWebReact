import { useEffect, useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';

interface Guide {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  beginner: 'Beginner',
  class: 'Class Guide',
  system: 'System',
  pvp: 'PvP',
  general: 'General',
};

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selected, setSelected] = useState<Guide | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('guides')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setGuides(data);
    };
    load();
  }, []);

  return (
    <Layout title="Guides" subtitle="Learn everything about MuOnline with our comprehensive guides.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {guides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => setSelected(guide)}
            className="group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={guide.image_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={guide.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">
                  {categoryLabels[guide.category] || guide.category}
                </span>
              </div>
              <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{guide.title}</h3>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{guide.content}</p>
              <span className="inline-flex items-center gap-1 text-sm text-blue-400 mt-3 group-hover:gap-2 transition-all">
                Read guide <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
            {selected.image_url && (
              <img
                src={selected.image_url}
                alt={selected.title}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
            )}
            <div className="p-6">
              <span className="inline-block text-xs font-medium text-blue-400 mb-2">
                {categoryLabels[selected.category] || selected.category}
              </span>
              <h2 className="text-2xl font-bold text-white mb-4">{selected.title}</h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line">{selected.content}</div>
              <button
                onClick={() => setSelected(null)}
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

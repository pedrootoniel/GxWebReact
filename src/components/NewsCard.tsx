import { ArrowRight } from 'lucide-react';

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: string;
  image_url: string;
  created_at: string;
  featured?: boolean;
  onClick?: () => void;
}

const categoryColors: Record<string, string> = {
  featured: 'bg-blue-600 text-white',
  news: 'bg-blue-500 text-white',
  event: 'bg-emerald-500 text-white',
  patch_note: 'bg-red-500 text-white',
  announcement: 'bg-amber-500 text-white',
};

const categoryLabels: Record<string, string> = {
  featured: 'Featured',
  news: 'News',
  event: 'Event',
  patch_note: 'Patch Note',
  announcement: 'Announcement',
};

export default function NewsCard({ title, excerpt, category, image_url, featured, onClick }: NewsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all cursor-pointer ${
        featured ? '' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? 'h-64 sm:h-80' : 'h-44'}`}>
        <img
          src={image_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
      </div>

      <div className="p-4">
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded ${categoryColors[category] || categoryColors.news}`}>
          {categoryLabels[category] || category}
        </span>
        <h3 className={`font-bold text-white mt-2.5 mb-1.5 group-hover:text-blue-400 transition-colors ${featured ? 'text-xl' : 'text-base'}`}>
          {title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2">{excerpt}</p>
        <span className="inline-flex items-center gap-1 text-sm text-blue-400 mt-3 group-hover:gap-2 transition-all">
          Read more <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

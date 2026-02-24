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
  featured: 'bg-gradient-to-r from-[#b8862f] to-[#c9a44a] text-[#0a0a0f]',
  news: 'bg-[#8b5c28]/30 text-[#c9a44a]',
  event: 'bg-emerald-500/15 text-emerald-400',
  patch_note: 'bg-red-500/15 text-red-400',
  announcement: 'bg-[#b8862f]/20 text-[#d4af52]',
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
      className="group card-dark overflow-hidden hover:border-[#8b5c28]/40 transition-all cursor-pointer"
    >
      <div className={`relative overflow-hidden ${featured ? 'h-64 sm:h-80' : 'h-44'}`}>
        <img
          src={image_url || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/90 via-[#0a0a0f]/30 to-transparent" />
      </div>

      <div className="p-4">
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded ${categoryColors[category] || categoryColors.news}`}>
          {categoryLabels[category] || category}
        </span>
        <h3 className={`font-semibold text-[#d4c9b0] mt-2.5 mb-1.5 group-hover:text-[#c9a44a] transition-colors ${featured ? 'text-xl' : 'text-base'}`}>
          {title}
        </h3>
        <p className="text-sm text-[#5a5040] line-clamp-2">{excerpt}</p>
        <span className="inline-flex items-center gap-1 text-sm text-[#c9a44a] mt-3 group-hover:gap-2 transition-all">
          Read more <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

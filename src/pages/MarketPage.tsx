import { useState, useEffect } from 'react';
import { Store, Search, Loader2, Coins, Clock, User, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { marketApi, type MarketItem } from '../services/api';

const CATEGORY_NAMES: Record<number, string> = {
  0: 'Swords', 1: 'Axes', 2: 'Maces', 3: 'Spears', 4: 'Bows',
  5: 'Staffs', 6: 'Shields', 7: 'Helms', 8: 'Armors', 9: 'Pants',
  10: 'Gloves', 11: 'Boots', 12: 'Wings', 13: 'Pets', 14: 'Jewelry', 15: 'Special',
};

export default function MarketPage() {
  const { user, muMode } = useAuth();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const perPage = 20;

  useEffect(() => {
    loadItems();
  }, [page, search, category]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await marketApi.getItems({ page, limit: perPage, search, category });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleBuy = async (item: MarketItem) => {
    if (!user) return;
    setBuying(true);
    setMessage({ text: '', type: '' });
    try {
      const result = await marketApi.buy(item.id);
      setMessage({ text: result.message, type: 'success' });
      loadItems();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Purchase failed', type: 'error' });
    } finally {
      setBuying(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  const getTimeLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  if (selectedItem) {
    return (
      <Layout title="Player Market" subtitle="Buy and sell items with other players" showSidebar={false}>
        <MarketItemDetail
          item={selectedItem}
          user={user}
          muMode={muMode}
          buying={buying}
          message={message}
          onBack={() => { setSelectedItem(null); setMessage({ text: '', type: '' }); }}
          onBuy={handleBuy}
          getTimeLeft={getTimeLeft}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Player Market" subtitle="Buy and sell items with other players" showSidebar={false}>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5040]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search items by name..."
            className="input-dark w-full pl-10"
          />
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            showFilters ? 'bg-[#8b5c28]/20 text-[#c9a44a]' : 'card-dark text-[#8a7e6a] hover:text-[#d4c9b0]'
          }`}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="card-dark p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#d4c9b0]">Filter by Category</span>
            {category && (
              <button onClick={() => { setCategory(''); setPage(1); }} className="text-xs text-[#c9a44a] hover:text-[#d4af52]">
                Clear filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
              <button
                key={key}
                onClick={() => { setCategory(key); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  category === key
                    ? 'bg-[#8b5c28]/30 text-[#c9a44a] border border-[#8b5c28]/30'
                    : 'bg-[#0a0a0f]/40 text-[#5a5040] hover:text-[#8a7e6a] border border-transparent'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-[#5a5040] mb-4">{total} items listed</div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#c9a44a] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-[#5a5040]">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No items listed on the market</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full card-dark p-4 text-left hover:border-[#8b5c28]/40 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-[#d4c9b0] group-hover:text-[#c9a44a] transition-colors text-sm truncate">
                        {item.item_name}
                      </h4>
                      {item.highlighted && (
                        <span className="shrink-0 text-xs bg-[#b8862f]/20 text-[#d4af52] px-1.5 py-0.5 rounded">Featured</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#5a5040]">
                      <span>{CATEGORY_NAMES[item.cat] || `Cat ${item.cat}`}</span>
                      <span>Lv. {item.lvl}</span>
                      {item.has_luck && <span className="text-[#c9a44a]">Luck</span>}
                      {item.has_skill && <span className="text-blue-400">Skill</span>}
                      {item.has_ancient && <span className="text-cyan-400">Ancient</span>}
                      {(item.has_exe_1 || item.has_exe_2 || item.has_exe_3) && (
                        <span className="text-emerald-400">Exc</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[#5a5040]">
                      <User className="w-3 h-3" /> {item.seller}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#5a5040]">
                      <Clock className="w-3 h-3" /> {getTimeLeft(item.active_till)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins className={`w-4 h-4 ${item.price_type === 2 ? 'text-emerald-400' : 'text-[#c9a44a]'}`} />
                      <span className={`font-bold text-sm ${item.price_type === 2 ? 'text-emerald-400' : 'text-[#d4af52]'}`}>
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 card-dark text-[#8a7e6a] hover:text-[#c9a44a] disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#8a7e6a] px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 card-dark text-[#8a7e6a] hover:text-[#c9a44a] disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

function MarketItemDetail({ item, user, muMode, buying, message, onBack, onBuy, getTimeLeft }: {
  item: MarketItem;
  user: unknown;
  muMode: boolean;
  buying: boolean;
  message: { text: string; type: string };
  onBack: () => void;
  onBuy: (item: MarketItem) => void;
  getTimeLeft: (d: string) => string;
}) {
  const exeOptions = [item.has_exe_1, item.has_exe_2, item.has_exe_3, item.has_exe_4, item.has_exe_5, item.has_exe_6];
  const exeCount = exeOptions.filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#8a7e6a] hover:text-[#c9a44a] mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to market
      </button>

      <div className="card-dark p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#d4af52]">{item.item_name}</h2>
            <p className="text-sm text-[#5a5040]">{CATEGORY_NAMES[item.cat] || `Category ${item.cat}`}</p>
          </div>
          {item.highlighted && (
            <span className="text-xs bg-[#b8862f]/20 text-[#d4af52] px-2 py-1 rounded">Featured</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Level</span>
            <p className="font-bold text-[#d4c9b0]">{item.lvl}</p>
          </div>
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Excellent Opts</span>
            <p className="font-bold text-emerald-400">{exeCount}</p>
          </div>
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Expires</span>
            <p className="font-bold text-[#d4c9b0]">{getTimeLeft(item.active_till)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {item.has_luck && <span className="text-xs bg-[#c9a44a]/15 text-[#c9a44a] px-2 py-1 rounded">Luck</span>}
          {item.has_skill && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded">Skill</span>}
          {item.has_ancient && <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2 py-1 rounded">Ancient</span>}
          {exeCount > 0 && <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded">Excellent x{exeCount}</span>}
        </div>

        <div className="divider-gold mb-6" />

        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-[#5a5040]">Seller</span>
          <span className="text-[#d4c9b0]">{item.seller}</span>
        </div>
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-[#5a5040]">Character</span>
          <span className="text-[#d4c9b0]">{item.char}</span>
        </div>
        <div className="flex items-center justify-between mb-6 text-sm">
          <span className="text-[#5a5040]">Listed</span>
          <span className="text-[#d4c9b0]">{new Date(item.add_date).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6 py-4 bg-[#0a0a0f]/40 rounded-lg">
          <Coins className={`w-6 h-6 ${item.price_type === 2 ? 'text-emerald-400' : 'text-[#c9a44a]'}`} />
          <span className={`text-3xl font-bold ${item.price_type === 2 ? 'text-emerald-400' : 'text-[#d4af52]'}`}>
            {item.price.toLocaleString()}
          </span>
          <span className="text-sm text-[#5a5040]">{item.price_type === 2 ? 'Gold Credits' : 'Credits'}</span>
        </div>

        {message.text && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {user && muMode ? (
          <button
            onClick={() => onBuy(item)}
            disabled={buying}
            className="w-full py-3 btn-gold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold"
          >
            {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
            Buy Now
          </button>
        ) : (
          <p className="text-center text-sm text-[#5a5040] py-3">Login to purchase items</p>
        )}
      </div>
    </div>
  );
}

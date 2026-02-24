import { useState, useEffect } from 'react';
import { ShoppingCart, Coins, Loader2, Search, Tag, Star, ChevronLeft } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { shopApi, type ShopItem } from '../services/api';

const ITEM_CATEGORIES: Record<number, string> = {
  0: 'Swords', 1: 'Axes', 2: 'Maces & Scepters', 3: 'Spears', 4: 'Bows & Crossbows',
  5: 'Staffs', 6: 'Shields', 7: 'Helms', 8: 'Armors', 9: 'Pants',
  10: 'Gloves', 11: 'Boots', 12: 'Wings', 13: 'Pets & Misc', 14: 'Pendants & Rings',
  15: 'Special',
};

export default function ShopPage() {
  const { user, profile, muMode } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [credits, setCredits] = useState({ credits: 0, credits2: 0 });
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadItems();
    if (user && muMode) loadCredits();
  }, [user, muMode]);

  const loadItems = async () => {
    try {
      const data = await shopApi.getItems();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCredits = async () => {
    try {
      const data = await shopApi.getCredits();
      setCredits(data);
    } catch { /* empty */ }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) return;
    setPurchasing(true);
    setMessage({ text: '', type: '' });
    try {
      const result = await shopApi.purchase(item.id);
      setMessage({ text: result.message, type: 'success' });
      loadCredits();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Purchase failed', type: 'error' });
    } finally {
      setPurchasing(false);
    }
  };

  const categories = [...new Set(items.map(i => i.item_cat))].sort((a, b) => a - b);
  const filtered = items.filter(i => {
    if (selectedCat !== null && i.item_cat !== selectedCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (selectedItem) {
    return (
      <Layout title="WebShop" subtitle="Purchase items with your credits" showSidebar={false}>
        <ItemDetail
          item={selectedItem}
          credits={credits}
          profile={profile}
          muMode={muMode}
          purchasing={purchasing}
          message={message}
          onBack={() => { setSelectedItem(null); setMessage({ text: '', type: '' }); }}
          onPurchase={handlePurchase}
        />
      </Layout>
    );
  }

  return (
    <Layout title="WebShop" subtitle="Purchase items with your credits" showSidebar={false}>
      {user && muMode && (
        <div className="flex items-center gap-6 mb-6 p-4 card-dark">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#c9a44a]" />
            <span className="text-sm text-[#8a7e6a]">Credits:</span>
            <span className="font-bold text-[#d4af52]">{credits.credits.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-[#8a7e6a]">Gold Credits:</span>
            <span className="font-bold text-emerald-400">{credits.credits2.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="card-dark p-4">
            <h3 className="font-cinzel text-sm font-bold text-[#d4af52] mb-3">Categories</h3>
            <button
              onClick={() => setSelectedCat(null)}
              className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedCat === null ? 'bg-[#8b5c28]/20 text-[#c9a44a]' : 'text-[#8a7e6a] hover:text-[#d4c9b0] hover:bg-[#1a1614]'
              }`}
            >
              All Items ({items.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  selectedCat === cat ? 'bg-[#8b5c28]/20 text-[#c9a44a]' : 'text-[#8a7e6a] hover:text-[#d4c9b0] hover:bg-[#1a1614]'
                }`}
              >
                {ITEM_CATEGORIES[cat] || `Category ${cat}`} ({items.filter(i => i.item_cat === cat).length})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5040]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="input-dark w-full pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#c9a44a] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#5a5040]">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="card-dark p-4 text-left hover:border-[#8b5c28]/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-[#d4c9b0] group-hover:text-[#c9a44a] transition-colors text-sm">
                      {item.name}
                    </h4>
                    {item.total_bought > 10 && (
                      <span className="shrink-0 flex items-center gap-1 text-xs text-[#c9a44a] bg-[#8b5c28]/15 px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3" /> Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5a5040] mb-3">
                    <Tag className="w-3 h-3" />
                    {ITEM_CATEGORIES[item.item_cat] || `Cat ${item.item_cat}`}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins className={`w-4 h-4 ${item.payment_type === 2 ? 'text-emerald-400' : 'text-[#c9a44a]'}`} />
                      <span className={`font-bold text-sm ${item.payment_type === 2 ? 'text-emerald-400' : 'text-[#d4af52]'}`}>
                        {item.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#5a5040]">
                        {item.payment_type === 2 ? 'Gold' : 'Credits'}
                      </span>
                    </div>
                    <span className="text-xs text-[#5a5040]">{item.total_bought} sold</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function ItemDetail({ item, credits, profile, muMode, purchasing, message, onBack, onPurchase }: {
  item: ShopItem;
  credits: { credits: number; credits2: number };
  profile: { username: string } | null;
  muMode: boolean;
  purchasing: boolean;
  message: { text: string; type: string };
  onBack: () => void;
  onPurchase: (item: ShopItem) => void;
}) {
  const canAfford = item.payment_type === 2
    ? credits.credits2 >= item.price
    : credits.credits >= item.price;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#8a7e6a] hover:text-[#c9a44a] mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to shop
      </button>

      <div className="card-dark p-6">
        <h2 className="font-cinzel text-xl font-bold text-[#d4af52] mb-1">{item.name}</h2>
        <p className="text-sm text-[#5a5040] mb-6">{ITEM_CATEGORIES[item.item_cat] || `Category ${item.item_cat}`}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Max Level</span>
            <p className="font-bold text-[#d4c9b0]">+{item.max_item_lvl}</p>
          </div>
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Max Option</span>
            <p className="font-bold text-[#d4c9b0]">+{item.max_item_opt * 4}</p>
          </div>
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Luck</span>
            <p className="font-bold text-[#d4c9b0]">{item.luck ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-[#0a0a0f]/60 rounded-lg p-3">
            <span className="text-xs text-[#5a5040]">Total Sold</span>
            <p className="font-bold text-[#d4c9b0]">{item.total_bought}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          {item.use_harmony && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded">Harmony</span>}
          {item.use_sockets && <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2 py-1 rounded">Sockets</span>}
          {item.use_refinary && <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-1 rounded">Refinery</span>}
        </div>

        <div className="divider-gold mb-6" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-[#8a7e6a]">Price</span>
            <div className="flex items-center gap-2 mt-1">
              <Coins className={`w-5 h-5 ${item.payment_type === 2 ? 'text-emerald-400' : 'text-[#c9a44a]'}`} />
              <span className={`text-2xl font-bold ${item.payment_type === 2 ? 'text-emerald-400' : 'text-[#d4af52]'}`}>
                {item.price.toLocaleString()}
              </span>
              <span className="text-sm text-[#5a5040]">{item.payment_type === 2 ? 'Gold Credits' : 'Credits'}</span>
            </div>
          </div>
          {muMode && profile && (
            <div className="text-right">
              <span className="text-sm text-[#8a7e6a]">Your Balance</span>
              <p className={`font-bold ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                {(item.payment_type === 2 ? credits.credits2 : credits.credits).toLocaleString()}
              </p>
            </div>
          )}
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

        {profile ? (
          <button
            onClick={() => onPurchase(item)}
            disabled={purchasing || !canAfford}
            className="w-full py-3 btn-gold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold"
          >
            {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {!canAfford ? 'Insufficient Funds' : 'Purchase Item'}
          </button>
        ) : (
          <p className="text-center text-sm text-[#5a5040] py-3">Login to purchase items</p>
        )}
      </div>
    </div>
  );
}

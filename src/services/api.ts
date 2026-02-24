const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('mu_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch { /* empty */ }
    throw new Error(msg);
  }

  return res.json();
}

export interface MuCharacter {
  name: string;
  class: string;
  classCode: number;
  level: number;
  resets: number;
  grandResets: number;
  isOnline: boolean;
  strength?: number;
  dexterity?: number;
  vitality?: number;
  energy?: number;
  leadership?: number;
  money?: number;
  levelUpPoint?: number;
  pkLevel?: number;
  pkCount?: number;
  mapNumber?: number;
  mapPosX?: number;
  mapPosY?: number;
  guildName?: string;
  guildStatus?: number;
  role?: string;
}

export interface MuGuild {
  name: string;
  score: number;
  master: string;
  masterLevel: number;
  masterResets: number;
  memberCount: number;
}

export interface MuGuildMember {
  name: string;
  role: string;
  class: string;
  level: number;
  resets: number;
  grandResets: number;
  isOnline: boolean;
}

export interface MuUser {
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  serverName: string;
  credits: number;
  credits2: number;
  credits3: number;
  vipType: number;
  vipTime: string | null;
  characters: MuCharacter[];
}

export interface ServerStats {
  totalAccounts: number;
  totalCharacters: number;
  totalGuilds: number;
  onlineCount: number;
}

export interface ShopItem {
  id: number;
  item_id: number;
  item_cat: number;
  name: string;
  original_item_cat: number;
  stick_level: number;
  price: number;
  payment_type: number;
  max_item_lvl: number;
  max_item_opt: number;
  use_sockets: boolean;
  use_harmony: boolean;
  use_refinary: boolean;
  exetype: number;
  luck: number;
  total_bought: number;
}

export interface MarketItem {
  id: number;
  cat: number;
  item: string;
  item_name: string;
  price_type: number;
  price: number;
  seller: string;
  add_date: string;
  active_till: string;
  highlighted: boolean;
  char: string;
  price_jewel: number;
  jewel_type: number;
  lvl: number;
  has_luck: boolean;
  has_skill: boolean;
  has_ancient: boolean;
  has_exe_1: boolean;
  has_exe_2: boolean;
  has_exe_3: boolean;
  has_exe_4: boolean;
  has_exe_5: boolean;
  has_exe_6: boolean;
  sold?: boolean;
  removed?: boolean;
}

export interface VipPackage {
  id: number;
  package_title: string;
  price: number;
  payment_type: number;
  vip_time: number;
  shop_discount: number;
  reset_price_decrease: number;
  reset_level_decrease: number;
  reset_bonus_points: number;
  wcoins: number;
  allow_extend: boolean;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string; email: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, email: string) =>
    request<{ token: string; user: { username: string; email: string; role: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    }),

  me: () => request<MuUser>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const rankingsApi = {
  getPlayers: (params: { page?: number; limit?: number; className?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.className && params.className !== 'All Classes') qs.set('className', params.className);
    if (params.search) qs.set('search', params.search);
    return request<{ characters: MuCharacter[]; total: number }>(`/api/rankings/players?${qs}`);
  },

  getGuilds: (params: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    return request<{ guilds: MuGuild[] }>(`/api/rankings/guilds?${qs}`);
  },

  getGuildMembers: (guildName: string) =>
    request<{ members: MuGuildMember[] }>(`/api/rankings/guilds/${encodeURIComponent(guildName)}/members`),

  getTop: (limit = 5) =>
    request<{ players: MuCharacter[] }>(`/api/rankings/top?limit=${limit}`),

  getCharacter: (name: string) =>
    request<MuCharacter>(`/api/rankings/character/${encodeURIComponent(name)}`),

  getCastleSiege: () =>
    request<{ owner: string }>('/api/rankings/castle-siege'),

  getOnline: () =>
    request<{ online: number }>('/api/rankings/online'),

  getStats: () =>
    request<ServerStats>('/api/rankings/stats'),
};

export const accountApi = {
  getCharacters: () =>
    request<{ characters: MuCharacter[] }>('/api/account/characters'),

  resetCharacter: (characterName: string) =>
    request<{ message: string; newResets: number }>('/api/account/reset', {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    }),

  grandResetCharacter: (characterName: string) =>
    request<{ message: string; newGrandResets: number }>('/api/account/grand-reset', {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    }),

  addStats: (characterName: string, str: number, agi: number, vit: number, ene: number, cmd?: number) =>
    request<{ message: string }>('/api/account/add-stats', {
      method: 'POST',
      body: JSON.stringify({ characterName, str, agi, vit, ene, cmd }),
    }),

  resetStats: (characterName: string) =>
    request<{ message: string }>('/api/account/reset-stats', {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    }),

  clearPk: (characterName: string) =>
    request<{ message: string }>('/api/account/clear-pk', {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    }),

  unstick: (characterName: string) =>
    request<{ message: string }>('/api/account/unstick', {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    }),
};

export const shopApi = {
  getItems: () =>
    request<{ items: ShopItem[] }>('/api/shop/items'),

  getItemDetail: (id: number) =>
    request<{ item: ShopItem; harmony: Array<{ id: number; hvalue: number; hname: string; price: number }>; sockets: Array<{ seed: number; socket_id: number; socket_name: string; socket_price: number }> }>(`/api/shop/items/${id}`),

  getCredits: () =>
    request<{ credits: number; credits2: number }>('/api/shop/credits'),

  purchase: (itemId: number, options?: Record<string, unknown>) =>
    request<{ message: string }>('/api/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId, options }),
    }),

  getHistory: () =>
    request<{ history: Array<{ memb___id: string; server: string; item_hex: string; date: string; price: number; price_type: string }> }>('/api/shop/history'),
};

export const marketApi = {
  getItems: (params: { page?: number; limit?: number; server?: string; category?: string; search?: string; minLevel?: number; hasLuck?: boolean; hasSkill?: boolean; hasExcellent?: boolean }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.server) qs.set('server', params.server);
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.minLevel) qs.set('minLevel', String(params.minLevel));
    if (params.hasLuck) qs.set('hasLuck', '1');
    if (params.hasSkill) qs.set('hasSkill', '1');
    if (params.hasExcellent) qs.set('hasExcellent', '1');
    return request<{ items: MarketItem[]; total: number; page: number; perPage: number }>(`/api/market/items?${qs}`);
  },

  getItemDetail: (id: number, server?: string) => {
    const qs = server ? `?server=${server}` : '';
    return request<{ item: MarketItem }>(`/api/market/items/${id}${qs}`);
  },

  buy: (itemId: number, server?: string) =>
    request<{ message: string }>('/api/market/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId, server }),
    }),

  removeItem: (id: number, server?: string) => {
    const qs = server ? `?server=${server}` : '';
    return request<{ message: string }>(`/api/market/items/${id}${qs}`, { method: 'DELETE' });
  },

  getMyListings: (server?: string) => {
    const qs = server ? `?server=${server}` : '';
    return request<{ items: MarketItem[] }>(`/api/market/my-listings${qs}`);
  },

  getHistory: (server?: string) => {
    const qs = server ? `?server=${server}` : '';
    return request<{ history: Array<{ seller: string; price: number; price_type: number; sold_date: string; item: string; cat: number; char: string; server: string }> }>(`/api/market/history${qs}`);
  },
};

export const vipApi = {
  getPackages: (server?: string) => {
    const qs = server ? `?server=${server}` : '';
    return request<{ packages: VipPackage[] }>(`/api/vip/packages${qs}`);
  },

  getMyVip: (server?: string) => {
    const qs = server ? `?server=${server}` : '';
    return request<{ vip: { viptype: number; viptime: string; package: VipPackage } | null }>(`/api/vip/my-vip${qs}`);
  },

  purchase: (packageId: number, server?: string) =>
    request<{ message: string; vipTime: string }>('/api/vip/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageId, server }),
    }),
};

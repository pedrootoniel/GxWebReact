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
  masterLevel: number;
  resets: number;
  grandResets: number;
  isOnline: boolean;
  strength?: number;
  dexterity?: number;
  vitality?: number;
  energy?: number;
  leadership?: number;
  money?: number;
  guildName?: string;
  guildStatus?: number;
}

export interface MuGuild {
  name: string;
  score: number;
  masterName: string;
  masterLevel: number;
  masterResets: number;
  memberCount: number;
}

export interface MuUser {
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  serverName: string;
  characters: MuCharacter[];
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
    request<{ members: MuCharacter[] }>(`/api/rankings/guilds/${encodeURIComponent(guildName)}/members`),

  getTop: (limit = 5) =>
    request<{ players: MuCharacter[] }>(`/api/rankings/top?limit=${limit}`),

  getCharacter: (name: string) =>
    request<MuCharacter>(`/api/rankings/character/${encodeURIComponent(name)}`),

  getCastleSiege: () =>
    request<{ owner: string }>('/api/rankings/castle-siege'),

  getOnline: () =>
    request<{ online: number }>('/api/rankings/online'),
};

export const accountApi = {
  getCharacters: () =>
    request<{ characters: MuCharacter[] }>('/api/account/characters'),

  resetCharacter: (characterName: string) =>
    request<{ message: string; newResets: number }>('/api/account/reset', {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    }),
};

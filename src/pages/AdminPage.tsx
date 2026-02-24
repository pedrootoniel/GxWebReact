import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, Download, BookOpen, ScrollText, Server, Calendar,
  Plus, Pencil, Trash2, Loader2, X, Save
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Section = 'dashboard' | 'news' | 'downloads' | 'guides' | 'rules' | 'servers' | 'events';

export default function AdminPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile?.is_admin) navigate('/');
  }, [user, profile, navigate]);

  const [section, setSection] = useState<Section>('dashboard');

  if (!user || !profile?.is_admin) return null;

  const menu: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'downloads', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
    { id: 'guides', label: 'Guides', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'rules', label: 'Rules', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'servers', label: 'Servers', icon: <Server className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <Layout title="Admin Panel" subtitle="Manage your server content" showSidebar={false}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="card-dark p-4 space-y-1">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  section === item.id ? 'bg-[#8b5c28]/20 text-[#c9a44a]' : 'text-[#8a7e6a] hover:text-[#d4c9b0] hover:bg-[#1a1614]'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {section === 'dashboard' && <DashboardSection />}
          {section === 'news' && <CrudSection table="news" columns={newsColumns} />}
          {section === 'downloads' && <CrudSection table="downloads" columns={downloadColumns} />}
          {section === 'guides' && <CrudSection table="guides" columns={guideColumns} />}
          {section === 'rules' && <CrudSection table="rules" columns={ruleColumns} />}
          {section === 'servers' && <CrudSection table="servers" columns={serverColumns} />}
          {section === 'events' && <CrudSection table="events" columns={eventColumns} />}
        </div>
      </div>
    </Layout>
  );
}

interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'datetime';
  options?: string[];
  required?: boolean;
  showInList?: boolean;
}

const newsColumns: ColumnDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true, showInList: true },
  { key: 'excerpt', label: 'Excerpt', type: 'text', showInList: true },
  { key: 'content', label: 'Content', type: 'textarea', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['news', 'event', 'patch_note', 'announcement'], showInList: true },
  { key: 'image_url', label: 'Image URL', type: 'text' },
];

const downloadColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, showInList: true },
  { key: 'version', label: 'Version', type: 'text', showInList: true },
  { key: 'category', label: 'Category', type: 'select', options: ['client', 'patch', 'tool'], showInList: true },
  { key: 'size', label: 'Size', type: 'text', showInList: true },
  { key: 'download_url', label: 'Download URL', type: 'text', required: true },
];

const guideColumns: ColumnDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true, showInList: true },
  { key: 'content', label: 'Content', type: 'textarea', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['general', 'classes', 'events', 'items', 'pvp'], showInList: true },
  { key: 'image_url', label: 'Image URL', type: 'text' },
];

const ruleColumns: ColumnDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true, showInList: true },
  { key: 'content', label: 'Content', type: 'textarea', required: true },
  { key: 'sort_order', label: 'Sort Order', type: 'number', showInList: true },
];

const serverColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, showInList: true },
  { key: 'type', label: 'Type', type: 'select', options: ['pvp', 'pve', 'non-pvp'], showInList: true },
  { key: 'is_online', label: 'Online', type: 'boolean', showInList: true },
  { key: 'players_online', label: 'Players', type: 'number', showInList: true },
  { key: 'max_players', label: 'Max Players', type: 'number' },
  { key: 'load_percent', label: 'Load %', type: 'number' },
];

const eventColumns: ColumnDef[] = [
  { key: 'name', label: 'Event Name', type: 'text', required: true, showInList: true },
  { key: 'next_run', label: 'Next Run', type: 'datetime', required: true, showInList: true },
];

function DashboardSection() {
  const [stats, setStats] = useState({ news: 0, downloads: 0, guides: 0, servers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [n, d, g, s] = await Promise.all([
        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('downloads').select('id', { count: 'exact', head: true }),
        supabase.from('guides').select('id', { count: 'exact', head: true }),
        supabase.from('servers').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        news: n.count || 0,
        downloads: d.count || 0,
        guides: g.count || 0,
        servers: s.count || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#c9a44a] animate-spin" /></div>;

  const items = [
    { label: 'News Articles', count: stats.news, icon: <Newspaper className="w-5 h-5 text-[#c9a44a]" /> },
    { label: 'Downloads', count: stats.downloads, icon: <Download className="w-5 h-5 text-emerald-400" /> },
    { label: 'Guides', count: stats.guides, icon: <BookOpen className="w-5 h-5 text-cyan-400" /> },
    { label: 'Servers', count: stats.servers, icon: <Server className="w-5 h-5 text-blue-400" /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <div key={item.label} className="card-dark p-4">
          <div className="flex items-center gap-3">
            {item.icon}
            <div>
              <p className="text-2xl font-bold text-[#d4c9b0]">{item.count}</p>
              <p className="text-xs text-[#5a5040]">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrudSection({ table, columns }: { table: string; columns: ColumnDef[] }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => { loadRows(); }, [table]);

  const loadRows = async () => {
    setLoading(true);
    const { data } = await supabase.from(table).select('*').order('id', { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  const startCreate = () => {
    const defaults: Record<string, unknown> = {};
    columns.forEach(col => {
      if (col.type === 'boolean') defaults[col.key] = false;
      else if (col.type === 'number') defaults[col.key] = 0;
      else if (col.type === 'select' && col.options) defaults[col.key] = col.options[0];
      else defaults[col.key] = '';
    });
    setForm(defaults);
    setCreating(true);
    setEditing(null);
  };

  const startEdit = (row: Record<string, unknown>) => {
    setForm({ ...row });
    setEditing(row);
    setCreating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    columns.forEach(col => { payload[col.key] = form[col.key]; });

    if (editing) {
      await supabase.from(table).update(payload).eq('id', editing.id);
    } else {
      await supabase.from(table).insert(payload);
    }

    setSaving(false);
    setEditing(null);
    setCreating(false);
    loadRows();
  };

  const handleDelete = async (id: string) => {
    await supabase.from(table).delete().eq('id', id);
    loadRows();
  };

  const listCols = columns.filter(c => c.showInList);

  if (creating || editing) {
    return (
      <div className="card-dark p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-cinzel text-lg font-bold text-[#d4af52]">
            {editing ? 'Edit' : 'Create'} {table.charAt(0).toUpperCase() + table.slice(1)}
          </h3>
          <button onClick={() => { setEditing(null); setCreating(false); }} className="text-[#5a5040] hover:text-[#d4c9b0]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {columns.map(col => (
            <div key={col.key}>
              <label className="block text-sm text-[#8a7e6a] mb-1">{col.label}</label>
              {col.type === 'textarea' ? (
                <textarea
                  value={String(form[col.key] || '')}
                  onChange={e => setForm(f => ({ ...f, [col.key]: e.target.value }))}
                  rows={8}
                  className="input-dark w-full resize-y"
                  required={col.required}
                />
              ) : col.type === 'select' ? (
                <select
                  value={String(form[col.key] || '')}
                  onChange={e => setForm(f => ({ ...f, [col.key]: e.target.value }))}
                  className="input-dark w-full"
                >
                  {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : col.type === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[col.key]}
                    onChange={e => setForm(f => ({ ...f, [col.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#8b5c28]/30 bg-[#0a0a0f] text-[#c9a44a] focus:ring-[#c9a44a]"
                  />
                  <span className="text-sm text-[#d4c9b0]">{col.label}</span>
                </label>
              ) : col.type === 'number' ? (
                <input
                  type="number"
                  value={Number(form[col.key] || 0)}
                  onChange={e => setForm(f => ({ ...f, [col.key]: parseInt(e.target.value) || 0 }))}
                  className="input-dark w-full"
                />
              ) : col.type === 'datetime' ? (
                <input
                  type="datetime-local"
                  value={form[col.key] ? String(form[col.key]).slice(0, 16) : ''}
                  onChange={e => setForm(f => ({ ...f, [col.key]: new Date(e.target.value).toISOString() }))}
                  className="input-dark w-full"
                />
              ) : (
                <input
                  type="text"
                  value={String(form[col.key] || '')}
                  onChange={e => setForm(f => ({ ...f, [col.key]: e.target.value }))}
                  className="input-dark w-full"
                  required={col.required}
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); }} className="px-6 py-2 rounded-lg text-sm text-[#8a7e6a] hover:text-[#d4c9b0] bg-[#1a1614] hover:bg-[#2a2520] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-lg font-bold text-[#d4af52] capitalize">{table}</h3>
        <button onClick={startCreate} className="btn-gold px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#c9a44a] animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-[#5a5040]">No {table} found. Click "Add New" to create one.</div>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <div key={String(row.id)} className="card-dark p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {listCols.map(col => (
                    <span key={col.key} className="text-sm">
                      {col.type === 'boolean' ? (
                        row[col.key] ? <span className="badge-online">{col.label}</span> : <span className="badge-offline">{col.label}</span>
                      ) : (
                        <span className={col === listCols[0] ? 'font-semibold text-[#d4c9b0]' : 'text-[#5a5040]'}>
                          {String(row[col.key] || '').slice(0, 60)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(row)} className="p-1.5 text-[#8a7e6a] hover:text-[#c9a44a] transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(String(row.id))} className="p-1.5 text-[#8a7e6a] hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

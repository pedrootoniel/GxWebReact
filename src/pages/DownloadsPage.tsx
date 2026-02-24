import { useEffect, useState } from 'react';
import { Download, Monitor, Cpu, HardDrive, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';

interface DownloadItem {
  id: string;
  name: string;
  version: string;
  category: string;
  size: string;
  download_url: string;
  uploaded_at: string;
}

const categoryColors: Record<string, string> = {
  client: 'bg-blue-500 text-white',
  patch: 'bg-amber-500 text-white',
  hotfix: 'bg-red-500 text-white',
  tool: 'bg-emerald-500 text-white',
};

const systemRequirements = {
  minimum: [
    { icon: Monitor, label: 'OS', value: 'Windows 7' },
    { icon: Cpu, label: 'CPU', value: 'Pentium 3 700 MHz' },
    { icon: HardDrive, label: 'RAM', value: '512 MB' },
    { icon: Layers, label: 'GPU', value: '3D Graphics processor, 32 MB' },
    { icon: Monitor, label: 'DirectX', value: '8.1a' },
  ],
  recommended: [
    { icon: Monitor, label: 'OS', value: 'Windows 7' },
    { icon: Cpu, label: 'CPU', value: 'Pentium 4 - 2.0 GHz or higher' },
    { icon: HardDrive, label: 'RAM', value: '1 GB or higher' },
    { icon: Layers, label: 'GPU', value: '3D Graphics processor, 128 MB or higher' },
    { icon: Monitor, label: 'DirectX', value: '9.0c or higher' },
  ],
};

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('downloads')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (data) setDownloads(data);
    };
    load();
  }, []);

  return (
    <Layout title="Downloads" subtitle="Download the latest MuOnline client, patches, and tools.">
      <div className="space-y-4">
        {downloads.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between hover:border-slate-600/50 transition-all"
          >
            <div>
              <h3 className="text-base font-bold text-white">{item.name}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${categoryColors[item.category] || 'bg-slate-600 text-white'}`}>
                  {item.category}
                </span>
                <span className="text-xs text-slate-400">
                  Size: {item.size} | Uploaded: {new Date(item.uploaded_at).toISOString().split('T')[0]}
                </span>
              </div>
            </div>
            <a
              href={item.download_url}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-white mb-5">System Requirements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(['minimum', 'recommended'] as const).map((tier) => (
            <div key={tier} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-center text-base font-bold text-white uppercase tracking-wider mb-5">
                {tier}
              </h3>
              <div className="space-y-4">
                {systemRequirements[tier].map((req, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-700/30 last:border-0 last:pb-0">
                    <req.icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-500 uppercase">{req.label}:</span>
                      <p className="text-sm text-slate-300">{req.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

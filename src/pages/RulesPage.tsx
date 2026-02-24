import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';

interface Rule {
  id: string;
  title: string;
  content: string;
  sort_order: number;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('rules')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) {
        setRules(data);
        if (data.length > 0) setExpandedId(data[0].id);
      }
    };
    load();
  }, []);

  return (
    <Layout title="Rules" subtitle="Please read and follow all server rules to maintain a fair gaming environment.">
      <div className="space-y-3">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Important Notice</p>
            <p className="text-xs text-slate-400 mt-1">
              Violating any of these rules may result in temporary or permanent account suspension. All decisions made by the staff are final.
            </p>
          </div>
        </div>

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/80 transition-colors"
            >
              <h3 className="text-base font-bold text-white">{rule.title}</h3>
              {expandedId === rule.id ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedId === rule.id && (
              <div className="px-5 pb-5 border-t border-slate-700/30">
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-4">
                  {rule.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}

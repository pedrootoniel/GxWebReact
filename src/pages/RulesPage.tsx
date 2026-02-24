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
        <div className="bg-[#b8862f]/8 border border-[#b8862f]/20 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-[#c9a44a] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#c9a44a]">Important Notice</p>
            <p className="text-xs text-[#8a7e6a] mt-1">
              Violating any of these rules may result in temporary or permanent account suspension. All decisions made by the staff are final.
            </p>
          </div>
        </div>

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="card-dark overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-[#8b5c28]/5 transition-colors"
            >
              <h3 className="text-base font-bold text-[#d4c9b0]">{rule.title}</h3>
              {expandedId === rule.id ? (
                <ChevronUp className="w-5 h-5 text-[#8b5c28]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#5a5040]" />
              )}
            </button>
            {expandedId === rule.id && (
              <div className="px-5 pb-5 border-t border-[#8b5c28]/10">
                <div className="text-sm text-[#8a7e6a] leading-relaxed whitespace-pre-line pt-4">
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

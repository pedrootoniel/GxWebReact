import { useState, useEffect } from 'react';
import { Send, MessageCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const statusIcons: Record<string, typeof Clock> = {
  open: Clock,
  in_progress: Loader2,
  resolved: CheckCircle2,
};

const statusColors: Record<string, string> = {
  open: 'text-[#c9a44a] bg-[#b8862f]/10',
  in_progress: 'text-[#d4af52] bg-[#b8862f]/15',
  resolved: 'text-emerald-400 bg-emerald-500/10',
};

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setTickets(data);
    };
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSending(true);
    setSuccess(false);

    const { error } = await supabase.from('support_tickets').insert({
      subject,
      message,
      user_id: user.id,
    });

    if (!error) {
      setSubject('');
      setMessage('');
      setSuccess(true);
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setTickets(data);
    }

    setSending(false);
  };

  return (
    <Layout title="Support" subtitle="Need help? Contact our support team or browse existing tickets.">
      <div className="space-y-6">
        {!user ? (
          <div className="card-dark p-8 text-center">
            <MessageCircle className="w-12 h-12 text-[#3d2e1a] mx-auto mb-3" />
            <h3 className="text-lg font-cinzel font-bold text-[#d4af52] mb-2">Login Required</h3>
            <p className="text-sm text-[#8a7e6a]">Please log in to create support tickets and view your existing ones.</p>
          </div>
        ) : (
          <>
            <div className="card-dark p-6">
              <h2 className="text-lg font-cinzel font-bold text-[#d4af52] mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#c9a44a]" />
                New Ticket
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                    className="input-dark w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8a7e6a] mb-1.5">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    required
                    rows={5}
                    className="input-dark w-full resize-none"
                  />
                </div>

                {success && (
                  <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    Ticket submitted successfully!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 btn-gold px-5 py-2.5 text-sm rounded-lg disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Ticket
                </button>
              </form>
            </div>

            {tickets.length > 0 && (
              <div className="card-dark p-6">
                <h2 className="text-lg font-cinzel font-bold text-[#d4af52] mb-4">Your Tickets</h2>
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const StatusIcon = statusIcons[ticket.status] || Clock;
                    return (
                      <div
                        key={ticket.id}
                        className="bg-[#0f0d0a]/50 border border-[#8b5c28]/10 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[#d4c9b0]">{ticket.subject}</h4>
                            <p className="text-xs text-[#5a5040] mt-1 line-clamp-2">{ticket.message}</p>
                            <p className="text-[10px] text-[#3d2e1a] mt-2">
                              {new Date(ticket.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[ticket.status] || statusColors.open}`}>
                            <StatusIcon className="w-3 h-3" />
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

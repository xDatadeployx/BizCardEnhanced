"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SubmissionsPage() {
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);
      const { data } = await supabase.from('cards').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      setCards(data || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('cards').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Approval failed: ' + error.message); return; }
    setCards(cards.filter((c) => c.id !== id));
    toast.success('Card approved and published!');
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('cards').update({ status: 'rejected' }).eq('id', id);
    if (error) { toast.error('Rejection failed: ' + error.message); return; }
    setCards(cards.filter((c) => c.id !== id));
    toast.success('Card rejected.');
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading submissions...</div>;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <a href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Directory</a>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Pending Submissions</h1>
          </div>
          <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full">{cards.length} pending</span>
        </div>
        {cards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
            No pending submissions. You are all caught up! 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-start gap-6">
                <img
                  src={card.profile_photo_url || `https://api.dicebear.com/7.x/personas/svg?seed=${card.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                  alt={card.name}
                  className="w-16 h-16 rounded-full object-cover bg-slate-100 ring-2 ring-white shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">{card.name}</h3>
                  <p className="text-sm text-slate-500 italic">{card.title}</p>
                  <p className="text-sm font-semibold text-slate-700">{card.business}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    {card.email && <span>✉ {card.email}</span>}
                    {card.phone && <span>📞 {card.phone}</span>}
                    {card.website && <span>🌐 {card.website}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(card.id)}
                    className="px-4 py-2 rounded-full text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleReject(card.id)}
                    className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
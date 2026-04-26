'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
// Optional: Using Lucide-react for small icons to keep the UI clean
import { Phone, Mail, Globe, Building2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function HomePage() {
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const fetchData = async () => {
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    if (catData) setCategories(catData);

    const { data: cardData } = await supabase
      .from('cards')
      .select(`*, categories(name, color_class)`)
      .order('full_name', { ascending: true });
    if (cardData) setCards(cardData);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredCards = activeCategory === 'All' 
    ? cards 
    : cards.filter(card => card.categories?.name === activeCategory);

  return (
    <main className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black mb-2 text-center text-gray-900 tracking-tight">Connect</h1>
        <p className="text-center text-gray-500 mb-10">Business Directory & Professional Contacts</p>
        
        {/* Category Filter Bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeCategory === 'All' 
              ? 'bg-black text-white shadow-xl' 
              : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat.name 
                ? `${cat.color_class} text-white shadow-xl` 
                : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode='popLayout'>
            {filteredCards.map((card) => (
              <motion.div
                layout
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -12, transition: { duration: 0.2, ease: "easeOut" } }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* Top Section / Header */}
                <div className="p-6 flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/personas/svg?seed=${card.full_name}`}
                      alt={card.full_name}
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{card.full_name}</h2>
                    <p className="text-blue-600 font-medium text-sm mt-1">{card.job_title}</p>
                    <div className="flex items-center gap-1 text-gray-400 mt-1">
                       <Building2 size={14} />
                       <span className="text-xs font-medium uppercase tracking-wide">{card.company_name}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Body */}
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 group hover:bg-white hover:ring-1 hover:ring-gray-200 transition-all">
                    <div className="bg-white p-2 rounded-lg shadow-sm group-hover:bg-blue-50">
                      <Phone size={14} className="text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{card.phone_number || 'No phone'}</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 group hover:bg-white hover:ring-1 hover:ring-gray-200 transition-all">
                    <div className="bg-white p-2 rounded-lg shadow-sm group-hover:bg-purple-50">
                      <Mail size={14} className="text-gray-600 group-hover:text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium truncate">{card.email}</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 group hover:bg-white hover:ring-1 hover:ring-gray-200 transition-all">
                    <div className="bg-white p-2 rounded-lg shadow-sm group-hover:bg-emerald-50">
                      <Globe size={14} className="text-gray-600 group-hover:text-emerald-600" />
                    </div>
                    <a href={`https://${card.website}`} target="_blank" className="text-sm text-gray-700 font-medium hover:underline">
                      {card.website || 'No website'}
                    </a>
                  </div>
                </div>

                {/* Bottom Badge */}
                <div className={`mt-auto w-full py-3 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white ${card.categories?.color_class}`}>
                  {card.categories?.name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  title: "",
  business: "",
  email: "",
  phone: "",
  website: "",
  category_id: "",
};

export default function Page() {
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState<any>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    const fetchData = async () => {
      const [cardsRes, catsRes] = await Promise.all([
        supabase.from("cards").select("*"),
        supabase.from("categories").select("*"),
      ]);
      if (!catsRes.error && catsRes.data && !cardsRes.error && cardsRes.data) {
        const catMap = Object.fromEntries(catsRes.data.map((cat) => [cat.id, cat]));
        const merged = cardsRes.data.map((card) => ({
          ...card,
          categories: catMap[card.category_id] ?? null,
        }));
        setCards(merged);
        setCategories(catsRes.data);
      }
      setLoading(false);
    };
    getUser();
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.profile_photo_url) {
      const path = deleteTarget.profile_photo_url.split("/profile-photos/")[1];
      if (path) await supabase.storage.from("profile-photos").remove([path]);
    }
    const { error } = await supabase.from("cards").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Delete failed: " + error.message, { duration: 6000 });
    } else {
      setCards(cards.filter((c) => c.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name}'s card has been deleted.`);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleEditClick = (card: any) => {
    setEditingId(card.id);
    setEditFormData({ ...card });
  };

  const handleSave = async (id: string) => {
    const { name, title, business, email, phone, website } = editFormData;
    const { error } = await supabase
      .from("cards")
      .update({ name, title, business, email, phone, website })
      .eq("id", id);
    if (error) {
      toast.error(`Update failed: ${error.message}`, { duration: 6000 });
    } else {
      setCards(cards.map((c) => (c.id === id ? { ...c, ...editFormData } : c)));
      setEditingId(null);
    }
  };

  const handleAdd = async () => {
    const cat = categories.find((c) => c.id === addFormData.category_id) ?? null;
    const { name, title, business, email, phone, website, category_id } = addFormData;
    if (!name.trim()) return toast.error("Name is required.");
    setAdding(true);
    const { data, error } = await supabase
      .from("cards")
      .insert([{ name, title, business, email, phone, website, category_id: category_id || null }])
      .select(`*, categories (name, color_hex)`)
      .single();
    if (error) {
      alert(`Add failed: ${error.message}`);
    } else {
      setCards([...cards, { ...data, categories: cat }]);
      setAddFormData(EMPTY_FORM);
      setShowAddForm(false);
    }
    setAdding(false);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const filteredCards =
    selectedCategory === "all" ? cards : cards.filter((c) => c.category_id === selectedCategory);

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">Loading Directory...</div>
    );

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Auth Bar */}
        <nav className="flex justify-end mb-8">
          {user ? (
            <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full shadow-sm border border-slate-200">
              <Link
                href="/admin/submissions"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
              >
                Admin
              </Link>
              <span className="text-sm font-medium text-slate-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white text-slate-700 px-6 py-2 rounded-full font-semibold shadow-sm border border-slate-300 hover:bg-slate-50 transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
              Sign in with Google
            </button>
          )}
        </nav>

        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Professional Directory
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Connecting experts across {cards?.length || 0} unique businesses.
          </p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-sm hover:bg-green-700 transition-all"
            >
              Submit a Card
            </Link>
            {user && (
              <Link
                href="/admin/submissions"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-sm hover:bg-purple-700 transition-all"
              >
                Admin Dashboard
              </Link>
            )}
            {user && (
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setAddFormData(EMPTY_FORM);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-sm hover:bg-blue-700 transition-all"
              >
                <span className="text-xl leading-none">{showAddForm ? "✕" : "+"}</span>
                {showAddForm ? "Cancel" : "Add Business Card"}
              </button>
            )}
          </div>
        </header>

        {/* Add Card Form */}
        {user && showAddForm && (
          <div className="mb-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-6">New Business Card</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addFormData.title}
                  onChange={(e) => setAddFormData({ ...addFormData, title: e.target.value })}
                  placeholder="Job Title"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Business
                </label>
                <input
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addFormData.business}
                  onChange={(e) => setAddFormData({ ...addFormData, business: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={addFormData.category_id}
                  onChange={(e) => setAddFormData({ ...addFormData, category_id: e.target.value })}
                >
                  <option value="">— Select a category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {addFormData.category_id &&
                  (() => {
                    const cat = categories.find((c) => c.id === addFormData.category_id);
                    return cat ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color_hex }}
                        />
                        <span className="text-xs text-slate-400">{cat.name}</span>
                      </div>
                    ) : null;
                  })()}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addFormData.phone}
                  onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                  placeholder="555-0100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Website
                </label>
                <input
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addFormData.website}
                  onChange={(e) => setAddFormData({ ...addFormData, website: e.target.value })}
                  placeholder="example.com"
                />
              </div>
            </div>
            {addFormData.name.trim() && (
              <div className="mt-5 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <img
                  src={`https://api.dicebear.com/7.x/personas/svg?seed=${addFormData.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                  alt="Avatar preview"
                  className="w-10 h-10 rounded-full bg-slate-200"
                />
                <p className="text-xs text-slate-500">Avatar auto-generated from name</p>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
              >
                {adding ? "Saving..." : "Save Card"}
              </button>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === "all"
                ? "border-2 border-slate-800 bg-white text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? "border-2 border-slate-800 bg-white text-slate-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color_hex }}
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card) => {
            const isEditing = editingId === card.id;
            const avatarUrl =
              card.profile_photo_url ||
              `https://api.dicebear.com/7.x/personas/svg?seed=${card.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

            return (
              <div
                key={card.id}
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: card.categories?.color_hex ?? "#94a3b8" }}
                />
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm">
                      <img src={avatarUrl} alt={card.name} className="h-full w-full object-cover" />
                    </div>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                      style={{ backgroundColor: card.categories?.color_hex ?? "#94a3b8" }}
                    >
                      {card.categories?.name ?? "Uncategorized"}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mb-4">
                      <input
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editFormData.name ?? ""}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        placeholder="Name"
                      />
                      <input
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editFormData.title ?? ""}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="Title"
                      />
                      <input
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editFormData.business ?? ""}
                        onChange={(e) => setEditFormData({ ...editFormData, business: e.target.value })}
                        placeholder="Business"
                      />
                      <input
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editFormData.email ?? ""}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="Email"
                      />
                      <input
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editFormData.phone ?? ""}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        placeholder="Phone"
                      />
                      <input
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editFormData.website ?? ""}
                        onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                        placeholder="Website"
                      />
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSave(card.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold uppercase hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold uppercase hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">{card.name}</h3>
                      <p className="text-sm font-medium text-slate-500 italic">{card.title}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700 uppercase tracking-tight">
                        {card.business}
                      </p>
                      {user && (
                        <button
                          onClick={() => handleEditClick(card)}
                          className="mt-3 text-[10px] bg-slate-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold uppercase hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          Edit Card
                        </button>
                      )}
                      {user && (
                        <button
                          onClick={() => setDeleteTarget(card)}
                          className="mt-2 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 font-bold uppercase hover:bg-red-600 hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-auto space-y-2 pt-4 border-t border-slate-50">
                    <p className="flex items-center text-xs text-slate-600 truncate">
                      <span className="mr-2 text-slate-400">✉</span> {card.email}
                    </p>
                    <p className="flex items-center text-xs text-slate-600">
                      <span className="mr-2 text-slate-400">📞</span> {card.phone}
                    </p>
                    
  href={`https://${card.website}`}
  target="_blank"
  rel="noreferrer"
  className="flex items-center text-xs text-blue-500 font-medium"
>
  <span className="mr-2 opacity-70">🌐</span> {card.website}
</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Business Card</h3>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>'s card? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

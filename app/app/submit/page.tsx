"use client";
import { useState } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export default function SubmitPage() {
  const [form, setForm] = useState({
    name: "", title: "", business: "", email: "", phone: "", website: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PNG and JPG files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Photo must be under 2MB.");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (photo) formData.append("photo", photo);
      const res = await fetch("/api/submit-card", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitted(true);
      toast.success("Your card has been submitted for review!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Submitted for Review</h2>
          <p className="text-slate-500">Thank you! Your business card has been submitted. The admin will review it shortly and you will appear in the directory once approved.</p>
          <a href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">← Back to Directory</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to Directory</a>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3">Submit Your Business Card</h1>
          <p className="text-slate-500 mt-2">Fill in your details below. Your card will be reviewed before appearing in the directory.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Name", key: "name", required: true, placeholder: "Full Name" },
              { label: "Title", key: "title", placeholder: "Job Title" },
              { label: "Company", key: "business", placeholder: "Company Name" },
              { label: "Email", key: "email", placeholder: "email@example.com", type: "email" },
              { label: "Phone", key: "phone", placeholder: "555-0100" },
              { label: "Website", key: "website", placeholder: "example.com" },
            ].map(({ label, key, required, placeholder, type }) => (
              <div key={key} className={key === "website" ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={type || "text"}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Profile Photo <span className="font-normal text-slate-400">(optional, PNG/JPG, max 2MB)</span></label>
              {preview && (
                <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-slate-200" />
              )}
              <input type="file" accept="image/png,image/jpeg" onChange={handlePhotoChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSubmit} disabled={submitting}
              className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useMemo, useRef, useState } from 'react';
import { EventRow, RegistrationRow } from '@/lib/data';
import { RichTextEditor } from './rich-text-editor';

interface AdminDashboardProps {
  initialEvents: EventRow[];
  initialRegistrations: RegistrationRow[];
}

export function AdminDashboard({ initialEvents, initialRegistrations }: AdminDashboardProps) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [registrations] = useState<RegistrationRow[]>(initialRegistrations);
  const [selected, setSelected] = useState<EventRow | null>(initialEvents[0] ?? null);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hoscademy-theme');
      return saved === 'light' || saved === 'dark' ? saved : 'light';
    }
    return 'light';
  });

  const isDark = theme === 'dark';

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return events;
    return events.filter((event) => event.title.toLowerCase().includes(keyword) || event.slug.toLowerCase().includes(keyword));
  }, [events, query]);

  const selectedRegistrations = useMemo(() => {
    if (!selected?.slug) return registrations;
    return registrations.filter((row) => row.event_slug === selected.slug);
  }, [registrations, selected]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('hoscademy-theme', nextTheme);
  };

  async function refreshEvents(savedSlug?: string) {
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) return;
      const data = (await res.json()) as EventRow[];
      setEvents(data);
      if (!savedSlug) return;
      const nextSelected = data.find((item) => item.slug === savedSlug) || null;
      setSelected(nextSelected);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(eventSlug: string) {
    if (!confirm(`Hapus event /${eventSlug}?`)) return;

    try {
      const res = await fetch(`/api/admin/events/${eventSlug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus event');
      setEvents((prev) => prev.filter((item) => item.slug !== eventSlug));
      if (selected?.slug === eventSlug) {
        const remaining = events.filter((item) => item.slug !== eventSlug);
        setSelected(remaining[0] ?? null);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus');
    }
  }

  const shellClass = isDark ? 'bg-[#0f172a] text-slate-100 border-slate-700' : 'bg-[#f8f8f5] text-[#161616] border-[#202020]';
  const panelClass = isDark ? 'border-slate-700 bg-[#111827]' : 'border-[#202020] bg-[#f8f8f5]';
  const inputClass = isDark ? 'border-slate-700 bg-[#0f172a] text-slate-100 placeholder:text-slate-500' : 'border-[#202020] bg-white text-[#161616] placeholder:text-slate-400';

  return (
    <div className={`min-h-screen transition-colors ${shellClass}`}>
      <div className="mx-auto max-w-7xl p-6 font-mono">
        <div className={`border ${panelClass}`}>
          <div className="grid min-h-[calc(100vh-3rem)] grid-cols-[220px_minmax(0,1fr)]">
            <aside className={`border-r p-5 border-b-0 ${isDark ? 'border-slate-700' : 'border-[#202020]'}`}>
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg leading-none">DAFTAR</div>
                  <div className="mt-2 text-lg leading-none">EVENT</div>
                </div>
                <button onClick={toggleTheme} className={`rounded-none border px-2 py-1 text-[11px] ${inputClass}`}>
                  {isDark ? 'Light' : 'Dark'}
                </button>
              </div>

              <button onClick={() => setSelected(null)} className={`mb-3 block w-full border px-3 py-2 text-left text-sm ${inputClass}`}>
                + Buat Event
              </button>

              <div className={`mb-4 border px-3 py-2 text-sm ${inputClass}`}>
                <span className="mr-2">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari..."
                  className={`w-[calc(100%-1.5rem)] bg-transparent outline-none ${isDark ? 'text-slate-100' : 'text-[#161616]'}`}
                />
              </div>

              <div className={`mb-4 border-t ${isDark ? 'border-slate-700' : 'border-[#202020]'}`} />

              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                {filteredEvents.map((event) => (
                  <div
                    key={event.slug}
                    className={`border px-3 py-2 text-sm ${selected?.slug === event.slug ? (isDark ? 'border-slate-100 bg-slate-800' : 'border-[#202020] bg-white') : inputClass}`}
                  >
                    <button onClick={() => setSelected(event)} className="block w-full text-left">
                      <div>● {event.title}</div>
                    </button>
                    <div className="mt-1 text-[11px] opacity-70">/{event.slug}</div>
                    <button onClick={() => handleDelete(event.slug)} className="mt-2 text-[11px] underline opacity-70 hover:opacity-100">
                      hapus
                    </button>
                  </div>
                ))}
                {!filteredEvents.length ? <p className="text-sm opacity-60">Belum ada event.</p> : null}
              </div>
            </aside>

            <section className="min-w-0 p-4 sm:p-6">
              <div className={`border p-5 ${panelClass}`}>
                <div className={`mb-5 border-b pb-5 ${isDark ? 'border-slate-700' : 'border-[#202020]'}`}>
                  <div className="text-2xl leading-tight">{selected?.title || 'Event Baru'}</div>
                  <div className="mt-2 text-sm">Status : ● {selected ? 'Published' : 'Draft'}</div>
                </div>

                <EventForm
                  key={selected?.slug || 'new'}
                  event={selected}
                  isDark={isDark}
                  inputClass={inputClass}
                  dividerClass={isDark ? 'border-slate-700' : 'border-[#202020]'}
                  onSaved={refreshEvents}
                />
              </div>

              <div className={`mt-6 border p-5 ${panelClass}`}>
                <div className="mb-4 text-xl">LEAD TERKAIT</div>
                <div className={`mb-4 border-b ${isDark ? 'border-slate-700' : 'border-[#202020]'}`} />
                <div className="max-h-[260px] overflow-auto scrollbar-thin">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="pb-3">Nama Pribadi</th>
                        <th className="pb-3">Nama Brand</th>
                        <th className="pb-3">Sosmed</th>
                        <th className="pb-3">Masalah yang Ingin di Solve</th>
                        <th className="pb-3 text-right">Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRegistrations.map((row) => (
                        <tr key={row.id} className={`border-t ${isDark ? 'border-slate-700' : 'border-[#202020]'}`}>
                          <td className="py-3 pr-4">{row.name}</td>
                          <td className="py-3 pr-4">{row.brand_name || '-'}</td>
                          <td className="py-3 pr-4">{row.social_media || '-'}</td>
                          <td className="py-3 pr-4">{row.problem || '-'}</td>
                          <td className="py-3 text-right text-[12px] opacity-70">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      {!selectedRegistrations.length ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center opacity-60">Belum ada lead.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventForm({ event, isDark, inputClass, dividerClass, onSaved }: { event: EventRow | null; isDark: boolean; inputClass: string; dividerClass: string; onSaved: (savedSlug?: string) => void; }) {
  const [slug, setSlug] = useState(event?.slug || '');
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [posterUrl, setPosterUrl] = useState(event?.poster_url || '');
  const [bgImageUrl, setBgImageUrl] = useState(event?.bg_image_url || '');
  const [bgColor, setBgColor] = useState(event?.bg_color || '#020617');
  const [buttonText, setButtonText] = useState(event?.button_text || 'Saya Mau');
  const [whatsappLink, setWhatsappLink] = useState(event?.whatsapp_link || '');
  const [pixelId, setPixelId] = useState(event?.pixel_id || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputPoster = useRef<HTMLInputElement>(null);
  const fileInputBg = useRef<HTMLInputElement>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  async function handleUpload(file: File, type: 'poster' | 'bg') {
    const setUploading = type === 'poster' ? setUploadingPoster : setUploadingBg;
    const setUrl = type === 'poster' ? setPosterUrl : setBgImageUrl;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', type === 'poster' ? 'posters' : 'backgrounds');

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal upload media');
      }
      const data = await res.json();
      setUrl(data.url);
      setMessage({ text: 'File berhasil di-upload!', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Upload gagal', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('poster_url', posterUrl);
    formData.append('bg_image_url', bgImageUrl);
    formData.append('bg_color', bgColor);
    formData.append('button_text', buttonText);
    formData.append('whatsapp_link', whatsappLink);
    formData.append('pixel_id', pixelId);

    try {
      const res = await fetch('/api/admin/events', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal menyimpan event');
      onSaved(slug);
      setMessage({ text: 'Event berhasil disimpan!', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Terjadi kesalahan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 text-sm">
      {message ? <div className={message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}>{message.text}</div> : null}

      <FormSection title="INFORMASI EVENT" dividerClass={dividerClass}>
        <FormRow label="Slug URL"><input value={slug} onChange={(e) => setSlug(e.target.value)} required className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} /></FormRow>
        <FormRow label="Judul Event"><input value={title} onChange={(e) => setTitle(e.target.value)} required className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} /></FormRow>
        <FormRow label="Deskripsi"><RichTextEditor value={description} onChange={setDescription} isDark={isDark} /></FormRow>
      </FormSection>

      <FormSection title="TAMPILAN LANDING PAGE" dividerClass={dividerClass}>
        <FormRow label="Poster URL">
          <div className="flex gap-2">
            <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} />
            <input type="file" ref={fileInputPoster} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'poster')} className="hidden" accept="image/*" />
            <button type="button" disabled={uploadingPoster} onClick={() => fileInputPoster.current?.click()} className={`border px-3 py-2 whitespace-nowrap ${isDark ? 'border-slate-700 bg-slate-800' : 'border-[#202020] bg-slate-100'}`}>{uploadingPoster ? '...' : 'Upload'}</button>
          </div>
        </FormRow>
        <FormRow label="Background URL">
          <div className="flex gap-2">
            <input value={bgImageUrl} onChange={(e) => setBgImageUrl(e.target.value)} className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} />
            <input type="file" ref={fileInputBg} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'bg')} className="hidden" accept="image/*" />
            <button type="button" disabled={uploadingBg} onClick={() => fileInputBg.current?.click()} className={`border px-3 py-2 whitespace-nowrap ${isDark ? 'border-slate-700 bg-slate-800' : 'border-[#202020] bg-slate-100'}`}>{uploadingBg ? '...' : 'Upload'}</button>
          </div>
        </FormRow>
        <FormRow label="Background Color"><input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} /></FormRow>
      </FormSection>

      <FormSection title="CTA & WHATSAPP" dividerClass={dividerClass}>
        <FormRow label="Button Text"><input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} /></FormRow>
        <FormRow label="WhatsApp Link"><input value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} required className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} /></FormRow>
      </FormSection>

      <FormSection title="TRACKING" dividerClass={dividerClass}>
        <FormRow label="Meta Pixel ID"><input value={pixelId} onChange={(e) => setPixelId(e.target.value)} className={`w-full min-w-0 border px-3 py-2 ${inputClass}`} /></FormRow>
      </FormSection>

      <div className={`flex items-center justify-end gap-3 border-t pt-5 ${dividerClass}`}>
        {event?.slug ? <a href={`/${event.slug}`} target="_blank" rel="noreferrer" className={`border px-4 py-2 ${inputClass}`}>Preview</a> : null}
        <button type="submit" disabled={loading} className={`border px-4 py-2 ${isDark ? 'border-slate-100 bg-slate-100 text-slate-950' : 'border-[#202020] bg-[#202020] text-white'}`}>{loading ? 'Menyimpan...' : 'Simpan Event'}</button>
      </div>
    </form>
  );
}

function FormSection({ title, dividerClass, children }: { title: string; dividerClass: string; children: React.ReactNode; }) {
  return (<section><div className={`mb-5 border-t pt-5 ${dividerClass}`}><div className="text-xl">{title}</div></div><div className="space-y-4">{children}</div></section>);
}

function FormRow({ label, children }: { label: string; children: React.ReactNode; }) {
  return (<div className="grid gap-3 md:grid-cols-[220px,minmax(0,1fr)] md:items-start"><label className="pt-2 text-sm md:whitespace-nowrap">{label}</label><div>{children}</div></div>);
}

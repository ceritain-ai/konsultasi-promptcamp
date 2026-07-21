'use client';

import { useState } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function LandingForm({
  slug,
  buttonText,
  whatsappLink,
}: {
  slug: string;
  buttonText: string;
  whatsappLink: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const payload = {
      slug,
      name: String(formData.get('name') || '').trim(),
      brandName: String(formData.get('brandName') || '').trim(),
      socialMedia: String(formData.get('socialMedia') || '').trim(),
      problem: String(formData.get('problem') || '').trim(),
    };

    if (!payload.name || !payload.brandName || !payload.socialMedia || !payload.problem) {
      setError('Lengkapi semua field.');
      setLoading(false);
      return;
    }

    try {
      window.fbq?.('trackCustom', 'WhatsAppClick', { slug });
      window.fbq?.('track', 'Lead', { content_name: slug });
      window.fbq?.('track', 'CompleteRegistration', { content_name: slug });

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal simpan data.');

      window.location.href = data.redirectUrl || whatsappLink;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi error.');
      setLoading(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4 px-4 pb-10 pt-2 text-left"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-white">Nama Pribadi</label>
        <input
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-white">Nama Brand</label>
        <input
          name="brandName"
          type="text"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-white">Sosmed yang Dipakai</label>
        <input
          name="socialMedia"
          type="text"
          required
          placeholder="Contoh: Instagram @brandkamu"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-white">Masalah yang Ingin di Solve</label>
        <textarea
          name="problem"
          required
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500"
        />
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      
      <div className="pt-2 flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[#ff6a2b] px-8 py-3 text-base font-bold uppercase tracking-wider text-white shadow transition hover:bg-[#e0561f] active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Memproses...' : buttonText}
        </button>
      </div>
    </form>
  );
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-300">Hoscademy</p>
        <h1 className="mb-4 text-4xl font-bold">Sub-domain event builder</h1>
        <p className="mb-8 text-slate-300">Kelola landing page event di dashboard admin. Pattern URL: <span className="font-mono">/disc</span>, <span className="font-mono">/pelatihan</span>.</p>
        <Link href="/admin" className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950">Buka dashboard</Link>
      </div>
    </main>
  );
}

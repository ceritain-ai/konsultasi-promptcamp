export default async function AdminLoginPage({
  searchParams,
}: PageProps<'/admin/login'>) {
  const query = await searchParams;
  const hasError = query.error === '1';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Admin login</h1>
          <p className="text-sm text-slate-300">Kelola event, pixel, dan lead webinar.</p>
        </div>
        <form action="/api/admin/login" method="post" className="space-y-4">
          <div>
            <label className="mb-2 block text-sm">Email</label>
            <input name="email" type="email" required className="w-full rounded-2xl bg-white px-4 py-3 text-slate-900 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm">Password</label>
            <input name="password" type="password" required className="w-full rounded-2xl bg-white px-4 py-3 text-slate-900 outline-none" />
          </div>
          {hasError ? <p className="text-sm text-rose-300">Email atau password salah.</p> : null}
          <button className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950">Masuk</button>
        </form>
      </div>
    </main>
  );
}

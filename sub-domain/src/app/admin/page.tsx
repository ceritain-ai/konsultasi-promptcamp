import { getEvents, getRegistrations } from '@/lib/data';
import { requireAdmin } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin-dashboard';

export default async function AdminPage() {
  await requireAdmin();
  const events = await getEvents();
  const registrations = await getRegistrations();

  return (
    <AdminDashboard
      initialEvents={events}
      initialRegistrations={registrations}
    />
  );
}

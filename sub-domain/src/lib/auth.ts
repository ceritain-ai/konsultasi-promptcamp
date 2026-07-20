import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'hoscademy_admin';

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'admin@hoscademy.local';
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'changeme123';
}

export function isValidAdmin(email: string, password: string) {
  return email === getAdminEmail() && password === getAdminPassword();
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function requireAdmin() {
  const store = await cookies();
  if (store.get(COOKIE_NAME)?.value !== '1') {
    redirect('/admin/login');
  }
}

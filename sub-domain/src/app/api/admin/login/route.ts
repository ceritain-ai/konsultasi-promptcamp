import { NextResponse } from 'next/server';
import { isValidAdmin, setAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!isValidAdmin(email, password)) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url));
  }

  await setAdminSession();
  return NextResponse.redirect(new URL('/admin', request.url));
}

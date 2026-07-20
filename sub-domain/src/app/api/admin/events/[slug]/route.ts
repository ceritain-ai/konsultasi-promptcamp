import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  _request: Request,
  { params }: RouteContext<'/api/admin/events/[slug]'>,
) {
  const { slug } = await params;
  const { error } = await supabaseAdmin.from('events').delete().eq('slug', slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

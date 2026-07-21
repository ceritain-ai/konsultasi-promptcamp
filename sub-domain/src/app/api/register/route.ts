import { NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = String(body.slug || '').trim();
    const name = String(body.name || '').trim();
    const brandName = String(body.brandName || '').trim();
    const socialMedia = String(body.socialMedia || '').trim();
    const problem = String(body.problem || '').trim();

    if (!slug || !name || !brandName || !socialMedia || !problem) {
      return NextResponse.json({ error: 'Data wajib belum lengkap.' }, { status: 400 });
    }

    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('registrations').insert({
      event_slug: slug,
      name,
      brand_name: brandName,
      social_media: socialMedia,
      problem,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, redirectUrl: event.whatsapp_link });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal simpan lead.' }, { status: 500 });
  }
}

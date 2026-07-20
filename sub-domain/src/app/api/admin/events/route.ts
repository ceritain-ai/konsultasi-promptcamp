import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const events = await getEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = {
      slug: String(formData.get('slug') || '').trim(),
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      poster_url: String(formData.get('poster_url') || '').trim() || null,
      bg_color: String(formData.get('bg_color') || '').trim() || '#0f172a',
      bg_image_url: String(formData.get('bg_image_url') || '').trim() || null,
      button_text: String(formData.get('button_text') || '').trim() || 'SAYA MAU',
      whatsapp_link: String(formData.get('whatsapp_link') || '').trim(),
      pixel_id: String(formData.get('pixel_id') || '').trim() || null,
    };

    if (!payload.slug || !payload.title || !payload.whatsapp_link) {
      return NextResponse.json({ ok: false, error: 'Slug, title, dan WhatsApp link wajib.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('events').upsert(payload, { onConflict: 'slug' });
    if (error) throw error;

    return NextResponse.json({ ok: true, slug: payload.slug, message: 'Event saved' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal menyimpan event' },
      { status: 500 },
    );
  }
}

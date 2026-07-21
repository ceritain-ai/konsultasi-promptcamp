import { supabase, supabaseAdmin } from '@/lib/supabase';

function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === 'PGRST205' || error?.message?.includes('schema cache') || error?.message?.includes('Could not find the table');
}

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  bg_color: string | null;
  bg_image_url: string | null;
  button_text: string | null;
  whatsapp_link: string;
  pixel_id: string | null;
  created_at: string;
};

export type RegistrationRow = {
  id: string;
  event_slug: string;
  name: string;
  brand_name: string | null;
  social_media: string | null;
  problem: string | null;
  created_at: string;
};

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<EventRow>();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data;
}

export async function getEvents() {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data || []) as EventRow[];
}

export async function getRegistrations() {
  const { data, error } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data || []) as RegistrationRow[];
}

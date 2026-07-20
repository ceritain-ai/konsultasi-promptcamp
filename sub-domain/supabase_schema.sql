-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    poster_url TEXT,
    bg_color TEXT DEFAULT '#111827',
    bg_image_url TEXT,
    button_text TEXT DEFAULT 'SAYA MAU',
    whatsapp_link TEXT NOT NULL,
    pixel_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_slug TEXT REFERENCES public.events(slug) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Optional, can be customized)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to events
CREATE POLICY "Allow public read access to events" ON public.events
    FOR SELECT USING (true);

-- Allow public insert access to registrations
CREATE POLICY "Allow public insert to registrations" ON public.registrations
    FOR INSERT WITH CHECK (true);

-- Allow all access for authenticated roles (or use service_role)
CREATE POLICY "Allow service_role full access to events" ON public.events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access to registrations" ON public.registrations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

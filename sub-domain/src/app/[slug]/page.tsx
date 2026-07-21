import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingForm } from '@/components/landing-form';
import { MetaPixel } from '@/components/meta-pixel';
import { getEventBySlug } from '@/lib/data';
import { getProxiedImageUrl } from '@/lib/r2';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Promptcamp' };
  return {
    title: `Promptcamp - ${event.title}`,
    description: event.description || 'Webinar Promptcamp',
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const bgStyle = {
    backgroundColor: event.bg_color || '#020617',
    backgroundImage: event.bg_image_url ? `linear-gradient(rgba(2,6,23,0.7), rgba(2,6,23,0.85)), url(${getProxiedImageUrl(event.bg_image_url)})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as const;

  return (
    <main className="min-h-screen bg-[#8b9199] flex justify-center text-slate-100 antialiased overflow-x-hidden">
      <MetaPixel pixelId={event.pixel_id} />

      <div className="w-full max-w-[480px] min-h-screen flex flex-col shadow-2xl" style={bgStyle}>
        
        <section className="w-full">
          {event.poster_url ? (
            <Image
              src={getProxiedImageUrl(event.poster_url)!}
              alt={event.title}
              width={480}
              height={640}
              className="w-full h-auto object-cover block"
              priority
              unoptimized
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center p-8 text-center text-sm font-semibold text-slate-400 bg-slate-800/80">
              Poster belum diisi
            </div>
          )}
        </section>

        <section className="flex-1 px-6 py-8 flex flex-col justify-between text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {event.title}
            </h1>
            <div className="text-sm leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: event.description || 'Isi detail event dari dashboard admin.' }} />
          </div>
          
          <div className="mt-8">
            <LandingForm slug={event.slug} buttonText={event.button_text || 'SAYA MAU'} whatsappLink={event.whatsapp_link} />
          </div>
        </section>

      </div>
    </main>
  );
}

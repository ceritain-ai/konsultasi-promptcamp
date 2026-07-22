import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth';
import { r2, r2Bucket, r2PublicUrl } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = String(formData.get('folder') || 'media').trim() || 'media';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File wajib ada.' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${folder}/${Date.now()}-${safeName}`;

  await r2.send(new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: bytes,
    ContentType: file.type || 'application/octet-stream',
  }));

  return NextResponse.json({ key, url: r2PublicUrl(key) });
}

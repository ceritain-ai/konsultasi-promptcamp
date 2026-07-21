import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { r2, r2Bucket } from '@/lib/r2';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.join('/');

  try {
    const data = await r2.send(new GetObjectCommand({
      Bucket: r2Bucket,
      Key: objectKey,
    }));

    if (!data.Body) {
      return new NextResponse('Not found', { status: 404 });
    }

    const headers = new Headers();
    if (data.ContentType) headers.set('Content-Type', data.ContentType);
    if (data.ContentLength) headers.set('Content-Length', data.ContentLength.toString());
    if (data.ETag) headers.set('ETag', data.ETag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    // @ts-ignore
    return new NextResponse(data.Body?.transformToWebStream ? data.Body.transformToWebStream() : data.Body, { headers });
  } catch (error: any) {
    console.error('Error serving media:', error);
    return new NextResponse('Not found', { status: 404 });
  }
}

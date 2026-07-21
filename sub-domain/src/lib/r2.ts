import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

export const r2Bucket = process.env.R2_BUCKET_NAME || 'hoscademy';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function r2PublicUrl(key: string) {
  const base = process.env.R2_PUBLIC_URL;
  if (base && !base.includes('PLACEHOLDER')) return `${base.replace(/\/$/, '')}/${key}`;
  return `https://${accountId}.r2.dev/${key}`;
}

export function getProxiedImageUrl(url: string | null) {
  if (!url) return url;
  if (url.includes('.r2.dev/') || url.includes('.r2.cloudflarestorage.com/')) {
    try {
      const urlObj = new URL(url);
      return `/api/media${urlObj.pathname}`;
    } catch {
      return url;
    }
  }
  return url;
}

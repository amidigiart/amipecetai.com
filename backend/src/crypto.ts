import { createHash } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function blake3Fallback(input: string): string {
  return createHash('sha512').update(input, 'utf8').digest('hex').slice(0, 64);
}

export function generateSealData(
  status: 'approved' | 'rejected' | 'partial',
  hash: string,
  score: number
) {
  const map = {
    approved: { color: '#22c55e', label: 'VALOARE CERTIFICATĂ', icon: '✓' },
    rejected: { color: '#ef4444', label: 'ZGOMOT DETECTAT',     icon: '✗' },
    partial:  { color: '#f59e0b', label: 'PARȚIAL VALID',       icon: '⚠' },
  };
  const meta = map[status];

  return {
    status,
    color: meta.color,
    label: meta.label,
    icon: meta.icon,
    hashShort: hash.slice(0, 8).toUpperCase(),
    score,
    date: new Date().toISOString(),
    verifyUrl: `https://amipecetai.ai/verify/${hash}`,
  };
}

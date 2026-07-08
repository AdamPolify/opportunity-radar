import { createHash } from 'node:crypto';

export function stableId(...parts) {
  const input = parts.filter(Boolean).join('::').toLowerCase().trim();
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

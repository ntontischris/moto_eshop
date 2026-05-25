// Deterministic FNV-1a hash → a stable bucket in [0, 1) so the same visitor
// always lands on the same variant for a given campaign.
export function hashToUnit(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

export function variantBucket(sessionId: string, campaignId: string): number {
  return hashToUnit(`${sessionId}:${campaignId}`);
}

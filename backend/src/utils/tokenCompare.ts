import crypto from 'crypto';

export const safeCompare = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf); // Prevent timing attack on length
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
};

import { timingSafeEqual } from "crypto";

/** Compara dois segredos sem vazar timing (`!==` para na 1ª diferença). Só servidor. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

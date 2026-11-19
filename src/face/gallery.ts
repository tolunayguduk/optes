import { cosineSimilarity } from './embedding';

/** Kayıtlı kişi: ad ve bu kişiye ait bir veya birkaç yüz parmak izi. */
export interface Person {
  name: string;
  embeddings: number[][];
}

export interface FaceMatch {
  /** Eşleşen kişinin adı; eşik altındaysa `null` (bilinmeyen). */
  name: string | null;
  /** En iyi adayın benzerliği (-1..1); kayıtlı kişi yoksa 0. */
  similarity: number;
  /** En iyi adayın adı (eşik altında olsa bile), tanı/ayar için. */
  candidate: string | null;
}

/** Varsayılan eşik: bu değerin altı "bilinmeyen". Gerçek denemelerle ayarlanmalı (bkz. docs/adr/0003). */
export const DEFAULT_MATCH_THRESHOLD = 0.5;

/**
 * Bir yüz parmak izini kayıtlı kişilerle karşılaştırır. Her kişi için en yüksek benzerlik alınır;
 * en iyi kişi, benzerliği `threshold` ve üstündeyse eşleşir.
 */
export function matchFace(
  embedding: ArrayLike<number>,
  people: readonly Person[],
  threshold: number = DEFAULT_MATCH_THRESHOLD,
): FaceMatch {
  let best: { name: string; similarity: number } | null = null;
  for (const person of people) {
    for (const e of person.embeddings) {
      const s = cosineSimilarity(embedding, e);
      if (best == null || s > best.similarity) best = { name: person.name, similarity: s };
    }
  }
  if (best == null) return { name: null, similarity: 0, candidate: null };
  return {
    name: best.similarity >= threshold ? best.name : null,
    similarity: best.similarity,
    candidate: best.name,
  };
}

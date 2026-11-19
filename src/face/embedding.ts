/** Yüz parmak izi (embedding) işlemleri; worklet thread'inde de çalışabilir. */

export function l2Normalize(v: ArrayLike<number>): number[] {
  'worklet';
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i]! * v[i]!;
  const norm = Math.sqrt(sum) || 1;
  const out: number[] = [];
  for (let i = 0; i < v.length; i++) out.push(v[i]! / norm);
  return out;
}

/** İki vektörün kosinüs benzerliği (-1..1). Vektörler farklı uzunluktaysa 0. */
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  'worklet';
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

/** Normalize edilmiş vektörlerin ortalamasını alıp yeniden normalize eder. */
export function averageEmbeddings(list: ArrayLike<number>[]): number[] {
  'worklet';
  if (list.length === 0) return [];
  const dim = list[0]!.length;
  const sum = new Array<number>(dim).fill(0);
  for (const e of list) {
    const n = l2Normalize(e);
    for (let i = 0; i < dim; i++) sum[i] = sum[i]! + n[i]!;
  }
  return l2Normalize(sum);
}

import { ANTD_PALETTE } from '../theme';

/** Aynı etiket her zaman aynı renkte görünsün diye etiket metninden sabit bir palet rengi seçer. */
export function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return ANTD_PALETTE[hash % ANTD_PALETTE.length]!;
}

/** "person 87%" biçiminde etiket metni (FR-5). */
export function formatLabel(label: string, score: number): string {
  return `${label} ${Math.round(score * 100)}%`;
}

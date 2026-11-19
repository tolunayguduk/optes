import type { DetectionFrame } from './types';

/**
 * Sonucu seçilen etiketlerle sınırlar. `selected` null ya da boşsa her şey gösterilir.
 * Seçim kutular takip edilmeden ÖNCE uygulanır; böylece elenen sınıflar eleme/takip kararlarını etkilemez.
 */
export function filterByLabels(
  result: DetectionFrame | null,
  selected: readonly string[] | null,
): DetectionFrame | null {
  if (result == null || selected == null || selected.length === 0) return result;
  const allowed = new Set(selected);
  return { ...result, detections: result.detections.filter((d) => allowed.has(d.label)) };
}

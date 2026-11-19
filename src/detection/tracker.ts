import type { Detection, NormalizedRect } from './types';

export interface TrackerOptions {
  /** Yeni ölçümün ağırlığı (0..1). Küçük değer = daha yumuşak ama daha gecikmeli. Varsayılan 0.35. */
  smoothing?: number;
  /** Bir tespitin mevcut bir nesneyle eşleşmesi için gereken en düşük IoU. Varsayılan 0.3. */
  matchIou?: number;
  /** Bir nesnenin gösterilmesi için gereken en az eşleşme sayısı (tek karelik hayaletleri eler). Varsayılan 2. */
  minHits?: number;
  /** Nesne görülmeyince kaç ms daha gösterilsin (kaçan tespitlerde yanıp sönmeyi önler). Varsayılan 350. */
  holdMs?: number;
  /** Etiket oylarının her güncellemede çarpıldığı katsayı (0..1). Varsayılan 0.8. */
  voteDecay?: number;
}

interface Track {
  box: NormalizedRect;
  score: number;
  votes: Record<string, number>;
  hits: number;
  lastSeen: number;
}

/** İki kutunun kesişim / birleşim oranı (0..1). */
export function iou(a: NormalizedRect, b: NormalizedRect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function bestLabel(votes: Record<string, number>): string {
  let best = '';
  let bestVote = -1;
  for (const label of Object.keys(votes)) {
    if (votes[label]! > bestVote) {
      best = label;
      bestVote = votes[label]!;
    }
  }
  return best;
}

/**
 * Kareler arasında nesneleri izleyip titreşimi azaltır:
 *  - kutu konumu üstel hareketli ortalama ile yumuşatılır,
 *  - etiket son karelerin skor oylarıyla belirlenir (tek karelik yanlış etiket görünmez),
 *  - ilk karede görünen hayalet tespitler (minHits) ve bir an kaçan tespitler (holdMs) için tutma uygulanır.
 * Saf bir yapıdır: zaman dışarıdan verilir, bu yüzden test edilebilir.
 */
export function createTracker(options: TrackerOptions = {}) {
  const smoothing = options.smoothing ?? 0.35;
  const matchIou = options.matchIou ?? 0.3;
  const minHits = options.minHits ?? 2;
  const holdMs = options.holdMs ?? 350;
  const voteDecay = options.voteDecay ?? 0.8;

  let tracks: Track[] = [];

  function visible(now: number): Detection[] {
    return tracks
      .filter((t) => t.hits >= minHits && now - t.lastSeen <= holdMs)
      .map((t) => ({ label: bestLabel(t.votes), score: t.score, box: { ...t.box } }));
  }

  function dropStale(now: number) {
    tracks = tracks.filter((t) => now - t.lastSeen <= holdMs);
  }

  return {
    /** Yeni kare tespitlerini işler; o an gösterilecek (yumuşatılmış) tespitleri döner. */
    update(detections: Detection[], now: number): Detection[] {
      const pairs: { d: number; t: number; score: number }[] = [];
      detections.forEach((det, d) => {
        tracks.forEach((track, t) => {
          const overlap = iou(det.box, track.box);
          if (overlap >= matchIou) {
            // Aynı etiketli eşleşmeye küçük bir öncelik ver.
            const sameLabel = (track.votes[det.label] ?? 0) > 0 ? 0.05 : 0;
            pairs.push({ d, t, score: overlap + sameLabel });
          }
        });
      });
      pairs.sort((a, b) => b.score - a.score);

      const usedDet = new Set<number>();
      const usedTrack = new Set<number>();
      for (const p of pairs) {
        if (usedDet.has(p.d) || usedTrack.has(p.t)) continue;
        usedDet.add(p.d);
        usedTrack.add(p.t);
        const det = detections[p.d]!;
        const track = tracks[p.t]!;
        track.box = {
          x: lerp(track.box.x, det.box.x, smoothing),
          y: lerp(track.box.y, det.box.y, smoothing),
          width: lerp(track.box.width, det.box.width, smoothing),
          height: lerp(track.box.height, det.box.height, smoothing),
        };
        track.score = lerp(track.score, det.score, smoothing);
        for (const label of Object.keys(track.votes)) track.votes[label]! *= voteDecay;
        track.votes[det.label] = (track.votes[det.label] ?? 0) + det.score;
        track.hits += 1;
        track.lastSeen = now;
      }

      detections.forEach((det, d) => {
        if (usedDet.has(d)) return;
        tracks.push({
          box: { ...det.box },
          score: det.score,
          votes: { [det.label]: det.score },
          hits: 1,
          lastSeen: now,
        });
      });

      dropStale(now);
      return visible(now);
    },

    /** Yeni tespit gelmese de süresi dolan nesneleri eler; gösterilecekleri döner. */
    prune(now: number): Detection[] {
      dropStale(now);
      return visible(now);
    },
  };
}

export type Tracker = ReturnType<typeof createTracker>;

import { filterByLabels } from '../filter';
import { COCO_LABELS } from '../models/cocoLabels';
import { EFFICIENTDET_LABELS } from '../models/efficientDetLabels';
import { LABELS_TR, labelName } from '../../i18n/labels.tr';
import type { DetectionFrame } from '../types';

const frame: DetectionFrame = {
  frameWidth: 1080,
  frameHeight: 1920,
  detections: [
    { label: 'person', score: 0.9, box: { x: 0, y: 0, width: 0.2, height: 0.2 } },
    { label: 'cup', score: 0.8, box: { x: 0.5, y: 0.5, width: 0.1, height: 0.1 } },
    { label: 'bottle', score: 0.7, box: { x: 0.7, y: 0.1, width: 0.1, height: 0.3 } },
  ],
};

describe('filterByLabels', () => {
  it('seçim yoksa (null veya boş) her şeyi döndürür', () => {
    expect(filterByLabels(frame, null)).toBe(frame);
    expect(filterByLabels(frame, [])).toBe(frame);
  });

  it('yalnızca seçilen etiketleri tutar', () => {
    const out = filterByLabels(frame, ['person'])!;
    expect(out.detections.map((d) => d.label)).toEqual(['person']);
    expect(out.frameWidth).toBe(1080);
  });

  it('birden çok etiket seçilebilir', () => {
    const out = filterByLabels(frame, ['cup', 'bottle'])!;
    expect(out.detections.map((d) => d.label)).toEqual(['cup', 'bottle']);
  });

  it('sonuç yoksa null döner ve girdiyi değiştirmez', () => {
    expect(filterByLabels(null, ['person'])).toBeNull();
    const copy = JSON.stringify(frame);
    filterByLabels(frame, ['person']);
    expect(JSON.stringify(frame)).toBe(copy);
  });
});

describe('Türkçe etiket adları', () => {
  it('modellerin tanıdığı her etiketin Türkçe karşılığı vardır', () => {
    const all = new Set([...COCO_LABELS, ...EFFICIENTDET_LABELS].filter((l) => l !== '???'));
    const missing = [...all].filter((l) => LABELS_TR[l] == null);
    expect(missing).toEqual([]);
  });

  it('bilinmeyen etiket İngilizce kalır', () => {
    expect(labelName('person')).toBe('kişi');
    expect(labelName('unknown-thing')).toBe('unknown-thing');
  });
});

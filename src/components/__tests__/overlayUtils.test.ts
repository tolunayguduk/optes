import { ANTD_PALETTE } from '../../theme';
import { colorForLabel, formatLabel } from '../overlayUtils';

describe('colorForLabel', () => {
  it('aynı etiket için hep aynı rengi verir', () => {
    expect(colorForLabel('person')).toBe(colorForLabel('person'));
  });
  it('her zaman palette olan bir renk döner', () => {
    for (const l of ['person', 'cat', 'car', 'cup', 'laptop', '']) {
      expect(ANTD_PALETTE).toContain(colorForLabel(l));
    }
  });
});

describe('formatLabel', () => {
  it('skoru yüzdeye yuvarlar', () => {
    expect(formatLabel('person', 0.874)).toBe('person 87%');
    expect(formatLabel('cat', 0.5)).toBe('cat 50%');
  });
});

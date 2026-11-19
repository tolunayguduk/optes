import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { type DetectionFrame, frameRectToViewRect } from '../detection';
import { colorForLabel, formatLabel } from './overlayUtils';

interface Props {
  result: DetectionFrame | null;
}

const LABEL_HEIGHT = 18;

/**
 * Kameranın üstüne kutu ve küçük etiket çizer. Dokunmaları engellemez.
 * Kamera önizlemesinin `cover` modunda olduğu varsayılır (bkz. `frameRectToViewRect`).
 */
export function DetectionOverlay({ result }: Props) {
  const [view, setView] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setView({ width, height });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {view != null &&
        result != null &&
        result.frameWidth > 0 &&
        result.frameHeight > 0 &&
        result.detections.map((d, i) => {
          const r = frameRectToViewRect(
            d.box,
            { width: result.frameWidth, height: result.frameHeight },
            view,
          );
          const color = colorForLabel(d.label);
          // Etiket kutunun üstüne sığmıyorsa kutunun içine, üst kenara hizalanır.
          const labelTop = r.y >= LABEL_HEIGHT ? r.y - LABEL_HEIGHT : r.y;
          return (
            <View key={`${d.label}-${i}`} style={StyleSheet.absoluteFill}>
              <View
                style={[
                  styles.box,
                  { left: r.x, top: r.y, width: r.width, height: r.height, borderColor: color },
                ]}
              />
              <View style={[styles.label, { left: r.x, top: labelTop, backgroundColor: color }]}>
                <Text style={styles.labelText} numberOfLines={1}>
                  {formatLabel(d.label, d.score)}
                </Text>
              </View>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', borderWidth: 2, borderRadius: 2 },
  label: {
    position: 'absolute',
    height: LABEL_HEIGHT,
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderRadius: 2,
  },
  labelText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});

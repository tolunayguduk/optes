import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import {
  type DetectionFrame,
  frameRectToViewRect,
  frameRectToViewRectViaCamera,
  type PointXY,
} from '../detection';
import { colorForLabel, formatLabel } from './overlayUtils';

interface Props {
  result: DetectionFrame | null;
  /** Kamera koordinatını ekran koordinatına çevirir (örn. `CameraRef.convertCameraPointToViewPoint`). */
  toView?: (cameraPoint: PointXY) => PointXY;
}

const LABEL_HEIGHT = 24;

/** Önce kameranın kendi dönüşümünü dener; olmazsa (hazır değil vb.) `cover` varsayımına döner. */
function toRect(
  box: DetectionFrame['detections'][number]['box'],
  result: DetectionFrame,
  view: { width: number; height: number },
  toView?: Props['toView'],
) {
  if (toView != null && result.frameToCamera != null) {
    try {
      return frameRectToViewRectViaCamera(box, result.frameToCamera, toView);
    } catch {
      // Önizleme henüz hazır değil: aşağıdaki yedek hesaba düş.
    }
  }
  return frameRectToViewRect(box, { width: result.frameWidth, height: result.frameHeight }, view);
}

/**
 * Kameranın üstüne kutu ve küçük etiket çizer. Dokunmaları engellemez.
 * Kamera önizlemesinin `cover` modunda olduğu varsayılır (bkz. `frameRectToViewRect`).
 */
export function DetectionOverlay({ result, toView }: Props) {
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
          const r = toRect(d.box, result, view, toView);
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
              <View style={[styles.label, { left: r.x, top: labelTop, borderLeftColor: color }]}>
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
  box: { position: 'absolute', borderWidth: 3, borderRadius: 3 },
  label: {
    position: 'absolute',
    height: LABEL_HEIGHT,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRadius: 3,
    // Koyu zemin: yazı hangi renkli kutuda olursa olsun okunur (açık renklerde beyaz yazı okunmuyordu).
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderLeftWidth: 5,
  },
  labelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

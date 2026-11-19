import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@ant-design/react-native';
import { AppState, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { DetectionOverlay } from '../components/DetectionOverlay';
import { CameraFlipButton } from '../components/CameraFlipButton';
import { FaceControls } from '../components/FaceControls';
import { type Mode, ModeSwitch } from '../components/ModeSwitch';
import { ObjectPicker } from '../components/ObjectPicker';
import { filterByLabels, useObjectDetector, useSmoothedResult } from '../detection';
import { facesToDetectionFrame } from '../face/faceResult';
import type { Person } from '../face/gallery';
import { useEnrollment } from '../face/useEnrollment';
import { useFaceRecognizer } from '../face/useFaceRecognizer';

/** Uygulama ön plandayken true döner (FR-7: arka plandan dönüşte kamera devam eder). */
function useIsAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

export function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  // Arka/ön kamera. Değişince izleyiciler sıfırlanır (aynalama/konum farkı eski kutuları geçersiz kılar).
  const [position, setPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(position);
  const appActive = useIsAppActive();
  const insets = useSafeAreaInsets();
  const [asked, setAsked] = useState(false);
  const [mode, setMode] = useState<Mode>('objects');

  // --- Nesne tanıma ---
  // Motor/model `src/detection/index.ts` içinde seçilir; ekran hangisi olduğunu bilmez.
  // Tanı şeridi yalnızca geliştirme (Debug) sürümünde görünür.
  const detector = useObjectDetector({ diagnostics: __DEV__ });
  // Kullanıcının seçtiği nesneler (null = hepsi). Filtre, takip/eleme öncesinde uygulanır.
  const [selected, setSelected] = useState<string[] | null>(null);
  const filtered = useMemo(() => filterByLabels(detector.result, selected), [detector.result, selected]);
  const smoothed = useSmoothedResult(filtered, undefined, `${position}|${selected?.join(',') ?? '*'}`);

  // --- Yüz tanıma (DENEME): kayıtlı kişiler yalnızca bellekte tutulur ---
  const face = useFaceRecognizer({ diagnostics: __DEV__ });
  const [people, setPeople] = useState<Person[]>([]);
  const faceResult = useMemo(() => facesToDetectionFrame(face.frame, people), [face.frame, people]);
  const faceSmoothed = useSmoothedResult(faceResult, undefined, `${position}|faces:${people.length}`);
  const handleEnrolled = useCallback((person: Person) => {
    setPeople((prev) => {
      const existing = prev.find((p) => p.name.toLowerCase() === person.name.toLowerCase());
      if (existing == null) return [...prev, person];
      // Aynı adla tekrar kayıt: örnekleri ekle (farklı açı/ışık tanımayı iyileştirir).
      return prev.map((p) => (p === existing ? { ...p, embeddings: [...p.embeddings, ...person.embeddings] } : p));
    });
  }, []);
  const enrollment = useEnrollment(face.frame, handleEnrolled);
  const removePerson = useCallback(
    (name: string) => setPeople((prev) => prev.filter((p) => p.name !== name)),
    [],
  );

  useEffect(() => {
    if (!hasPermission && !asked) {
      setAsked(true);
      requestPermission();
    }
  }, [hasPermission, asked, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Kamera izni gerekli</Text>
        <Text style={styles.body}>
          Nesneleri tanıyabilmem için kameraya erişmem gerekiyor. Görüntüler cihazından çıkmaz.
        </Text>
        <Button type="primary" onPress={() => Linking.openSettings()}>
          Ayarlara git
        </Button>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Kamera bulunamadı.</Text>
      </View>
    );
  }

  const facesMode = mode === 'faces';
  const active = facesMode ? face : detector;

  return (
    <>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={appActive}
        outputs={active.outputs}
      />
      <DetectionOverlay result={facesMode ? faceSmoothed : smoothed} />

      <ModeSwitch mode={mode} onChange={setMode} />
      {facesMode ? (
        <FaceControls
          topOffset={44}
          people={people}
          enrollingName={enrollment.name}
          progress={enrollment.progress}
          total={enrollment.total}
          onStartEnroll={enrollment.start}
          onCancelEnroll={enrollment.cancel}
          onRemove={removePerson}
        />
      ) : (
        <ObjectPicker topOffset={44} labels={detector.labels} selected={selected} onChange={setSelected} />
      )}

      <CameraFlipButton
        topOffset={88}
        position={position}
        onPress={() => setPosition((p) => (p === 'back' ? 'front' : 'back'))}
      />

      {active.diagnostics != null && (
        <View style={[styles.diagBox, { bottom: insets.bottom + 8 }]} pointerEvents="none">
          {!facesMode && detector.diagnosticsImage != null && (
            <Image source={{ uri: detector.diagnosticsImage }} style={styles.diagImage} />
          )}
          <Text style={styles.diagText}>{active.diagnostics}</Text>
        </View>
      )}
      {active.status === 'error' && (
        <View style={[styles.errorBanner, { top: insets.top + 96 }]} pointerEvents="none">
          <Text style={styles.errorText} selectable>
            {facesMode ? 'Yüz tanıma' : 'Tespit'} hatası: {active.error?.message ?? 'bilinmeyen hata'}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 8 },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 34, 45, 0.9)',
  },
  diagBox: {
    position: 'absolute',
    left: 8,
    right: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  diagImage: { width: 120, height: 120, marginBottom: 6, borderWidth: 1, borderColor: '#a0ff9c' },
  diagText: { color: '#a0ff9c', fontSize: 10, fontFamily: 'Menlo' },
  errorText: { color: '#fff', fontSize: 12 },
  body: { color: '#d9d9d9', fontSize: 14, textAlign: 'center', marginBottom: 16 },
});

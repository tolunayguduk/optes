import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { useObjectDetector } from '../detection';

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
  const device = useCameraDevice('back');
  const appActive = useIsAppActive();
  // Motor/model `src/detection/index.ts` içinde seçilir; ekran hangisi olduğunu bilmez.
  const detector = useObjectDetector();
  const [asked, setAsked] = useState(false);

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
        <Pressable style={styles.button} onPress={() => Linking.openSettings()}>
          <Text style={styles.buttonText}>Ayarlara git</Text>
        </Pressable>
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

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={appActive}
      outputs={detector.outputs}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 8 },
  body: { color: '#d9d9d9', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#1677ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

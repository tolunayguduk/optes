import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  position: 'back' | 'front';
  onPress: () => void;
  /** Üstteki diğer öğelerin altında konumlamak için ek boşluk. */
  topOffset?: number;
}

/** Arka/ön kamera arasında geçiş düğmesi. */
export function CameraFlipButton({ position, onPress, topOffset = 0 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Kamerayı çevir"
      onPress={onPress}
      style={[styles.pill, { top: insets.top + 8 + topOffset }]}
    >
      <Text style={styles.text}>{position === 'back' ? 'Ön kameraya geç' : 'Arka kameraya geç'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    left: 12,
    height: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ANTD_PRIMARY } from '../theme';

export type Mode = 'objects' | 'faces';

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const OPTIONS: { value: Mode; label: string }[] = [
  { value: 'objects', label: 'Nesne' },
  { value: 'faces', label: 'Yüz' },
];

/** Üstte iki seçenekli mod değiştirici: nesne tanıma / yüz tanıma. */
export function ModeSwitch({ mode, onChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { top: insets.top + 8 }]}>
      {OPTIONS.map((o) => {
        const active = o.value === mode;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={styles.text}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 12,
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 2,
  },
  pill: { height: 32, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 16 },
  pillActive: { backgroundColor: ANTD_PRIMARY },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

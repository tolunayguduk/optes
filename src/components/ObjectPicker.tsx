import { Button, Tag } from '@ant-design/react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { labelName } from '../i18n/labels.tr';

interface Props {
  /** Seçilebilecek (modelin tanıdığı) etiketler. */
  labels: readonly string[];
  /** Seçili etiketler; null = hepsi. */
  selected: readonly string[] | null;
  onChange: (next: string[] | null) => void;
  /** Üstteki diğer öğelerin (mod değiştirici) altında konumlamak için ek boşluk. */
  topOffset?: number;
}

function summary(selected: readonly string[] | null): string {
  if (selected == null || selected.length === 0) return 'Tüm nesneler';
  if (selected.length === 1) return labelName(selected[0]!);
  return `${selected.length} nesne seçili`;
}

/** Kullanıcının hangi nesneleri görmek istediğini seçtiği düğme ve alt panel. */
export function ObjectPicker({ labels, selected, onChange, topOffset = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...labels].sort((a, b) => labelName(a).localeCompare(labelName(b), 'tr')),
    [labels],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (q === '') return sorted;
    return sorted.filter(
      (l) => labelName(l).toLocaleLowerCase('tr').includes(q) || l.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  const toggle = (label: string) => {
    const current = selected ?? [];
    const next = current.includes(label) ? current.filter((l) => l !== label) : [...current, label];
    onChange(next.length === 0 ? null : next);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nesne seç"
        style={[styles.trigger, { top: insets.top + 8 + topOffset }]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerText}>{summary(selected)}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.title}>Hangi nesneleri görmek istiyorsun?</Text>

            <View style={styles.quickRow}>
              <Button size="small" type={selected == null ? 'primary' : 'ghost'} onPress={() => onChange(null)}>
                Tümü
              </Button>
              <View style={styles.gap} />
              <Button
                size="small"
                type={selected?.length === 1 && selected[0] === 'person' ? 'primary' : 'ghost'}
                onPress={() => onChange(['person'])}
              >
                Yalnızca kişi
              </Button>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ara (örn. şişe, kedi, cup)"
              placeholderTextColor="#8c8c8c"
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.search}
            />

            <ScrollView contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
              {shown.map((label) => {
                const isSelected = selected?.includes(label) ?? false;
                return (
                  // key, seçim durumunu içerir: Tag kendi iç durumunu tuttuğu için yeniden oluşturulur.
                  <View key={`${label}-${isSelected}`} style={styles.chip}>
                    <Tag selected={isSelected} onChange={() => toggle(label)}>
                      {labelName(label)}
                    </Tag>
                  </View>
                );
              })}
              {shown.length === 0 && <Text style={styles.empty}>Eşleşen nesne yok.</Text>}
            </ScrollView>

            <Button type="primary" onPress={() => setOpen(false)}>
              Tamam
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  triggerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  backdropTap: { flex: 1 },
  sheet: {
    maxHeight: '75%',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  quickRow: { flexDirection: 'row', marginBottom: 12 },
  gap: { width: 8 },
  search: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    color: '#000',
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 12 },
  chip: { marginRight: 8, marginBottom: 8 },
  empty: { color: '#8c8c8c', fontSize: 14 },
});

import { Button } from '@ant-design/react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Person } from '../face/gallery';

interface Props {
  people: readonly Person[];
  /** Kayıt sürüyorsa kişinin adı. */
  enrollingName: string | null;
  progress: number;
  total: number;
  onStartEnroll: (name: string) => void;
  onCancelEnroll: () => void;
  onRemove: (name: string) => void;
  topOffset?: number;
}

const PRIVACY_NOTE =
  'Yüz verisi yalnızca bu cihazda, bellekte tutulur ve uygulama kapanınca silinir. ' +
  'Yalnızca kendi rızanla ya da kişinin rızasıyla kayıt yap.';

/** Yüz modunda: kişi ekleme (ad + kayıt ilerlemesi) ve kayıtlı kişiler listesi. */
export function FaceControls({
  people,
  enrollingName,
  progress,
  total,
  onStartEnroll,
  onCancelEnroll,
  onRemove,
  topOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const [listOpen, setListOpen] = useState(false);

  const askName = () => {
    Alert.prompt(
      'Kişi ekle',
      `Kişinin adını yaz, sonra yüzünü kameraya tut.\n\n${PRIVACY_NOTE}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: (text?: string) => {
            const name = (text ?? '').trim();
            if (name !== '') onStartEnroll(name);
          },
        },
      ],
      'plain-text',
    );
  };

  const top = insets.top + 8 + topOffset;

  return (
    <>
      <View style={[styles.row, { top }]}>
        {enrollingName != null ? (
          <>
            <View style={styles.pill}>
              <Text style={styles.text}>
                {enrollingName}: {progress}/{total} (kameraya bak)
              </Text>
            </View>
            <Pressable style={[styles.pill, styles.gap]} onPress={onCancelEnroll}>
              <Text style={styles.text}>İptal</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable accessibilityRole="button" style={styles.pill} onPress={askName}>
              <Text style={styles.text}>+ Kişi ekle</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.pill, styles.gap]}
              onPress={() => setListOpen(true)}
            >
              <Text style={styles.text}>Kişiler ({people.length})</Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal visible={listOpen} transparent animationType="slide" onRequestClose={() => setListOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={() => setListOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.title}>Kayıtlı kişiler</Text>
            <Text style={styles.note}>{PRIVACY_NOTE}</Text>
            <ScrollView>
              {people.length === 0 && <Text style={styles.empty}>Henüz kimse kayıtlı değil.</Text>}
              {people.map((p) => (
                <View key={p.name} style={styles.personRow}>
                  <Text style={styles.personName}>
                    {p.name} ({p.embeddings.length} örnek)
                  </Text>
                  <Button size="small" type="warning" onPress={() => onRemove(p.name)}>
                    Sil
                  </Button>
                </View>
              ))}
            </ScrollView>
            <Button type="primary" onPress={() => setListOpen(false)}>
              Tamam
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 12, flexDirection: 'row', alignItems: 'center' },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  gap: { marginLeft: 8 },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  backdropTap: { flex: 1 },
  sheet: {
    maxHeight: '70%',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 6 },
  note: { fontSize: 12, color: '#595959', marginBottom: 12 },
  empty: { color: '#8c8c8c', fontSize: 14, marginBottom: 12 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  personName: { fontSize: 15, color: '#000', flexShrink: 1, marginRight: 12 },
});

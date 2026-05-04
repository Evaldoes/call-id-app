import React from 'react';
import { FlatList, StyleSheet, View, Alert } from 'react-native';
import {
  Text,
  Button,
  Icon,
  IconElement,
  TopNavigation,
  TopNavigationAction,
  Divider,
  ProgressBar,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallsStore } from '../store/calls.store';
import { useCallLogImport } from '../hooks/useCallLogImport';
import { CallItem } from '../components/CallItem';
import type { CallRecord } from '../../../types';

const TrashIcon   = (props: object): IconElement => <Icon {...props} name="trash-2-outline" />;
const DownloadIcon = (props: object): IconElement => <Icon {...props} name="download-outline" />;

export function CallsScreen({ navigation }: { navigation: any }) {
  const { records, clearAll } = useCallsStore();
  const { progress, error, startImport } = useCallLogImport();
  const insets = useSafeAreaInsets();

  function handleClear() {
    Alert.alert(
      'Limpar histórico',
      'Deseja apagar todo o histórico de chamadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: clearAll },
      ],
    );
  }

  function handlePress(record: CallRecord) {
    navigation.navigate('CallDetail', { callId: record.id });
  }

  const pct = progress.total > 0 ? progress.done / progress.total : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopNavigation
        title="Chamadas"
        accessoryRight={() => (
          <View style={styles.headerActions}>
            <TopNavigationAction icon={DownloadIcon} onPress={startImport} />
            <TopNavigationAction icon={TrashIcon}    onPress={handleClear} />
          </View>
        )}
      />
      <Divider />

      {/* Barra de progresso da importação */}
      {progress.running && (
        <View style={styles.progressBox}>
          <ProgressBar progress={pct} status="primary" style={styles.progressBar} />
          <Text category="c1" appearance="hint" style={styles.progressText}>
            {progress.done}/{progress.total} — {progress.current}
          </Text>
        </View>
      )}

      {!progress.running && progress.total > 0 && progress.done === progress.total && (
        <View style={styles.successBox}>
          <Text category="c1" status="success">
            ✓ {progress.total} chamadas importadas com OSINT
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text category="c1" status="danger">{error}</Text>
        </View>
      )}

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="phone-outline" fill="#8F9BB3" style={styles.emptyIcon} />
          <Text category="s1" appearance="hint">
            Nenhuma chamada registrada
          </Text>
          <Text category="c1" appearance="hint" style={styles.emptyHint}>
            Toque em ↓ para importar o histórico do dispositivo
          </Text>
          <Button
            style={styles.importBtn}
            size="small"
            status="primary"
            accessoryLeft={DownloadIcon}
            onPress={startImport}
            disabled={progress.running}>
            Importar chamadas recebidas
          </Button>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CallItem record={item} onPress={handlePress} />
          )}
          ListFooterComponent={
            <Button
              appearance="ghost"
              size="small"
              style={styles.loadMore}
              accessoryLeft={DownloadIcon}
              onPress={startImport}
              disabled={progress.running}>
              {progress.running
                ? `Analisando... ${progress.done}/${progress.total}`
                : 'Reimportar / buscar novas'}
            </Button>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row' },
  progressBox: { padding: 12, gap: 4 },
  progressBar: { marginBottom: 4 },
  progressText: { textAlign: 'center' },
  successBox: {
    padding: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,224,150,0.1)',
  },
  errorBox: {
    padding: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,61,113,0.1)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: { width: 56, height: 56, marginBottom: 8 },
  emptyHint: { textAlign: 'center', marginTop: 4 },
  importBtn: { marginTop: 16 },
  loadMore: { margin: 8 },
});

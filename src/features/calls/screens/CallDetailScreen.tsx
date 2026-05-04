import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  TopNavigation,
  TopNavigationAction,
  Divider,
  Text,
  Button,
  Icon,
  IconElement,
  Spinner,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallsStore } from '../store/calls.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { buildOsintReport, OsintReport } from '../../osint/services/osint.service';
import { RiskBanner } from '../../osint/components/RiskBanner';
import { IntelCard } from '../../osint/components/IntelCard';
import { SpamCard } from '../../osint/components/SpamCard';
import { SocialPresenceCard } from '../../osint/components/SocialPresenceCard';
import { Tag } from '../../../shared/components/Tag';
import { formatDisplayNumber } from '../../../shared/utils/phone.utils';

const BackIcon = (props: object): IconElement => (
  <Icon {...props} name="arrow-back-outline" />
);
const RefreshIcon = (props: object): IconElement => (
  <Icon {...props} name="refresh-outline" />
);

interface Props {
  navigation: any;
  route: { params: { callId: string } };
}

function formatDateTime(date: Date) {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function CallDetailScreen({ navigation, route }: Props) {
  const { callId } = route.params;
  const insets = useSafeAreaInsets();
  const record = useCallsStore((s) => s.records.find((r) => r.id === callId));
  const updateCallerInfo = useCallsStore((s) => s.updateCallerInfo);
  const { numverifyKey, abstractApiKey } = useSettingsStore();

  const [report, setReport] = useState<OsintReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function runOsint() {
    if (!record) return;
    setLoading(true);
    try {
      const result = await buildOsintReport(record.number, {
        numverifyKey: numverifyKey || undefined,
        abstractApiKey: abstractApiKey || undefined,
      });
      setReport(result);
      updateCallerInfo(callId, result.callerInfo);
    } finally {
      setLoading(false);
    }
  }

  // Monta report a partir do callerInfo já salvo ou roda OSINT automaticamente
  useEffect(() => {
    if (!record) return;
    if (record.callerInfo) {
      // Já tem dados — reconstrói o report parcial para exibição
      buildOsintReport(record.number, {
        numverifyKey: numverifyKey || undefined,
        abstractApiKey: abstractApiKey || undefined,
      })
        .then(setReport)
        .catch(() => null);
    } else {
      runOsint();
    }
  }, [callId]);

  if (!record) {
    return (
      <View style={styles.center}>
        <Text appearance="hint">Chamada não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopNavigation
        accessoryLeft={() => (
          <TopNavigationAction
            icon={BackIcon}
            onPress={() => navigation.goBack()}
          />
        )}
        accessoryRight={() => (
          <TopNavigationAction
            icon={loading ? () => <Spinner size="small" /> : RefreshIcon}
            onPress={runOsint}
          />
        )}
        title={() => (
          <View style={styles.titleBox}>
            <Text category="s1">
              {record.callerInfo?.formatted ?? formatDisplayNumber(record.number)}
            </Text>
            <Text category="c1" appearance="hint">
              {formatDateTime(record.timestamp)}
            </Text>
          </View>
        )}
      />
      <Divider />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 16 }]}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text category="h5" style={styles.number}>
            {record.callerInfo?.formatted ?? formatDisplayNumber(record.number)}
          </Text>
          <View style={styles.tags}>
            <Tag status={record.type === 'missed' ? 'danger' : 'success'}>
              {record.type === 'missed' ? 'Perdida' : 'Recebida'}
            </Tag>
            {record.callerInfo?.lineType && record.callerInfo.lineType !== 'unknown' && (
              <Tag
                status={record.callerInfo.lineType === 'mobile' ? 'info' : 'basic'}
                style={styles.tagGap}>
                {record.callerInfo.lineType === 'mobile' ? 'Celular' : 'Fixo'}
              </Tag>
            )}
          </View>
        </View>

        {loading && !report && (
          <View style={styles.center}>
            <Spinner />
            <Text category="c1" appearance="hint" style={styles.loadingText}>
              Consultando fontes abertas...
            </Text>
          </View>
        )}

        {report && (
          <>
            <RiskBanner level={report.riskLevel} score={report.spam.score} />
            <IntelCard report={report} />
            <SpamCard spam={report.spam} />
            <SocialPresenceCard rawNumber={record.number} />

            {report.summary ? (
              <Text category="c1" appearance="hint" style={styles.summary}>
                {report.summary}
              </Text>
            ) : null}
          </>
        )}

        {!loading && !report && (
          <Button
            style={styles.analyzeBtn}
            status="warning"
            onPress={runOsint}
            accessoryLeft={RefreshIcon}>
            Analisar número
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 8 },
  header: { marginBottom: 12 },
  number: { marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagGap: { marginLeft: 4 },
  titleBox: { alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  loadingText: { marginTop: 8, textAlign: 'center' },
  summary: { textAlign: 'center', marginTop: 8, lineHeight: 18 },
  analyzeBtn: { marginTop: 16 },
});

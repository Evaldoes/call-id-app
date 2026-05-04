import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Card, Text, Divider, Spinner } from '@ui-kitten/components';
import {
  buildInitialChecks,
  runSingleCheck,
  SocialCheck,
  SocialPresence,
  SpamCallsResult,
} from '../services/social.service';

interface Props {
  rawNumber: string;
}

const statusIcon: Record<string, string> = {
  checking:  '⏳',
  found:     '✓',
  not_found: '✗',
  unknown:   '?',
};

const statusColor: Record<string, string> = {
  checking:  '#8F9BB3',
  found:     '#00E096',
  not_found: '#FF3D71',
  unknown:   '#8F9BB3',
};

function CheckRow({ check }: { check: SocialCheck }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => Linking.openURL(check.url)}
      activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: check.color + '22' }]}>
        <Text style={{ fontSize: 16 }}>
          {check.platform === 'WhatsApp'      ? '💬'
           : check.platform === 'SpamCalls'    ? '🛡️'
           : check.platform === 'ShouldIAnswer'? '⚠️'
           : check.platform === 'Tellows'     ? '📊'
           : check.platform === 'Telegram'    ? '✈️'
           : '🔍'}
        </Text>
      </View>

      <View style={styles.info}>
        <Text category="s2">{check.platform}</Text>
        {check.status === 'checking' ? (
          <Text category="c1" appearance="hint">Verificando...</Text>
        ) : (
          <Text
            category="c1"
            style={{ color: statusColor[check.status] }}>
            {check.detail ?? (check.status === 'found' ? 'Encontrado' : check.status === 'not_found' ? 'Não encontrado' : 'Sem dados')}
          </Text>
        )}
      </View>

      <View style={styles.statusBox}>
        {check.status === 'checking' ? (
          <Spinner size="tiny" />
        ) : (
          <Text style={[styles.statusIcon, { color: statusColor[check.status] }]}>
            {statusIcon[check.status]}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function SocialPresenceCard({ rawNumber }: Props) {
  const [presence, setPresence] = useState<SocialPresence>(() =>
    buildInitialChecks(rawNumber),
  );
  const [spamData, setSpamData] = useState<SpamCallsResult | null>(null);

  useEffect(() => {
    if (!rawNumber) return;

    const initial = buildInitialChecks(rawNumber);
    setPresence(initial);
    setSpamData(null);

    const automated = initial.checks.filter((c) => c.status === 'checking');

    automated.forEach(async (check) => {
      const result = await runSingleCheck(check.platform, initial.e164);
      if (check.platform === 'SpamCalls' && result.spamData) {
        setSpamData(result.spamData);
      }
      setPresence((prev) => ({
        ...prev,
        checks: prev.checks.map((c) =>
          c.platform === check.platform ? { ...c, ...result } : c,
        ),
      }));
    });
  }, [rawNumber]);

  const found  = presence.checks.filter((c) => c.status === 'found').length;
  const total  = presence.checks.filter((c) => c.status !== 'checking').length;
  const hasSpam = presence.checks.some(
    (c) => c.status === 'found' && ['SpamCalls', 'ShouldIAnswer'].includes(c.platform),
  );

  return (
    <Card style={styles.card} status={hasSpam ? 'danger' : 'basic'}>
      <View style={styles.header}>
        <Text category="s1">Presença Online</Text>
        {total > 0 && (
          <Text category="c1" appearance="hint">
            {found}/{total} encontrados
          </Text>
        )}
      </View>
      <Divider style={styles.divider} />

      {spamData && (
        <View style={styles.spamMeta}>
          <View style={styles.metaRow}>
            {spamData.country ? (
              <Text category="c1" appearance="hint" style={styles.metaItem}>
                🌎 {spamData.country}
              </Text>
            ) : null}
            {spamData.city ? (
              <Text category="c1" appearance="hint" style={styles.metaItem}>
                📍 {spamData.city}
              </Text>
            ) : null}
            {spamData.riskLabel ? (
              <Text
                category="c1"
                style={[
                  styles.metaItem,
                  { color: spamData.riskLabel === 'Alto' ? '#FF3D71' : spamData.riskLabel === 'Médio' ? '#FFAA00' : '#00E096' },
                ]}>
                {`⚠ Risco: ${spamData.riskLabel}`}
              </Text>
            ) : null}
          </View>
          {spamData.leadText ? (
            <Text category="c1" appearance="hint" style={styles.leadText}>
              {spamData.leadText}
            </Text>
          ) : null}
        </View>
      )}

      {presence.checks.map((check, i) => (
        <React.Fragment key={check.platform}>
          <CheckRow check={check} />
          {i < presence.checks.length - 1 && (
            <Divider style={styles.rowDivider} />
          )}
        </React.Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  divider: { marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  statusBox: { width: 24, alignItems: 'center' },
  statusIcon: { fontSize: 16, fontWeight: 'bold' },
  rowDivider: { marginVertical: 0 },
  spamMeta: { gap: 6, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: {},
  leadText: { lineHeight: 16 },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from '@ui-kitten/components';
import { Tag } from '../../../shared/components/Tag';
import type { CallerInfo } from '../../../types';

const lineTypeLabel: Record<string, string> = {
  mobile: 'Celular',
  landline: 'Fixo',
  voip: 'VoIP',
  toll_free: '0800',
  premium_rate: 'Tarifado',
  unknown: 'Desconhecido',
};

const lineTypeStatus: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'basic'> = {
  mobile: 'success',
  landline: 'info',
  voip: 'warning',
  toll_free: 'basic',
  premium_rate: 'danger',
  unknown: 'basic',
};

interface Props {
  info: CallerInfo;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text category="c1" appearance="hint" style={styles.label}>
        {label}
      </Text>
      <Text category="s2">{value}</Text>
    </View>
  );
}

export function CallerInfoCard({ info }: Props) {
  return (
    <Card style={styles.card} status={info.isSpam ? 'danger' : 'basic'}>
      <View style={styles.header}>
        <Text category="h6" style={styles.number}>
          {info.formatted ?? info.number}
        </Text>
        {info.lineType && (
          <Tag status={lineTypeStatus[info.lineType]}>
            {lineTypeLabel[info.lineType]}
          </Tag>
        )}
      </View>

      {info.isSpam && (
        <View style={styles.spamBanner}>
          <Text category="s1" status="danger">
            ⚠️ Possível spam ({info.spamReports} relatos)
          </Text>
        </View>
      )}

      <Divider style={styles.divider} />

      <Row label="País" value={info.countryName} />
      <Row label="Código" value={info.countryCode} />
      <Row label="Localização" value={info.location} />
      <Row label="Operadora" value={info.carrier} />
      <Row label="Número válido" value={info.valid ? '✓ Sim' : '✗ Não'} />
      <Row label="Fonte" value={info.provider} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  number: { flex: 1 },
  spamBanner: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  divider: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: { flex: 1 },
});

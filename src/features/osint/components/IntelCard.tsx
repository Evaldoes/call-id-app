import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from '@ui-kitten/components';
import type { OsintReport } from '../services/osint.service';

interface Props {
  report: OsintReport;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text category="c1" appearance="hint" style={styles.label}>
        {label}
      </Text>
      <Text category="s2" style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

export function IntelCard({ report }: Props) {
  const { callerInfo, anatel } = report;
  return (
    <Card style={styles.card}>
      <Text category="s1" style={styles.title}>
        Inteligência do Número
      </Text>
      <Divider style={styles.divider} />

      <Row label="Número formatado" value={callerInfo.formatted} />
      <Row label="País" value={callerInfo.countryName} />
      <Row label="Localização" value={callerInfo.location} />
      <Row
        label="Estado"
        value={callerInfo.state && callerInfo.uf ? `${callerInfo.state} (${callerInfo.uf})` : callerInfo.state ?? callerInfo.uf}
      />
      <Row label="Região" value={callerInfo.region} />
      <Row label="Fuso horário" value={callerInfo.utcOffset} />
      <Row label="Operadora (API)" value={callerInfo.carrier} />
      <Row label="Operadora (Anatel)" value={anatel?.operator} />
      <Row
        label="Operadora (estimativa)"
        value={callerInfo.estimatedCarrier && !callerInfo.carrier && !anatel?.operator ? callerInfo.estimatedCarrier : null}
      />
      <Row
        label="Portabilidade"
        value={anatel?.portedFrom ? `Veio de: ${anatel.portedFrom}` : null}
      />
      <Row
        label="Tipo de linha"
        value={
          callerInfo.lineType
            ? {
                mobile: 'Celular',
                landline: 'Fixo',
                voip: 'VoIP',
                toll_free: '0800',
                premium_rate: 'Tarifado',
                unknown: 'Desconhecido',
              }[callerInfo.lineType]
            : null
        }
      />
      <Row label="Número válido" value={callerInfo.valid ? '✓ Sim' : '✗ Não'} />
      <Row label="Fonte de dados" value={callerInfo.provider} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  title: { marginBottom: 4 },
  divider: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  label: { flex: 1 },
  value: { flex: 1, textAlign: 'right' },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from '@ui-kitten/components';
import type { SpamResult } from '../services/spam.service';

interface Props {
  spam: SpamResult;
}

const confidenceLabel = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const confidenceColor = { low: '#00E096', medium: '#FFAA00', high: '#FF3D71' };

export function SpamCard({ spam }: Props) {
  return (
    <Card style={styles.card}>
      <Text category="s1" style={styles.title}>
        Análise de Spam
      </Text>
      <Divider style={styles.divider} />

      <View style={styles.row}>
        <Text category="c1" appearance="hint">Classificação</Text>
        <Text category="s2" status={spam.isSpam ? 'danger' : 'success'}>
          {spam.isSpam ? 'Spam / Indesejado' : 'Sem indícios de spam'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text category="c1" appearance="hint">Confiança</Text>
        <Text category="s2" style={{ color: confidenceColor[spam.confidence] }}>
          {confidenceLabel[spam.confidence]}
        </Text>
      </View>

      {spam.reports !== undefined && (
        <View style={styles.row}>
          <Text category="c1" appearance="hint">Relatos comunidade</Text>
          <Text category="s2">{spam.reports}</Text>
        </View>
      )}

      {spam.reasons.length > 0 && (
        <View style={styles.reasons}>
          <Text category="c1" appearance="hint" style={styles.reasonsTitle}>
            Motivos detectados
          </Text>
          {spam.reasons.map((r, i) => (
            <Text key={i} category="c1" style={styles.reason}>
              • {r}
            </Text>
          ))}
        </View>
      )}
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
    alignItems: 'center',
    paddingVertical: 4,
  },
  reasons: { marginTop: 12 },
  reasonsTitle: { marginBottom: 4 },
  reason: { marginLeft: 4, marginVertical: 2 },
});

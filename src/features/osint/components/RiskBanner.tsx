import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import type { RiskLevel } from '../services/osint.service';

const config: Record<RiskLevel, { emoji: string; label: string; color: string; bg: string }> = {
  safe:       { emoji: '✅', label: 'Seguro',     color: '#00E096', bg: 'rgba(0,224,150,0.12)' },
  unknown:    { emoji: '❓', label: 'Desconhecido', color: '#8F9BB3', bg: 'rgba(143,155,179,0.12)' },
  suspicious: { emoji: '⚠️', label: 'Suspeito',   color: '#FFAA00', bg: 'rgba(255,170,0,0.12)' },
  dangerous:  { emoji: '🚨', label: 'Spam/Golpe', color: '#FF3D71', bg: 'rgba(255,61,113,0.12)' },
};

interface Props {
  level: RiskLevel;
  score: number;
}

export function RiskBanner({ level, score }: Props) {
  const { emoji, label, color, bg } = config[level];
  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.emoji]}>{emoji}</Text>
      <View style={styles.text}>
        <Text category="s1" style={{ color }}>
          {label}
        </Text>
        <Text category="c1" appearance="hint">
          Score de risco: {score}/100
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  emoji: { fontSize: 28, marginRight: 12 },
  text: { flex: 1 },
});

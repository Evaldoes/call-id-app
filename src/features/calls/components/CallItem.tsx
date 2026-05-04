import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from '@ui-kitten/components';
import { Tag } from '../../../shared/components/Tag';
import type { CallRecord } from '../../../types';
import { formatDisplayNumber } from '../../../shared/utils/phone.utils';

interface Props {
  record: CallRecord;
  onPress: (record: CallRecord) => void;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function CallItem({ record, onPress }: Props) {
  const info = record.callerInfo;

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(record)}>
      <View style={styles.iconWrapper}>
        <Icon
          name={
            record.type === 'missed'
              ? 'phone-missed-outline'
              : 'phone-call-outline'
          }
          fill={record.type === 'missed' ? '#FF3D71' : '#00E096'}
          style={styles.icon}
        />
      </View>

      <View style={styles.info}>
        <Text category="s1">
          {info?.formatted ?? formatDisplayNumber(record.number)}
        </Text>
        {info?.carrier && (
          <Text category="c1" appearance="hint">
            {info.carrier}
            {info.location ? ` · ${info.location}` : ''}
          </Text>
        )}
        <Text category="c1" appearance="hint">
          {formatDate(record.timestamp)} às {formatTime(record.timestamp)}
        </Text>
      </View>

      <View style={styles.tags}>
        {info?.lineType && info.lineType !== 'unknown' && (
          <Tag status={info.lineType === 'mobile' ? 'success' : 'info'}>
            {info.lineType === 'mobile' ? 'Celular' : 'Fixo'}
          </Tag>
        )}
        {info?.isSpam && (
          <Tag status="danger" style={{ marginTop: 4 }}>
            Spam
          </Tag>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  iconWrapper: { width: 40, alignItems: 'center' },
  icon: { width: 24, height: 24 },
  info: { flex: 1, marginLeft: 12 },
  tags: { alignItems: 'flex-end' },
});

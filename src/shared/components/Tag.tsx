import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@ui-kitten/components';

type Status = 'success' | 'info' | 'warning' | 'danger' | 'basic';

const colors: Record<Status, { bg: string; text: string }> = {
  success: { bg: 'rgba(0, 224, 150, 0.2)', text: '#00E096' },
  info: { bg: 'rgba(0, 149, 255, 0.2)', text: '#0095FF' },
  warning: { bg: 'rgba(255, 170, 0, 0.2)', text: '#FFAA00' },
  danger: { bg: 'rgba(255, 61, 113, 0.2)', text: '#FF3D71' },
  basic: { bg: 'rgba(143, 155, 179, 0.2)', text: '#8F9BB3' },
};

interface Props {
  status?: Status;
  children: string;
  style?: ViewStyle;
}

export function Tag({ status = 'basic', children, style }: Props) {
  const { bg, text } = colors[status];
  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      <Text category="c2" style={{ color: text }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});

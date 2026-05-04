import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spinner } from '@ui-kitten/components';

interface Props {
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
}

export function LoadingSpinner({ size = 'medium' }: Props) {
  return (
    <View style={styles.container}>
      <Spinner size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Input,
  Button,
  Text,
  Icon,
  IconElement,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLookup } from '../hooks/useLookup';
import { CallerInfoCard } from '../components/CallerInfoCard';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

const SearchIcon = (props: object): IconElement => (
  <Icon {...props} name="search-outline" />
);

export function LookupScreen() {
  const [number, setNumber] = useState('');
  const { result, status, error, lookup, reset } = useLookup();
  const insets = useSafeAreaInsets();

  function handleSearch() {
    lookup(number);
  }

  function handleClear() {
    setNumber('');
    reset();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text category="h5" style={styles.title}>
          Consultar Número
        </Text>

        <Input
          style={styles.input}
          value={number}
          onChangeText={setNumber}
          placeholder="+55 11 99999-9999"
          keyboardType="phone-pad"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          accessoryRight={number ? (props) => (
            <Icon {...props} name="close-outline" onPress={handleClear} />
          ) : undefined}
        />

        <Button
          style={styles.button}
          onPress={handleSearch}
          disabled={status === 'loading' || !number.trim()}
          accessoryLeft={SearchIcon}>
          Buscar
        </Button>

        {status === 'loading' && <LoadingSpinner />}

        {status === 'error' && (
          <Text status="danger" style={styles.error}>
            {error}
          </Text>
        )}

        {status === 'success' && result && (
          <CallerInfoCard info={result} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16 },
  title: { marginBottom: 16 },
  input: { marginBottom: 12 },
  button: { marginBottom: 16 },
  error: { textAlign: 'center', marginTop: 8 },
});

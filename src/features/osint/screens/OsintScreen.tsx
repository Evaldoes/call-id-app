import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Input,
  Button,
  Text,
  Icon,
  IconElement,
  Divider,
  TopNavigation,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOsint } from '../hooks/useOsint';
import { RiskBanner } from '../components/RiskBanner';
import { SpamCard } from '../components/SpamCard';
import { SocialPresenceCard } from '../components/SocialPresenceCard';
import { IntelCard } from '../components/IntelCard';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

const SearchIcon = (props: object): IconElement => (
  <Icon {...props} name="shield-outline" />
);

export function OsintScreen() {
  const [number, setNumber] = useState('');
  const { report, status, error, analyze, reset } = useOsint();
  const insets = useSafeAreaInsets();

  function handleAnalyze() {
    analyze(number);
  }

  function handleClear() {
    setNumber('');
    reset();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <TopNavigation title="Análise OSINT" />
        <Divider />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: insets.bottom + 16 },
          ]}
          keyboardShouldPersistTaps="handled">

          <Text category="c1" appearance="hint" style={styles.subtitle}>
            Inteligência de fonte aberta: operadora, spam, presença online e análise de risco
          </Text>

          <Input
            style={styles.input}
            value={number}
            onChangeText={setNumber}
            placeholder="+55 11 99999-9999"
            keyboardType="phone-pad"
            onSubmitEditing={handleAnalyze}
            returnKeyType="search"
            accessoryRight={
              number
                ? (props) => (
                    <Icon
                      {...props}
                      name="close-outline"
                      onPress={handleClear}
                    />
                  )
                : undefined
            }
          />

          <Button
            style={styles.button}
            status="warning"
            onPress={handleAnalyze}
            disabled={status === 'loading' || !number.trim()}
            accessoryLeft={SearchIcon}>
            Analisar Número
          </Button>

          {status === 'loading' && (
            <View style={styles.loading}>
              <LoadingSpinner />
              <Text category="c1" appearance="hint" style={styles.loadingText}>
                Consultando fontes abertas...
              </Text>
            </View>
          )}

          {status === 'error' && (
            <Text status="danger" style={styles.error}>
              {error}
            </Text>
          )}

          {status === 'success' && report && (
            <>
              <RiskBanner level={report.riskLevel} score={report.spam.score} />

              <Text category="c1" appearance="hint" style={styles.summary}>
                {report.summary}
              </Text>

              <IntelCard report={report} />
              <SpamCard spam={report.spam} />
              <SocialPresenceCard rawNumber={number} />

              <Text category="c2" appearance="hint" style={styles.footer}>
                Gerado em{' '}
                {new Date(report.generatedAt).toLocaleString('pt-BR')}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16 },
  subtitle: { marginBottom: 12, lineHeight: 18 },
  input: { marginBottom: 12 },
  button: { marginBottom: 16 },
  loading: { alignItems: 'center', gap: 8 },
  loadingText: { textAlign: 'center' },
  error: { textAlign: 'center', marginTop: 8 },
  summary: { marginBottom: 12, lineHeight: 18 },
  footer: { textAlign: 'center', marginTop: 16 },
});

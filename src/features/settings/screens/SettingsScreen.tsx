import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import {
  Text,
  Input,
  Toggle,
  Button,
  Divider,
  TopNavigation,
  Icon,
  IconElement,
  Card,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settings.store';
import { usePermissions } from '../../../shared/hooks/usePermissions';

const ExternalIcon = (props: object): IconElement => (
  <Icon {...props} name="external-link-outline" />
);

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const store = useSettingsStore();
  const { permissions, requestAll } = usePermissions();

  const [numverify, setNumverify] = useState(store.numverifyKey);
  const [abstractApi, setAbstractApi] = useState(store.abstractApiKey);
  const [showNumverify, setShowNumverify] = useState(false);
  const [showAbstract, setShowAbstract] = useState(false);

  function save() {
    store.setNumverifyKey(numverify.trim());
    store.setAbstractApiKey(abstractApi.trim());
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopNavigation title="Configurações" />
      <Divider />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Permissões */}
        <Text category="s2" appearance="hint" style={styles.section}>
          PERMISSÕES
        </Text>
        <Card style={styles.card}>
          <PermRow
            label="Estado do telefone"
            granted={permissions.phoneState}
          />
          <PermRow label="Log de chamadas" granted={permissions.callLog} />
          <PermRow label="Notificações" granted={permissions.notifications} />
          {!permissions.allGranted && (
            <Button
              size="small"
              style={styles.permBtn}
              onPress={requestAll}>
              Conceder permissões
            </Button>
          )}
        </Card>

        {/* Comportamento */}
        <Text category="s2" appearance="hint" style={styles.section}>
          COMPORTAMENTO
        </Text>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text category="s1">Consulta automática</Text>
              <Text category="c1" appearance="hint">
                Busca info ao receber chamada
              </Text>
            </View>
            <Toggle
              checked={store.enableAutoLookup}
              onChange={store.setEnableAutoLookup}
            />
          </View>
          <Divider style={styles.rowDivider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text category="s1">Notificações</Text>
              <Text category="c1" appearance="hint">
                Mostrar info da chamada
              </Text>
            </View>
            <Toggle
              checked={store.enableNotifications}
              onChange={store.setEnableNotifications}
            />
          </View>
        </Card>

        {/* APIs */}
        <Text category="s2" appearance="hint" style={styles.section}>
          CHAVES DE API (opcionais)
        </Text>
        <Card style={styles.card}>
          <Text category="c1" appearance="hint" style={styles.apiHint}>
            Sem chave, apenas dados locais (país, formato). Com chave, obtém
            operadora, tipo de linha e localização.
          </Text>

          <Input
            style={styles.input}
            label="NumVerify API Key"
            placeholder="Cole sua chave aqui"
            value={numverify}
            onChangeText={setNumverify}
            secureTextEntry={!showNumverify}
            caption="apilayer.com · 250 consultas grátis/mês"
            accessoryRight={(props) => (
              <Icon
                {...props}
                name={showNumverify ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowNumverify((v) => !v)}
              />
            )}
          />

          <Input
            style={styles.input}
            label="Abstract Phone API Key"
            placeholder="Cole sua chave aqui"
            value={abstractApi}
            onChangeText={setAbstractApi}
            secureTextEntry={!showAbstract}
            caption="abstractapi.com · 250 consultas grátis/mês"
            accessoryRight={(props) => (
              <Icon
                {...props}
                name={showAbstract ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowAbstract((v) => !v)}
              />
            )}
          />

          <Button
            style={styles.saveBtn}
            size="small"
            onPress={save}>
            Salvar chaves
          </Button>
        </Card>

        {/* Links */}
        <Text category="s2" appearance="hint" style={styles.section}>
          OBTER CHAVES GRATUITAS
        </Text>
        <Card style={styles.card}>
          <Button
            appearance="ghost"
            size="small"
            accessoryRight={ExternalIcon}
            onPress={() => Linking.openURL('https://apilayer.com/marketplace/number_verification-api')}>
            NumVerify (apilayer.com)
          </Button>
          <Button
            appearance="ghost"
            size="small"
            accessoryRight={ExternalIcon}
            onPress={() => Linking.openURL('https://app.abstractapi.com/users/signup')}>
            Abstract Phone API
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
}

function PermRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <View style={styles.permRow}>
      <Text category="s2" style={styles.permLabel}>
        {label}
      </Text>
      <Text category="c1" status={granted ? 'success' : 'danger'}>
        {granted ? '✓ Concedida' : '✗ Negada'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 8 },
  section: { marginTop: 16, marginBottom: 4, marginLeft: 4 },
  card: { marginBottom: 0 },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  permLabel: { flex: 1 },
  permBtn: { marginTop: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: { flex: 1 },
  rowDivider: { marginVertical: 8 },
  apiHint: { marginBottom: 12 },
  input: { marginBottom: 12 },
  saveBtn: { alignSelf: 'flex-end' },
});

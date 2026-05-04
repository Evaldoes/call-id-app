import { useEffect, useRef } from 'react';
import { Platform, NativeModules, DeviceEventEmitter, PermissionsAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import { buildOsintReport } from '../../osint/services/osint.service';
import { useCallsStore } from '../store/calls.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { formatDisplayNumber } from '../../../shared/utils/phone.utils';
import type { CallRecord } from '../../../types';
import type { OsintReport } from '../../osint/services/osint.service';

const CallDetector = NativeModules.CallDetectionManagerAndroid;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useCallMonitor() {
  const { addRecord, updateCallerInfo } = useCallsStore();
  const storeRef = useRef({ addRecord, updateCallerInfo });
  storeRef.current = { addRecord, updateCallerInfo };

  const settingsRef = useRef(useSettingsStore.getState());
  useEffect(() =>
    useSettingsStore.subscribe((s) => { settingsRef.current = s; }),
  []);

  useEffect(() => {
    if (Platform.OS !== 'android' || !CallDetector) return;

    setupNotificationChannel();

    // Solicita permissões e só depois inicia o listener
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ]).then((results) => {
      const granted =
        results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted';
      if (granted) CallDetector.startListener();
    });

    const sub = DeviceEventEmitter.addListener(
      'CallDetectionEvent',
      async (raw: string) => {
        const sep = raw.indexOf('|');
        const event = raw.substring(0, sep);
        const phoneNumber = raw.substring(sep + 1);

        if (event !== 'Incoming' || !phoneNumber) return;

        const id = `${Date.now()}-${phoneNumber}`;
        const record: CallRecord = {
          id,
          number: phoneNumber,
          timestamp: new Date(),
          type: 'incoming',
        };

        storeRef.current.addRecord(record);

        const { enableAutoLookup, enableNotifications, numverifyKey, abstractApiKey } =
          settingsRef.current;

        if (!enableAutoLookup) {
          notifyIncoming(phoneNumber, null, enableNotifications);
          return;
        }

        const osint = await buildOsintReport(phoneNumber, {
          numverifyKey: numverifyKey || undefined,
          abstractApiKey: abstractApiKey || undefined,
        }).catch(() => null);

        if (osint) storeRef.current.updateCallerInfo(id, osint.callerInfo);

        notifyIncoming(phoneNumber, osint, enableNotifications);
      },
    );

    return () => {
      sub.remove();
      CallDetector.stopListener();
    };
  }, []);
}

async function setupNotificationChannel() {
  await Notifications.setNotificationChannelAsync('incoming-calls', {
    name: 'Chamadas recebidas',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
  });
}

function buildNotificationBody(osint: OsintReport | null): string {
  if (!osint) return 'Toque para ver detalhes';

  const parts: string[] = [];
  if (osint.spam.isSpam) parts.push(`⚠️ SPAM (score: ${osint.spam.score})`);
  if (osint.callerInfo.carrier) parts.push(osint.callerInfo.carrier);
  if (osint.callerInfo.location) parts.push(osint.callerInfo.location);

  const riskLabel = {
    safe: '✅ Seguro',
    unknown: '❓ Desconhecido',
    suspicious: '⚠️ Suspeito',
    dangerous: '🚨 Spam/Golpe',
  }[osint.riskLevel];
  parts.push(riskLabel);

  return parts.join(' · ');
}

async function notifyIncoming(
  phoneNumber: string,
  osint: OsintReport | null,
  enabled: boolean,
) {
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📞 ${formatDisplayNumber(phoneNumber)}`,
      body: buildNotificationBody(osint),
      data: { phoneNumber },
    },
    trigger: null,
  });
}

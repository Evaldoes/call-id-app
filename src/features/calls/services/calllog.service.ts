import { NativeModules, PermissionsAndroid } from 'react-native';
import type { CallRecord } from '../../../types';

interface RawCall {
  number: string;
  timestamp: number;
  duration: number;
  type: number; // 1=incoming, 3=missed
}

const INCOMING = 1;
const MISSED   = 3;

export async function ensureCallLogPermission(): Promise<boolean> {
  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ]);
  return (
    result[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === 'granted' &&
    result[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted'
  );
}

export async function fetchCallLog(limit = 500): Promise<CallRecord[]> {
  const granted = await ensureCallLogPermission();
  if (!granted) throw new Error('Permissão READ_CALL_LOG negada');

  const raw: RawCall[] = await NativeModules.CallDetectionManagerAndroid.getCallLog(limit);

  return raw.map((r) => ({
    id: `log-${r.timestamp}-${r.number}`,
    number: r.number,
    timestamp: new Date(r.timestamp),
    type: r.type === MISSED ? 'missed' : 'incoming',
  }));
}

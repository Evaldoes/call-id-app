import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

interface PermissionState {
  phoneState: boolean;
  callLog: boolean;
  notifications: boolean;
  allGranted: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    phoneState: false,
    callLog: false,
    notifications: false,
    allGranted: false,
  });

  async function requestAll() {
    if (Platform.OS !== 'android') return;

    const perms = [
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ] as const;

    const results = await PermissionsAndroid.requestMultiple(perms);

    const phoneState =
      results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted';
    const callLog =
      results[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === 'granted';

    let notifications = false;
    if (Platform.Version >= 33) {
      const notifResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      notifications = notifResult === 'granted';
    } else {
      notifications = true;
    }

    setPermissions({
      phoneState,
      callLog,
      notifications,
      allGranted: phoneState && callLog && notifications,
    });

    return { phoneState, callLog, notifications };
  }

  useEffect(() => {
    requestAll();
  }, []);

  return { permissions, requestAll };
}

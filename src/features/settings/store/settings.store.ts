import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiSettings } from '../../../types';

interface SettingsStore extends ApiSettings {
  setNumverifyKey: (key: string) => void;
  setAbstractApiKey: (key: string) => void;
  setEnableAutoLookup: (val: boolean) => void;
  setEnableNotifications: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      numverifyKey: '',
      abstractApiKey: '',
      enableAutoLookup: true,
      enableNotifications: true,
      setNumverifyKey: (key) => set({ numverifyKey: key }),
      setAbstractApiKey: (key) => set({ abstractApiKey: key }),
      setEnableAutoLookup: (val) => set({ enableAutoLookup: val }),
      setEnableNotifications: (val) => set({ enableNotifications: val }),
    }),
    {
      name: 'caller-id-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CallRecord, CallerInfo } from '../../../types';

interface CallsStore {
  records: CallRecord[];
  addRecord: (record: CallRecord) => void;
  updateCallerInfo: (id: string, info: CallerInfo) => void;
  clearAll: () => void;
}

export const useCallsStore = create<CallsStore>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records].slice(0, 200),
        })),
      updateCallerInfo: (id, info) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, callerInfo: info } : r,
          ),
        })),
      clearAll: () => set({ records: [] }),
    }),
    {
      name: 'caller-id-calls',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

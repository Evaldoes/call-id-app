import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchCallLog } from '../services/calllog.service';
import { useCallsStore } from '../store/calls.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { buildOsintReport } from '../../osint/services/osint.service';

// Roda silenciosamente em background: importa chamadas novas e analisa OSINT
export function useAutoImport() {
  const running = useRef(false);
  const { records, addRecord, updateCallerInfo } = useCallsStore();
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const settingsRef = useRef(useSettingsStore.getState());
  useEffect(() =>
    useSettingsStore.subscribe((s) => { settingsRef.current = s; }),
  []);

  async function run() {
    if (running.current) return;
    running.current = true;
    try {
      const logCalls = await fetchCallLog(500);
      const existingIds = new Set(recordsRef.current.map((r) => r.id));
      const newCalls = logCalls.filter((c) => !existingIds.has(c.id));

      for (const call of newCalls) {
        addRecord(call);

        const { numverifyKey, abstractApiKey } = settingsRef.current;
        const osint = await buildOsintReport(call.number, {
          numverifyKey: numverifyKey || undefined,
          abstractApiKey: abstractApiKey || undefined,
        }).catch(() => null);

        if (osint) updateCallerInfo(call.id, osint.callerInfo);

        // Respeita rate limit das APIs pagas
        if (numverifyKey || abstractApiKey) {
          await delay(300);
        }
      }
    } catch {
      // Falha silenciosa — permissão não concedida ainda ou device sem dados
    } finally {
      running.current = false;
    }
  }

  // Roda ao montar (abertura do app)
  useEffect(() => { run(); }, []);

  // Roda de novo ao voltar para foreground (chamadas novas enquanto estava em background)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, []);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

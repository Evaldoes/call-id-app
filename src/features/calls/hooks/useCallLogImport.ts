import { useState, useCallback } from 'react';
import { fetchCallLog } from '../services/calllog.service';
import { useCallsStore } from '../store/calls.store';
import { useSettingsStore } from '../../settings/store/settings.store';
import { buildOsintReport } from '../../osint/services/osint.service';

export interface ImportProgress {
  total: number;
  done: number;
  current: string;
  running: boolean;
}

const INITIAL: ImportProgress = { total: 0, done: 0, current: '', running: false };

export function useCallLogImport() {
  const [progress, setProgress] = useState<ImportProgress>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  const { records, addRecord, updateCallerInfo } = useCallsStore();
  const { numverifyKey, abstractApiKey } = useSettingsStore();

  const startImport = useCallback(async () => {
    setError(null);
    setProgress({ total: 0, done: 0, current: 'Lendo histórico...', running: true });

    try {
      const logCalls = await fetchCallLog(500);

      // Filtra chamadas que ainda não estão no store
      const existingIds = new Set(records.map((r) => r.id));
      const newCalls = logCalls.filter((c) => !existingIds.has(c.id));

      if (newCalls.length === 0) {
        setProgress({ total: 0, done: 0, current: 'Nenhuma chamada nova.', running: false });
        return;
      }

      // Adiciona todas ao store primeiro (aparecem imediatamente na lista)
      newCalls.forEach((c) => addRecord(c));

      setProgress({ total: newCalls.length, done: 0, current: '', running: true });

      // Roda OSINT sequencialmente para não sobrecarregar as APIs
      for (let i = 0; i < newCalls.length; i++) {
        const call = newCalls[i];
        setProgress({
          total: newCalls.length,
          done: i,
          current: call.number,
          running: true,
        });

        const osint = await buildOsintReport(call.number, {
          numverifyKey: numverifyKey || undefined,
          abstractApiKey: abstractApiKey || undefined,
        }).catch(() => null);

        if (osint) updateCallerInfo(call.id, osint.callerInfo);

        // Pausa entre requests para não estourar rate limit
        if (numverifyKey || abstractApiKey) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      setProgress({
        total: newCalls.length,
        done: newCalls.length,
        current: '',
        running: false,
      });
    } catch (e: any) {
      setError(e.message ?? 'Erro ao importar chamadas');
      setProgress((p) => ({ ...p, running: false }));
    }
  }, [records, numverifyKey, abstractApiKey]);

  const reset = useCallback(() => {
    setProgress(INITIAL);
    setError(null);
  }, []);

  return { progress, error, startImport, reset };
}

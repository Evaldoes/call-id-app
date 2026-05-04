import { useState, useCallback } from 'react';
import { buildOsintReport, OsintReport } from '../services/osint.service';
import { useSettingsStore } from '../../settings/store/settings.store';
import type { LookupStatus } from '../../../types';

export function useOsint() {
  const [report, setReport] = useState<OsintReport | null>(null);
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { numverifyKey, abstractApiKey } = useSettingsStore();

  const analyze = useCallback(
    async (number: string) => {
      if (!number.trim()) return;
      setStatus('loading');
      setError(null);
      try {
        const result = await buildOsintReport(number.trim(), {
          numverifyKey: numverifyKey || undefined,
          abstractApiKey: abstractApiKey || undefined,
        });
        setReport(result);
        setStatus('success');
      } catch {
        setError('Falha ao gerar relatório OSINT');
        setStatus('error');
      }
    },
    [numverifyKey, abstractApiKey],
  );

  const reset = useCallback(() => {
    setReport(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { report, status, error, analyze, reset };
}

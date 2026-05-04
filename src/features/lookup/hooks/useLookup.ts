import { useState, useCallback } from 'react';
import { lookupNumber } from '../services/lookup.service';
import { useSettingsStore } from '../../settings/store/settings.store';
import type { CallerInfo, LookupStatus } from '../../../types';

export function useLookup() {
  const [result, setResult] = useState<CallerInfo | null>(null);
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { numverifyKey, abstractApiKey } = useSettingsStore();

  const lookup = useCallback(
    async (number: string) => {
      if (!number.trim()) return;
      setStatus('loading');
      setError(null);
      try {
        const info = await lookupNumber(number.trim(), {
          numverifyKey: numverifyKey || undefined,
          abstractApiKey: abstractApiKey || undefined,
        });
        setResult(info);
        setStatus('success');
      } catch (e) {
        setError('Falha ao buscar informações do número');
        setStatus('error');
      }
    },
    [numverifyKey, abstractApiKey],
  );

  const reset = useCallback(() => {
    setResult(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { result, status, error, lookup, reset };
}

import { useState, useCallback } from 'react';
import { sendSignal, type CreateSignalResponse } from '../lib/api';
import type { SignalType } from '@sir/shared';

export interface SignalState {
  loading: boolean;
  error: string | null;
  lastResponse: CreateSignalResponse | null;
}

export interface UseSignalsReturn extends SignalState {
  send: (type: SignalType, payload?: Record<string, unknown>) => Promise<CreateSignalResponse | null>;
  clearError: () => void;
}

export function useSignals(): UseSignalsReturn {
  const [state, setState] = useState<SignalState>({
    loading: false,
    error: null,
    lastResponse: null,
  });

  const send = useCallback(
    async (
      type: SignalType,
      payload: Record<string, unknown> = {}
    ): Promise<CreateSignalResponse | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await sendSignal(type, payload);
        setState({ loading: false, error: null, lastResponse: response });
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return { ...state, send, clearError };
}

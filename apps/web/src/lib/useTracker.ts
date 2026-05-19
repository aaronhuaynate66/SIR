'use client';

import { useCallback } from 'react';

export function useTracker() {
  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    void fetch('/api/analytics/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        event_name:  eventName,
        properties:  properties ?? {},
        page_path:   typeof window !== 'undefined' ? window.location.pathname : null,
      }),
    });
  }, []);

  return { track };
}

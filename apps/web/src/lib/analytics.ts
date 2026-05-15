import { sendGAEvent } from 'next/third-parties/google';

export function gtag(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  sendGAEvent('event', event, params ?? {});
}

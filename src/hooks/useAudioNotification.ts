/**
 * useAudioNotification — Web Audio API hook for KDS staff alerts.
 *
 * Modern mobile browsers (iOS Safari, Chrome Android) block audio autoplay
 * until the user has interacted with the page. This hook works around that by:
 *   1. Exposing an `unlock()` function to call inside any user-gesture handler.
 *   2. Playing a silent 1-sample buffer on unlock to satisfy the browser policy.
 *   3. Scheduling all subsequent tones via the already-unlocked AudioContext.
 *
 * Usage:
 *   const { unlock, playNewOrder, playAlert } = useAudioNotification();
 *   // Call unlock() inside an onClick/onKeyDown handler at app startup.
 *   // Call playNewOrder() when new CREATED tasks arrive.
 */
import { useCallback, useRef } from 'react';

type WebKitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function useAudioNotification() {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  /** Must be called inside a user-gesture handler (click, keydown) to unlock audio on mobile. */
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    try {
      const AudioCtx = window.AudioContext ?? (window as WebKitWindow).webkitAudioContext;
      if (!AudioCtx) return;
      ctxRef.current = new AudioCtx();
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
      // Silent 1-sample buffer: required to fully satisfy iOS autoplay policy
      const buf = ctxRef.current.createBuffer(1, 1, 22050);
      const src = ctxRef.current.createBufferSource();
      src.buffer = buf;
      src.connect(ctxRef.current.destination);
      src.start(0);
      unlockedRef.current = true;
    } catch {
      // AudioContext not supported — silent fail, no crashes
    }
  }, []);

  const scheduleNote = useCallback((
    frequency: number,
    startSec: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ) => {
    const ctx = ctxRef.current;
    if (!ctx || !unlockedRef.current) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startSec);
    // Soft attack + exponential decay envelope
    gain.gain.setValueAtTime(0.001, ctx.currentTime + startSec);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startSec + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + duration - 0.01);
    osc.start(ctx.currentTime + startSec);
    osc.stop(ctx.currentTime + startSec + duration);
  }, []);

  /** Two-tone ascending chime: played when a new CREATED kitchen task arrives. */
  const playNewOrder = useCallback(() => {
    scheduleNote(880,  0,    0.35, 'sine', 0.22);
    scheduleNote(1100, 0.38, 0.48, 'sine', 0.18);
  }, [scheduleNote]);

  /** Triple-pulse alert: played for urgent/support events. */
  const playAlert = useCallback(() => {
    scheduleNote(660, 0,    0.22, 'triangle', 0.28);
    scheduleNote(660, 0.30, 0.22, 'triangle', 0.22);
    scheduleNote(660, 0.60, 0.38, 'triangle', 0.22);
  }, [scheduleNote]);

  return { unlock, playNewOrder, playAlert };
}

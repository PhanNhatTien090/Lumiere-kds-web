/**
 * useKitchenSocket — React hook for KDS realtime updates via STOMP/WebSocket
 *
 * Topics (per KITCHEN_UPDATES_FRONTEND.md §1 — no change):
 *   /topic/kitchen/tasks   → KitchenTaskResponse | KitchenTaskResponse[]
 *   /topic/kitchen/batches → KitchenBatchResponse | KitchenBatchResponse[]
 *
 * Backend may publish a single object OR an array — both cases are handled.
 * On each incoming message, the hook upserts into the Zustand store so the UI
 * updates immediately without waiting for the next poll.
 *
 * onConnectionChange is kept in a stable ref so the effect does NOT
 * re-subscribe when the parent component re-renders with a new callback.
 */

import { useEffect, useRef } from 'react';
import type { Client } from '@stomp/stompjs';
import { createStompClient } from '@/lib/websocket';
import { useKdsStore } from '@/store/kdsStore';
import type { KitchenBatchResponse, KitchenTaskResponse } from '@/types';

interface UseKitchenSocketOptions {
  /** Only connect when authenticated */
  enabled: boolean;
  /** Callback when connection state changes (for status indicator) */
  onConnectionChange?: (connected: boolean) => void;
}

export function useKitchenSocket({ enabled, onConnectionChange }: UseKitchenSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const { upsertTask, upsertBatch, setWebSocketConnected } = useKdsStore();

  // Stable ref — keeps the latest callback without triggering re-subscription
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;

  useEffect(() => {
    if (!enabled) return;

    const client = createStompClient();

    client.onConnect = () => {
      setWebSocketConnected(true);
      onConnectionChangeRef.current?.(true);

      // ── Subscribe: kitchen tasks ──────────────────────────────────────────
      // Payload: single KitchenTaskResponse OR KitchenTaskResponse[]
      client.subscribe('/topic/kitchen/tasks', (message) => {
        try {
          const payload: KitchenTaskResponse | KitchenTaskResponse[] = JSON.parse(message.body);
          const tasks = Array.isArray(payload) ? payload : [payload];
          tasks.forEach((task) => upsertTask(task));
        } catch (e) {
          console.error('[STOMP] Failed to parse /topic/kitchen/tasks', e);
        }
      });

      // ── Subscribe: kitchen batches ────────────────────────────────────────
      // Payload: single KitchenBatchResponse OR KitchenBatchResponse[]
      client.subscribe('/topic/kitchen/batches', (message) => {
        try {
          const payload: KitchenBatchResponse | KitchenBatchResponse[] = JSON.parse(message.body);
          const batches = Array.isArray(payload) ? payload : [payload];
          batches.forEach((batch) => upsertBatch(batch));
        } catch (e) {
          console.error('[STOMP] Failed to parse /topic/kitchen/batches', e);
        }
      });
    };

    client.onDisconnect = () => {
      setWebSocketConnected(false);
      onConnectionChangeRef.current?.(false);
    };

    client.activate();
    clientRef.current = client;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const c = clientRef.current;
        if (c && !c.connected) {
          c.activate();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      client.deactivate();
      clientRef.current = null;
      setWebSocketConnected(false);
    };
  // onConnectionChange intentionally excluded — using stable ref above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, upsertBatch, upsertTask, setWebSocketConnected]);

  return clientRef;
}

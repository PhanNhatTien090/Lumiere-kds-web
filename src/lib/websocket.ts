/**
 * KDS WebSocket client — STOMP over SockJS
 *
 * Backend config (WebSocketConfig.java):
 *   endpoint:   /ws  (SockJS fallback enabled)
 *   broker:     /topic
 *   app prefix: /app
 *   auth:       permitAll — no JWT needed for handshake
 *
 * Topics for KITCHEN:
 *   /topic/kitchen/tasks   — task created / status changed
 *   /topic/kitchen/batches — batch suggested / status changed
 */

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Backend WS URL (SockJS endpoint, NOT the raw ws:// protocol)
const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws';

/**
 * Create a shared STOMP client.
 * The socket endpoint is permitAll — no JWT in handshake required.
 */
export function createStompClient(): Client {
  return new Client({
    // SockJS handles transport negotiation (WebSocket → XHR-streaming → polling)
    webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: (msg) => {
      if (import.meta.env.DEV) console.log('[STOMP]', msg);
    },
    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers['message'], frame.body);
    },
    onDisconnect: () => {
      console.info('[STOMP] Disconnected');
    },
  });
}

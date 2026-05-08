import { useEffect, useRef, useCallback } from "react";
import { useKdsStore } from "@/store/kdsStore";
import { KitchenTaskResponse } from "@/types";
import SockJS from "sockjs-client";
import Stomp, { Client, Frame } from "stompjs";

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

export const useStompWebSocket = () => {
  const { upsertTask, setWebSocketConnected, setError } = useKdsStore();
  const clientRef = useRef<Client | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const socket = new SockJS(WEBSOCKET_URL);
    clientRef.current = Stomp.over(socket);

    // Suppress console logs from stompjs
    clientRef.current.debug = () => {};

    clientRef.current.connect(
      {},
      (_frame?: Frame) => {
        setWebSocketConnected(true);
        reconnectAttempts.current = 0;
        console.log("WebSocket connected");

        // Subscribe to order updates
        clientRef.current?.subscribe("/topic/orders", (message) => {
          try {
            const raw = JSON.parse(message.body) as Partial<KitchenTaskResponse>;
            if (typeof raw.id === "number" && typeof raw.orderItemId === "number" && typeof raw.status === "string") {
              upsertTask(raw as KitchenTaskResponse);
            }
          } catch (error) {
            console.error("Failed to parse order update:", error);
          }
        });
      },
      (_error: string | Frame) => {
        setWebSocketConnected(false);
        console.error("WebSocket connection failed");
        setError("Failed to connect to WebSocket");

        // Auto-reconnect with backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          setTimeout(() => {
            console.log(`Reconnecting in ${backoff}ms...`);
            connect();
          }, backoff);
        }
      }
    );
  }, [setWebSocketConnected, setError, upsertTask]);

  const disconnect = useCallback(() => {
    const client = clientRef.current;
    if (client && client.connected) {
      client.disconnect(() => {
        setWebSocketConnected(false);
        console.log("WebSocket disconnected");
      });
    }
  }, [setWebSocketConnected]);

  const sendMessage = useCallback((destination: string, body: Record<string, unknown>) => {
    const client = clientRef.current;
    if (client && client.connected) {
      client.send(destination, {}, JSON.stringify(body));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { sendMessage, isConnected: clientRef.current?.connected ?? false };
};

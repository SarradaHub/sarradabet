import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

function getSocketUrl(): string {
  const directApiUrl = import.meta.env.VITE_API_URL;
  if (directApiUrl) {
    return directApiUrl;
  }

  const apiGatewayUrl =
    import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";
  return apiGatewayUrl;
}

let sharedSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(getSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  return sharedSocket;
}

export function useSocketEvent<T>(
  event: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}

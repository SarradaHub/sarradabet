import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getApiRootUrl } from "../../services/apiClient";

function getSocketUrl(): string {
  return getApiRootUrl();
}

let sharedSocket: Socket | null = null;
let socketDiagnosticsAttached = false;
let socketToken: string | null = null;

export function setSocketAuthToken(token: string | null): void {
  socketToken = token;

  if (!sharedSocket) {
    return;
  }

  sharedSocket.auth = token ? { token } : {};
  if (token && !sharedSocket.connected) {
    sharedSocket.connect();
  }
}

function attachSocketDiagnostics(socket: Socket): void {
  if (socketDiagnosticsAttached || !import.meta.env.DEV) {
    return;
  }

  socketDiagnosticsAttached = true;

  socket.on("connect_error", (error) => {
    console.warn("[socket.io] connect_error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    if (reason !== "io client disconnect") {
      console.warn("[socket.io] disconnected:", reason);
    }
  });
}

export function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(getSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: socketToken ? { token: socketToken } : undefined,
    });
    attachSocketDiagnostics(sharedSocket);
  } else if (socketToken) {
    sharedSocket.auth = { token: socketToken };
    if (!sharedSocket.connected) {
      sharedSocket.connect();
    }
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

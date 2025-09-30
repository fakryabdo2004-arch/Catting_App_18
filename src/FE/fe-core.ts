
import { io, type Socket } from "socket.io-client";

export const getSocketUrl = (): string => process.env.SOCKET_URL || "http://localhost:3000";

let socket: Socket | null = null;
export const connectBE = (): Socket => {
  if (socket && socket.connected) return socket;
  socket = io(getSocketUrl(), { transports: ["websocket"], withCredentials: true, autoConnect: true });
  return socket;
};
export const getSocket = (): Socket => {
  if (!socket) throw new Error("Socket not initialized. Call connectBE() first.");
  return socket;
};
export const ensureConnection = (): Socket => connectBE();

export const bindConnectEvents = (onConnect?: (id: string) => void, onDisconnect?: () => void): Socket => {
  const s = ensureConnection();
  s.on("connect", () => onConnect?.(s.id!));
  s.on("disconnect", () => onDisconnect?.());
  return s;
};

export const connectNamespace = (ns: string): Socket => io(`${getSocketUrl()}${ns}`, { transports: ["websocket"], withCredentials: true });

export const emitWithAck = async <TPayload, TResponse>(event: string, payload: TPayload, timeoutMs = 5000): Promise<TResponse> => {
  const s = ensureConnection();
  return new Promise<TResponse>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Ack timeout")), timeoutMs);
    s.timeout(timeoutMs).emit(event, payload, (err: unknown, res: TResponse) => {
      clearTimeout(timer);
      if (err) return reject(err);
      resolve(res);
    });
  });
};

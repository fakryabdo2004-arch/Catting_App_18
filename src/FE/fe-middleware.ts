


import type { Socket } from "socket.io-client";
import { ensureConnection } from "./fe-core";

export const withHandshakeAuth = (meta: Record<string, unknown>): Socket => {
  const s = ensureConnection();
 
  s.io.opts.auth = { ...(s.io.opts?.auth || {}), ...meta };
  s.disconnect().connect();
  return s;
};

export const bindGlobalErrors = (handlers: { connectError?: (err: Error) => void; error?: (err: unknown) => void; }): Socket => {
  const s = ensureConnection();
  if (handlers.connectError) s.on("connect_error", handlers.connectError);
  if (handlers.error) s.on("error", handlers.error as any);
  return s;
};

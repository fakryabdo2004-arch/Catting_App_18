


import type { Socket } from "socket.io-client";
import { ensureConnection } from "./fe-core";

export type Handler = (payload: unknown) => void;
const registry = new Map<string, Handler[]>();
export const on = (event: string, handler: Handler) => {
  const arr = registry.get(event) || [];
  arr.push(handler); registry.set(event, arr);
};
export const off = (event: string, handler: Handler) => {
  const arr = registry.get(event) || [];
  registry.set(event, arr.filter(h => h !== handler));
};
export const dispatch = (event: string, payload: unknown) => { for (const fn of registry.get(event) || []) fn(payload); };


export const bindChatGateway = (): Socket => {
  const s = ensureConnection();
  s.on("chat:message", (msg) => dispatch("chat:message", msg));
  s.on("chat:typing", (t) => dispatch("chat:typing", t));
  return s;
};


export const sendTyping = (chatId: string, userId: string) => {
  ensureConnection().emit("chat:typing", { chatId, userId });
};


export type SendMessageInput = { chatId: string; text: string; attachments?: string[] };
export const sendMessage = async (input: SendMessageInput) => {
  return new Promise<{ ok: true; messageId: string }>((resolve, reject) => {
    const s = ensureConnection();
    s.timeout(5000).emit("chat:send", input, (err: unknown, res: { ok: true; messageId: string }) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};


const recent: Array<{ at: number; event: string; data?: unknown }> = [];
export const recapPush = (event: string, data?: unknown) => { recent.push({ at: Date.now(), event, data }); if (recent.length > 200) recent.shift(); };
export const recapList = () => [...recent];

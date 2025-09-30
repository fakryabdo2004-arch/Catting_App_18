


import { ensureConnection } from "./fe-core";

export type Room = { id: string; name?: string; memberCount?: number };

export const joinRoomOVM = async (roomId: string) => {
  return new Promise<{ ok: true }>((resolve, reject) => {
    const s = ensureConnection();
    s.timeout(5000).emit("room:join", { roomId }, (err: unknown, res: { ok: true }) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

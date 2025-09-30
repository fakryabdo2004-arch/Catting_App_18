

import { ensureConnection } from "./fe-core";

export const createChattingGroup = async (name: string, members: string[]) => {
  return new Promise<{ ok: true; groupId: string }>((resolve, reject) => {
    const s = ensureConnection();
    s.timeout(5000).emit("group:create", { name, members }, (err: unknown, res: { ok: true; groupId: string }) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};


export const fetchProfileGroupsREST = async (userId: string) => {
  const res = await fetch(`/api/users/${userId}/groups`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
};
export const getChattingGroup = async (groupId: string) => {
  const res = await fetch(`/api/groups/${groupId}`);
  if (!res.ok) throw new Error("Failed to fetch group");
  return res.json();
};
export const integrateGroupsFE = (groups: any[]) => groups.map(g => ({ id: g.id, name: g.name, members: g.members?.length || 0 }));


export const sendGroupMessage = (groupId: string, text: string) => ensureConnection().emit("group:message", { groupId, text });
export const bindGroupMessages = (onMessage: (m: any) => void) => {
  const s = ensureConnection();
  s.on("group:message", onMessage);
  return () => s.off("group:message", onMessage);
};


const PING_KEY = "GROUP_TAB_PING";
export const pingTabs = () => localStorage.setItem(PING_KEY, String(Date.now()));
export const listenTabPings = (fn: () => void) => window.addEventListener("storage", (e) => { if (e.key === PING_KEY) fn(); });

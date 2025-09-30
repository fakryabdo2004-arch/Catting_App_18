
import { ensureConnection } from "./fe-core";

export const postThenNotify = async <T>(url: string, body: T, notifyEvent: string) => {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("REST POST failed");
  const data = await res.json();
  ensureConnection().emit(notifyEvent, data);
  return data;
};

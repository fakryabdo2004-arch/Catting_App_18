
import { withHandshakeAuth } from "./fe-middleware";


let token: string | null = null;
export const setToken = (t: string) => (token = t);
export const getToken = () => token;
export const clearToken = () => (token = null);


export const applyAuthToken = (t: string) => withHandshakeAuth({ token: t });


const connected = new Set<string>();
export const addSocket = (id: string) => connected.add(id);
export const removeSocket = (id: string) => connected.delete(id);
export const listSockets = () => Array.from(connected);


const LOGOUT_KEY = "APP_LOGOUT_BROADCAST";
export const broadcastLogout = () => localStorage.setItem(LOGOUT_KEY, String(Date.now()));
export const listenLogout = (onLogout: () => void) => window.addEventListener("storage", (e) => { if (e.key === LOGOUT_KEY) onLogout(); });

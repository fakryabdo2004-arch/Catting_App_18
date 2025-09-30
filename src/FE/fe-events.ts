

import { ensureConnection } from "./fe-core";

export const emit = <T>(event: string, payload: T) => ensureConnection().emit(event, payload);


export const requestBroadcast = <T>(channel: string, payload: T) => emit("broadcast:request", { channel, payload });
export const requestGlobalEmit = <T>(event: string, payload: T) => emit("io:emit:request", { event, payload });
export const requestEmitToSocket = <T>(socketId: string, event: string, payload: T) => emit("socket:to:emit:request", { socketId, event, payload });
export const requestEmitExceptSelf = <T>(event: string, payload: T) => emit("socket:except:emit:request", { event, payload });

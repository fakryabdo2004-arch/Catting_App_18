


export type Chat = { id: string; name?: string; members: string[]; };
export type Message = { id: string; chatId: string; authorId: string; text: string; at: number; attachments?: string[]; };


const chats = new Map<string, Chat>();
const messages = new Map<string, Message[]>();

export const upsertChat = (chat: Chat) => chats.set(chat.id, chat);
export const getChat = (id: string) => chats.get(id) || null;


export const addMessage = (m: Message) => {
  const arr = messages.get(m.chatId) || [];
  arr.push(m); messages.set(m.chatId, arr);
};
export const getMessages = (chatId: string, limit = 50, cursor?: string) => {
  const arr = messages.get(chatId) || [];
  const start = cursor ? Math.max(0, arr.findIndex(m => m.id === cursor) - limit) : Math.max(0, arr.length - limit);
  return { items: arr.slice(start, start + limit), nextCursor: arr[start]?.id };
};


export const selectChat = (chatId: string) => ({ id: chatId, members: [] });
export const sendMessageOVO = (chatId: string, text: string, attachments?: string[]) => Promise.resolve({ ok: true, messageId: crypto.randomUUID?.() || String(Date.now()) });
export const bindReceiveMessageOVO = (onReceive?: (msg: any) => void) => {
 
  return () => {};
};
export const paginateChatOVO = (chatId: string, pageSize = 30, cursor?: string) => getMessages(chatId, pageSize, cursor);

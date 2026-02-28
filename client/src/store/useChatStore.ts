import { create } from "zustand";
import io from "socket.io-client";

const ENDPOINT = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface ChatStore {
    selectedChat: any;
    setSelectedChat: (chat: any) => void;
    user: any;
    setUser: (user: any) => void;
    notification: any[];
    setNotification: (notifs: any[] | ((prev: any[]) => any[])) => void;
    chats: any[];
    setChats: (chats: any[] | ((prev: any[]) => any[])) => void;
    socket: any;
    onlineUsers: Record<string, { isOnline: boolean, lastSeen?: string }>;
    setOnlineUsers: (users: any | ((prev: any) => any)) => void;
    initSocket: (userInfo: any) => void;
    updateChatPreview: (message: any) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    selectedChat: null,
    setSelectedChat: (chat) => set({ selectedChat: chat }),
    user: null,
    setUser: (user) => set({ user }),
    notification: [],
    setNotification: (notification) => {
        if (typeof notification === "function") {
            set((state) => ({ notification: notification(state.notification) }));
        } else {
            set({ notification });
        }
    },
    chats: [],
    setChats: (chats) => {
        if (typeof chats === "function") {
            set((state) => ({ chats: chats(state.chats) }));
        } else {
            set({ chats });
        }
    },
    updateChatPreview: (message) => {
        const { chats } = get();
        if (!chats) return;

        const updatedChats = chats.map((chat) =>
            chat._id === message.chat._id
                ? { ...chat, latestMessage: message, updatedAt: new Date().toISOString() }
                : chat
        );
        set({ chats: updatedChats });
    },
    socket: null,
    onlineUsers: {},
    setOnlineUsers: (onlineUsers) => {
        if (typeof onlineUsers === "function") {
            set((state) => ({ onlineUsers: onlineUsers(state.onlineUsers) }));
        } else {
            set({ onlineUsers });
        }
    },
    initSocket: (userInfo) => {
        const currentSocket = get().socket;
        if (currentSocket) return;

        const newSocket = io(ENDPOINT, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.emit("setup", userInfo);

        newSocket.on("online users list", (users: string[]) => {
            const presenceMap: any = {};
            users.forEach(id => {
                presenceMap[id] = { isOnline: true };
            });
            set({ onlineUsers: presenceMap });
        });

        newSocket.on("user presence", (data: any) => {
            get().setOnlineUsers((prev: any) => ({
                ...prev,
                [data.userId]: { isOnline: data.isOnline, lastSeen: data.lastSeen }
            }));

            get().setChats((prevChats: any[]) => prevChats.map(chat => {
                if (chat.isGroupChat) return chat;
                return {
                    ...chat,
                    users: chat.users.map((u: any) =>
                        u._id === data.userId ? { ...u, isOnline: data.isOnline, lastSeen: data.lastSeen } : u
                    )
                };
            }));
        });

        set({ socket: newSocket });
    },
}));

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const ChatContext = createContext<any>(null);

const ENDPOINT = import.meta.env.VITE_API_URL || "http://localhost:5001";
let socket: any;

const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedChat, setSelectedChat] = useState<any>();
    const [user, setUser] = useState<any>();
    const [notification, setNotification] = useState<any[]>([]);
    const [chats, setChats] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<string, { isOnline: boolean, lastSeen?: string }>>({});

    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
        if (userInfo) {
            setUser(userInfo);
            socket = io(ENDPOINT);
            socket.emit("setup", userInfo);

            socket.on("user presence", (data: any) => {
                setOnlineUsers(prev => ({
                    ...prev,
                    [data.userId]: { isOnline: data.isOnline, lastSeen: data.lastSeen }
                }));
            });
        } else {
            navigate("/");
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [navigate]);

    return (
        <ChatContext.Provider
            value={{
                selectedChat,
                setSelectedChat,
                user,
                setUser,
                notification,
                setNotification,
                chats,
                setChats,
                socket,
                onlineUsers,
                setOnlineUsers
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatState = () => {
    return useContext(ChatContext);
};

export default ChatProvider;

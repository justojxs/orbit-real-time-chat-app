import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import messageRoutes from './routes/messageRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import rateLimit from 'express-rate-limit'; // Fixed import to standard
import cookieParser from 'cookie-parser';
import Message from './models/messageModel';
import User from './models/userModel';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Use Redis Adapter for Socket.io Distribution
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis Adapter Connected");
}).catch(err => console.error("Redis Connection Error:", err));

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));

// API Rate Limiting (100 requests per 15 mins)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", async (userData) => {
        if (!userData || !userData._id) return;

        socket.join(userData._id);
        // @ts-ignore
        socket.userId = userData._id;

        try {
            await User.findByIdAndUpdate(userData._id, { isOnline: true });

            // Notify others
            socket.broadcast.emit("user presence", { userId: userData._id, isOnline: true });

            // Send current online users to the new user
            const onlineUsers = await User.find({ isOnline: true }).select('_id');
            const onlineUserIds = onlineUsers.map(u => u._id.toString());
            socket.emit("online users list", onlineUserIds);

            socket.emit("connected");
        } catch (error) {
            console.error("Presence update error:", error);
        }
    });

    socket.on("join chat", async (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);

        // Mark messages as read when joining room
        // Simplified Logic: In production, specific unread messages would be targeted
        // await Message.updateMany({ chat: room }, { $addToSet: { readBy: socket.id } }); // This needs user ID from session context usually
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user: any) => {
            if (user._id == newMessageRecieved.sender._id) return;
            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    // New: Read Receipt Event
    socket.on("read message", async (data) => {
        const { chatId, userId } = data;
        if (!chatId || !userId) return;

        try {
            await Message.updateMany(
                { chat: chatId, sender: { $ne: userId }, readBy: { $ne: userId } },
                { $push: { readBy: userId } }
            );
            // Notify others in the room
            socket.in(chatId).emit("message read", { chatId, userId });
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("disconnect", async () => {
        // @ts-ignore
        const userId = socket.userId;
        if (userId) {
            try {
                const lastSeen = new Date();
                await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
                socket.broadcast.emit("user presence", { userId, isOnline: false, lastSeen });
            } catch (error) {
                console.error("Presence update error:", error);
            }
        }
        console.log("USER DISCONNECTED");
    });
});

if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;


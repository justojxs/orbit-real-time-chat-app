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
import compression from 'compression';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Optional Redis Adapter for Socket.io (only if REDIS_URL is provided)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
});

if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Redis Adapter Connected");
    }).catch(err => console.error("Redis Connection Error (non-fatal):", err));
} else {
    console.log("No REDIS_URL set — running Socket.io without Redis adapter (single instance mode)");
}

connectDB();

app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));

// API Rate Limiting (500 requests per 15 mins per IP)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health check + warm-up endpoint — frontend pings this on page load to wake the server
// Also warms the MongoDB connection pool by running a trivial query
app.get('/health', async (req, res) => {
    try {
        await User.findOne().select('_id').lean().maxTimeMS(3000);
        res.status(200).json({ status: 'ok', ts: Date.now() });
    } catch {
        res.status(200).json({ status: 'degraded', ts: Date.now() });
    }
});

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Track active socket connections for each user to prevent refresh race conditions
const userSockets = new Map<string, Set<string>>();

io.on("connection", (socket) => {
    console.log("Connected to socket.io", socket.id);

    socket.on("setup", async (userData) => {
        if (!userData || !userData._id) return;

        const userId = userData._id;
        socket.join(userId);
        // @ts-ignore
        socket.userId = userId;

        // Add this socket to the user's session set
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        const sessions = userSockets.get(userId);
        const wasOffline = sessions?.size === 0;
        sessions?.add(socket.id);

        try {
            // Run DB operations in parallel for faster socket setup
            const dbOps: Promise<any>[] = [
                // Always fetch online users for new connection
                User.find({ isOnline: true }).select('_id').lean()
            ];

            // Only update presence if this is the first connection
            if (wasOffline) {
                dbOps.push(User.findByIdAndUpdate(userId, { isOnline: true }));
            }

            const [onlineUsers] = await Promise.all(dbOps);

            if (wasOffline) {
                socket.broadcast.emit("user presence", { userId, isOnline: true });
            }

            const onlineUserIds = onlineUsers.map((u: any) => u._id.toString());
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
    socket.on("read message", async (data: any) => {
        const { chatId, userId } = data;
        if (!chatId || !userId) return;

        try {
            await Message.updateMany(
                { chat: chatId, sender: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
            // Notify others in the room
            socket.in(chatId).emit("message read", { chatId, userId });
        } catch (error) {
            console.error(error);
        }
    });

    socket.on("message deleted", (data: any) => {
        socket.in(data.chatId).emit("message deleted", data);
    });

    socket.on("reaction updated", (data: any) => {
        socket.in(data.chatId).emit("reaction updated", data);
    });

    socket.on("disconnect", async () => {
        // @ts-ignore
        const userId = socket.userId;
        if (userId) {
            const sessions = userSockets.get(userId);
            if (sessions) {
                sessions.delete(socket.id);

                // ONLY mark offline if this was the last active session
                if (sessions.size === 0) {
                    userSockets.delete(userId);
                    try {
                        const lastSeen = new Date();
                        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
                        socket.broadcast.emit("user presence", { userId, isOnline: false, lastSeen });
                    } catch (error) {
                        console.error("Disconnect presence error:", error);
                    }
                }
            }
        }
        console.log("USER DISCONNECTED");
    });
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;


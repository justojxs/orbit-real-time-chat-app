import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '', {
            // Connection pool — reuse connections instead of creating new ones per request
            maxPoolSize: 10,
            minPoolSize: 2,
            // Fail fast if DB is unreachable on cold start
            serverSelectionTimeoutMS: 5000,
            // Prevent long-running queries from hanging forever
            socketTimeoutMS: 45000,
            // Faster heartbeat for detecting connection issues
            heartbeatFrequencyMS: 10000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;

# Orbit - Distributed Real-Time Messaging System

Orbit is a high-performance, distributed real-time chat application designed to scale to 10k+ concurrent users. It mimics the architecture of top-tier messaging platforms like WhatsApp or Slack.

## 🚀 Key Features (Resume-Grade)

### Distributed Architecture
- **Horizontal Scaling**: Runs multiple API server instances (`api1`, `api2`) behind an Nginx Load Balancer.
- **Pub/Sub Messaging**: Uses **Redis** and `@socket.io/redis-adapter` to synchronize events across server instances.
- **Load Balancing**: **Nginx** configured with `ip_hash` for sticky sessions (critical for WebSockets).

### Real-Time & Reliability
- **WebSockets**: Powered by Socket.io with automatic fallback to HTTP polling.
- **Offline Delivery**: Messages are persisted in MongoDB and synced when users reconnect.
- **Read Receipts**: Real-time read status updates with double-tick indicators (Check/CheckCheck).
- **Typing Indicators**: Throttled events to reduce network load.
- **Rate Limiting**: API protected by `express-rate-limit` (100 req/15min) to prevent abuse.

### Security
- **JWT Authentication**: Secure Access Token (short-lived) + Refresh Token (HTTP-only cookie) rotation flow.
- **Secure Headers**: `helmet` (suggested) and secure cookie settings.

### Database Optimization
- **Indexing**: MongoDB Compound Indexes (`{ chat: 1, createdAt: -1 }`) for O(1) message history retrieval.

## 🛠 Tech Stack
- **Frontend**: React (Vite), TailwindCSS, Axios
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Atlas/Local)
- **Caching/PubSub**: Redis
- **DevOps**: Docker, Docker Compose, Nginx

## 🏁 How to Run (Distributed Mode)

1. **Prerequisites**: Ensure you have Docker and Docker Compose installed.

2. **Start the Infrastructure**:
   ```bash
   docker-compose up --build
   ```
   This spins up:
   - `nginx` (Load Balancer on port 80/5000)
   - `api1` (Server Instance 1)
   - `api2` (Server Instance 2)
   - `redis` (Message Broker)
   - `mongo` (Database)

3. **Client Setup**:
   The client is configured to connect to `localhost:5000` (which is now Nginx).
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Verify Scaling**:
   Check server logs to see different instances handling socket connections!

## 📂 Project Structure
- `server/models`: Mongoose schemas with indexes.
- `server/controllers`: Business logic (including Refresh Token flow).
- `docker-compose.yml`: Architecture definition.
- `nginx.conf`: Load balancer configuration.

---
*Built by ojasgupta 23cs290*

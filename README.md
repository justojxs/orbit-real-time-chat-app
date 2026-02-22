# Orbit: Scalable Real-Time Messaging Platform

Orbit is a distributed, real-time messaging engine architected to support high-concurrency environments. It leverages Redis Pub/Sub and Socket.io to ensure robust message delivery across horizontally scaled node instances with sub-50ms latency.

## Architecture & Features
- **Real-Time Synchronization**: Maintains consistent multi-tab user "Online/Offline" presence through a stateful socket session counter, eliminating race conditions.
- **NLP Aggregation**: Integrates the Google Gemini 2.5 API for dynamic, context-aware summarization of highly active chat streams and unread threads.
- **Collaborative Whiteboard**: Provides a 100Hz bidirectional synchronized canvas for real-time remote collaboration.
- **Optimized UI**: Built with React, utilizing custom Framer Motion variants for performant, hardware-accelerated animations alongside a responsive CSS grid layout.
- **Media & Payload Handling**: Supports multipart-form data uploads for images, documents, and Opus-encoded voice notes via Cloudinary integration.
- **Data Integrity**: Implements soft-deletion of messages and asynchronous localized optimistic UI updates for emoji reactions to maintain consistency without blocking the main thread.

## Tech Stack
- **Client**: React (Vite), TypeScript, TailwindCSS, Framer Motion
- **Server**: Node.js, Express, Socket.io
- **Data Layer**: MongoDB (Atlas)
- **Infrastructure & Testing**: Redis, Docker, Playwright (E2E), GitHub Actions (CI/CD)

## Local Development

1. Clone the repository and install dependencies sequentially:
   ```bash
   npm install && cd client && npm install && cd ../server && npm install
   ```
2. Provision local environment variables by copying `.env.example` to `.env` in both client and server directories.
3. Boot the development servers concurrently:
   ```bash
   npm run dev
   ```

### Docker Swarm / Distributed Testing
To spin up a production-analogous cluster locally for stress testing:
```bash
docker-compose up --build
```

---
Built by Ojas Gupta (DTU CSE 23/CS/290)
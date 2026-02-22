# Orbit Chat App

Orbit is an ultra-premium, real-time messaging platform built for scale and aesthetic excellence. It features a complete high-fidelity UI, distributed backend architecture, and advanced collaboration features.

![Design Preview](https://via.placeholder.com/800x400?text=Orbit+Chat+Aesthetic)

## ✨ Core Features
- **Modern UI**: Dark-mode first design with glassmorphism and smooth Framer Motion animations.
- **Real-Time Stream**: Low-latency communication powered by Socket.io and Redis.
- **Presence Tracking**: Live online/offline status indicators and "Last Seen" timestamps.
- **Rich Media**: Share images and documents (PDF, Docs, Zips) via Cloudinary.
- **Message Actions**: Soft-delete functionality and emoji reactions.
- **Group Hubs**: Collaborative group spaces with admin controls.

## 🚀 Deployment

### Ready for Vercel
The project is configured for Vercel out of the box. 
1. Push this repository to GitHub.
2. Link the repository to your Vercel project.
3. Configure the environment variables in Vercel settings.

> **Note**: For WebSockets to function in production, it is recommended to host the backend on a platform that supports persistent connections (like Railway, Render, or DigitalOcean) or use a specialized WebSocket provider.

## 🛠 Tech Stack
- **Frontend**: React (Vite), TailwindCSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Atlas)
- **Infrastructure**: Redis, Docker, Nginx (for distributed setup)

## 🏗 Setup & Installation

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up `.env` files using the provided `.env.example` templates.
4. Start the development server:
   ```bash
   npm run dev
   ```

### Distributed Mode (Docker)
Run the entire production-grade cluster locally:
```bash
docker-compose up --build
```

--
Built by Ojas Gupta DTU 23/CS/290
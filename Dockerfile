# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies for both (could be optimized)
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

COPY . .

# Build Client
RUN cd client && npm run build

# Build Server
RUN cd server && npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/dist ./client/dist

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server/dist/index.js"]

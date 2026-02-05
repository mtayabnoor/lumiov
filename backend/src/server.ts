// Import polyfill FIRST before any k8s-related imports
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { k8sService } from './services/kubernetes.service.js';
import { registerWatchResourceHandlers } from './handlers/watch.handler.js';
import { registerExecHandlers } from './handlers/exec.handler.js';
import { registerLogHandlers } from './handlers/logs.handler.js';

const PORT = 3030;

// 1. Initialize Express & HTTP
const app = express();
const serverInstance = createServer(app);

// 2. Initialize Socket.io
const io = new Server(serverInstance, {
  cors: {
    origin: '*', // ⚠️ ALLOW ALL for testing. Change to ["http://localhost:3000"] in prod.
    methods: ['GET', 'POST'],
  },
});

// 3. Initialize Kubernetes Service
// We await this to ensure we don't start the server if K8s config is broken
console.log('Attempting to connect to K8s...');
// Add a timeout or try/catch specifically for this service
await k8sService.initialize();
console.log('K8s connected.');

// 4. Bind Socket Controllers
io.on('connection', (socket) => {
  registerWatchResourceHandlers(socket);
  registerExecHandlers(socket);
  registerLogHandlers(socket);
});

// 5. Basic Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', k8sConnected: true });
});

// 6. Start Server
serverInstance.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Websockets ready`);
});

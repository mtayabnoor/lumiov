import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Service & Handler Imports
import { k8sService } from './services/kubernetes.service.js';
import { registerWatchResourceHandlers } from './handlers/watch.handler.js';
import { registerExecHandlers } from './handlers/exec.handler.js';
import { registerLogHandlers } from './handlers/logs.handler.js';
import { resourceRouter } from './routes/resource.route.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const PORT = process.env.PORT || 3030;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. Setup Express & HTTP
const app = express();
const serverInstance = createServer(app);

// 2. Production-Grade CORS Configuration
// This handles local dev, Electron protocols, and Cloud domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'app://lumiov',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // allow requests with no origin (like mobile apps or curl)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// 3. Apply Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // Protect against large payload attacks
app.use(express.text({ type: ['text/yaml', 'application/x-yaml'] }));

// 4. Initialize Socket.io with the SAME CORS
const io = new Server(serverInstance, {
  cors: corsOptions,
  transports: ['websocket', 'polling'], // Ensure compatibility
});

// 5. API Routes
app.use('/api', resourceRouter);

// Health Check (Includes K8s connectivity status)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    k8sConnected: k8sService.isInitialized,
    timestamp: new Date().toISOString(),
  });
});

// 6. Socket.io Event Registration
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  registerWatchResourceHandlers(socket);
  registerExecHandlers(socket);
  registerLogHandlers(socket);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 7. Graceful Initialization & Start
const bootstrap = async () => {
  console.log('🚀 Starting Lumiov Backend...');

  try {
    // Try to connect to K8s, but don't crash the server if it fails
    // This allows the UI to still load and show a "Setup Kubeconfig" screen
    await k8sService.initialize();
    console.log('✅ Kubernetes Service Initialized');
  } catch (err) {
    console.error('⚠️ Kubernetes Init Failed. Check your Kubeconfig settings.');
  }

  serverInstance.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🛠️  Mode:   ${NODE_ENV}`);
    console.log(`-----------------------------------------------`);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

bootstrap();

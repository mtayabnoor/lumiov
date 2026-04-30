import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import dotenv from 'dotenv';

// Service & Handler Imports
import { k8sService } from './services/kubernetes.service';
import { registerWatchResourceHandlers } from './handlers/watch.handler';
import { registerExecHandlers } from './handlers/exec.handler';
import { registerLogHandlers } from './handlers/logs.handler';
import { registerPortForwardHandlers } from './handlers/portforward.handler';
import { registerAgentHandlers } from './handlers/agent.handler';
import { resourceRouter } from './routes/resource.route';

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
    // Allow requests with no origin (like mobile apps, curl, or file:// in Electron)
    // In packaged Electron apps, origin is 'null' or 'file://' when loading from filesystem
    if (
      !origin ||
      origin === 'null' ||
      origin.startsWith('file://') ||
      allowedOrigins.includes(origin)
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

// Health Check — minimal surface, no internal state exposed
app.get('/health', (_req, res) => {
  // k8sState and lastError are logged server-side; never sent to client
  const k8sReady = k8sService.isInitialized;
  if (!k8sReady) {
    console.log(
      `[health] k8sState=${k8sService.k8sState} lastError=${k8sService.lastError}`,
    );
  }
  res.json({
    status: 'ok',
    k8sConnected: k8sReady,
    k8sState: k8sService.k8sState, // kept for Electron splash-screen state machine
    k8sError: k8sService.lastError, // kept for Electron splash-screen user message
  });
});

// Manual Retry Endpoint
app.post('/api/k8s/retry', async (_req, res) => {
  try {
    await k8sService.retryInitialization();
    res.json({ success: true, state: k8sService.k8sState });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Retry failed';
    res.status(500).json({ success: false, state: k8sService.k8sState, message });
  }
});

// 6. Socket.io Event Registration
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  registerWatchResourceHandlers(socket);
  registerExecHandlers(socket);
  registerLogHandlers(socket);
  registerPortForwardHandlers(socket);
  registerAgentHandlers(socket);

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

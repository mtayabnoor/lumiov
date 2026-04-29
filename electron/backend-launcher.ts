import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_PORT = 3030;

async function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/** Only the env vars the backend process actually needs. Never spread process.env. */
function buildBackendEnv(isDev: boolean): NodeJS.ProcessEnv {
  const allowed: NodeJS.ProcessEnv = {
    PORT: BACKEND_PORT.toString(),
    NODE_ENV: isDev ? 'development' : 'production',
    // Paths needed by the OS / Node resolution
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE, // Windows equivalent of HOME
    HOMEDRIVE: process.env.HOMEDRIVE,
    HOMEPATH: process.env.HOMEPATH,
    SYSTEMROOT: process.env.SYSTEMROOT,
    // Kubeconfig — the only external dependency the backend needs
    KUBECONFIG: process.env.KUBECONFIG,
    // OpenAI key if the user pre-configured it via environment
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
  // Remove undefined keys so child_process doesn't inherit accidental undefined entries
  return Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));
}

export async function launchBackend(isDev: boolean): Promise<ChildProcess> {
  let binPath: string;
  let args: string[];
  let cwd: string;
  const env = buildBackendEnv(isDev);

  if (isDev) {
    // --- DEVELOPMENT MODE ---
    // __dirname is electron/dist/electron/ at runtime
    // Go up to project root, then into backend/
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    cwd = path.join(projectRoot, 'backend');

    if (!fs.existsSync(cwd)) {
      console.warn('⚠️ standard path failed, trying fallback from cwd...');
      cwd = path.resolve(process.cwd(), 'backend');
    }

    // In dev, we can assume the developer has 'node' in their PATH
    binPath = 'node';
    args = ['dist/index.js'];
  } else {
    // --- PRODUCTION MODE ---
    const resourceRoot = path.join(process.resourcesPath, 'backend');
    const distPath = path.join(resourceRoot, 'dist', 'index.js');
    const flatPath = path.join(resourceRoot, 'index.js');

    let entryPoint: string;
    if (fs.existsSync(distPath)) {
      console.log(`Backend found at: ${distPath}`);
      cwd = resourceRoot;
      entryPoint = path.join('dist', 'index.js');
    } else if (fs.existsSync(flatPath)) {
      console.log(`Backend found at: ${flatPath}`);
      cwd = resourceRoot;
      entryPoint = 'index.js';
    } else {
      throw new Error(
        `Could not find index.js in ${resourceRoot} or ${resourceRoot}/dist`,
      );
    }

    // 🔴 CRITICAL FIX FOR PRODUCTION 🔴
    // Users don't have "node" installed. We must use the Electron binary itself.
    binPath = process.execPath;

    // Tell Electron to run as a Node process, not as a windowed app
    env.ELECTRON_RUN_AS_NODE = '1';

    args = [entryPoint];
  }
  // Freeze the env — no further mutation after this point

  console.log(`Spawning backend: ${binPath} ${args.join(' ')} (CWD: ${cwd})`);

  const proc = spawn(binPath, args, {
    cwd,
    env, // Pre-built whitelist — never spreads all of process.env
    // inherit allows you to see logs in the terminal; 'pipe' allows programmatic handling
    stdio: isDev ? 'inherit' : 'pipe',
  });

  // Basic crash detection on start
  if (proc.pid === undefined) {
    throw new Error('Failed to spawn backend process');
  }

  // In production, log errors to console so you can debug via terminal if needed
  if (!isDev && proc.stderr) {
    proc.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));
    proc.stdout?.on('data', (data) => console.log(`Backend Log: ${data}`));
  }

  // Wait for health check (max 15s)
  for (let i = 0; i < 30; i++) {
    const alive = await checkHealth();
    if (alive) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }

  // If we get here, it failed. Kill it so we don't leave a zombie.
  stopBackend(proc);
  throw new Error('Backend timed out - Health check failed');
}

export async function stopBackend(proc: ChildProcess) {
  if (proc && !proc.killed) {
    console.log('Stopping backend process...');
    proc.kill('SIGTERM');

    // Give it 2 seconds to close gracefully, then force kill
    const closed = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 2000);
      proc.on('exit', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });

    if (!closed) {
      console.log('Backend did not exit, force killing...');
      proc.kill('SIGKILL');
    }
  }
}

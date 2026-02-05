import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_PORT = 3030;

async function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

export async function launchBackend(isDev: boolean): Promise<ChildProcess> {
  let binPath: string;
  let args: string[];
  let cwd: string;
  let env: NodeJS.ProcessEnv = { ...process.env };

  if (isDev) {
    // --- DEVELOPMENT MODE ---
    cwd = path.resolve(process.cwd(), "../backend");

    if (!fs.existsSync(cwd)) {
      console.warn("⚠️ standard path failed, trying fallback...");
      cwd = path.resolve(__dirname, "../../../backend");
    }

    // In dev, we can assume the developer has 'node' in their PATH
    binPath = "node";
    args = ["dist/index.js"];
  } else {
    // --- PRODUCTION MODE ---
    const resourceRoot = path.join(process.resourcesPath, "backend");
    const distPath = path.join(resourceRoot, "dist", "index.js");
    const flatPath = path.join(resourceRoot, "index.js");

    let entryPoint: string;
    if (fs.existsSync(distPath)) {
      console.log(`Backend found at: ${distPath}`);
      cwd = resourceRoot;
      entryPoint = path.join("dist", "index.js");
    } else if (fs.existsSync(flatPath)) {
      console.log(`Backend found at: ${flatPath}`);
      cwd = resourceRoot;
      entryPoint = "index.js";
    } else {
      throw new Error(
        `Could not find index.js in ${resourceRoot} or ${resourceRoot}/dist`,
      );
    }

    // 🔴 CRITICAL FIX FOR PRODUCTION 🔴
    // Users don't have "node" installed. We must use the Electron binary itself.
    binPath = process.execPath;

    // Tell Electron to run as a Node process, not as a windowed app
    env.ELECTRON_RUN_AS_NODE = "1";

    args = [entryPoint];
  }

  console.log(`Spawning backend: ${binPath} ${args.join(" ")} (CWD: ${cwd})`);

  const proc = spawn(binPath, args, {
    cwd,
    env: {
      ...env, // Includes ELECTRON_RUN_AS_NODE if in prod
      PORT: BACKEND_PORT.toString(),
      NODE_ENV: isDev ? "development" : "production",
    },
    // inherit allows you to see logs in the terminal; 'pipe' allows programmatic handling
    stdio: isDev ? "inherit" : "pipe",
  });

  // Basic crash detection on start
  if (proc.pid === undefined) {
    throw new Error("Failed to spawn backend process");
  }

  // In production, log errors to console so you can debug via terminal if needed
  if (!isDev && proc.stderr) {
    proc.stderr.on("data", (data) => console.error(`Backend Error: ${data}`));
    proc.stdout?.on("data", (data) => console.log(`Backend Log: ${data}`));
  }

  // Wait for health check (max 15s)
  for (let i = 0; i < 30; i++) {
    const alive = await checkHealth();
    if (alive) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }

  // If we get here, it failed. Kill it so we don't leave a zombie.
  stopBackend(proc);
  throw new Error("Backend timed out - Health check failed");
}

export async function stopBackend(proc: ChildProcess) {
  if (proc && !proc.killed) {
    console.log("Stopping backend process...");
    proc.kill("SIGTERM");

    // Give it 2 seconds to close gracefully, then force kill
    const closed = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 2000);
      proc.on("exit", () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });

    if (!closed) {
      console.log("Backend did not exit, force killing...");
      proc.kill("SIGKILL");
    }
  }
}

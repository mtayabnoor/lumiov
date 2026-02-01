import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import fs from "fs"; // ✅ Added to check file existence

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

  if (isDev) {
    // --- DEVELOPMENT MODE ---
    // Development Mode
    // process.cwd() is usually "T:\Projects\lumiov\electron"
    // So we just go up one level to the root, then into backend.
    cwd = path.resolve(process.cwd(), "../backend");

    // Double check it exists to be safe
    if (!fs.existsSync(cwd)) {
      console.warn("⚠️ standard path failed, trying fallback...");
      // Fallback: If running from inside 'dist' for some reason
      cwd = path.resolve(__dirname, "../../../backend");
    }
    binPath = "node";
    args = ["dist/server.js"];
  } else {
    // --- PRODUCTION MODE ---
    const resourceRoot = path.join(process.resourcesPath, "backend");

    // 1. Define possible paths for server.js
    const distPath = path.join(resourceRoot, "dist", "server.js"); // User's preference
    const flatPath = path.join(resourceRoot, "server.js"); // Builder default

    // 2. Auto-detect which one exists
    let entryPoint: string;
    if (fs.existsSync(distPath)) {
      console.log(`Backend found at: ${distPath}`);
      cwd = resourceRoot; // Keep CWD at root so it finds node_modules
      entryPoint = path.join("dist", "server.js");
    } else if (fs.existsSync(flatPath)) {
      console.log(`Backend found at: ${flatPath}`);
      cwd = resourceRoot;
      entryPoint = "server.js";
    } else {
      throw new Error(
        `Could not find server.js in ${resourceRoot} or ${resourceRoot}/dist`,
      );
    }

    binPath = "node";
    args = [entryPoint];
  }

  console.log(`Spawning backend: ${binPath} ${args.join(" ")} (CWD: ${cwd})`);

  const proc = spawn(binPath, args, {
    cwd,
    env: {
      ...process.env,
      PORT: BACKEND_PORT.toString(),
      NODE_ENV: isDev ? "development" : "production",
    },
    // inherit allows you to see logs in the terminal; 'pipe' allows programmatic handling
    stdio: isDev ? "inherit" : "pipe",
  });

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

  throw new Error("Backend timed out - Health check failed");
}

export async function stopBackend(proc: ChildProcess) {
  if (proc) {
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

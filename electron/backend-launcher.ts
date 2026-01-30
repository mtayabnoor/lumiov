import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

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
  let entryPoint: string;
  let cwd: string;

  if (isDev) {
    cwd = path.join(__dirname, "../../backend");
    binPath = "npx";
    entryPoint = "tsx"; // Using npx tsx src/server.ts
  } else {
    // 'resources' is where electron-builder puts extraResources
    cwd = path.join(process.resourcesPath, "backend");
    binPath = "node";
    entryPoint = "server.js";
  }

  const args = isDev ? ["tsx", "src/server.ts"] : [entryPoint];

  const proc = spawn(binPath, args, {
    cwd,
    env: {
      ...process.env,
      PORT: BACKEND_PORT.toString(),
      NODE_ENV: isDev ? "development" : "production",
    },
    shell: true,
  });

  // Wait for health check (max 15s)
  for (let i = 0; i < 30; i++) {
    const alive = await checkHealth();
    if (alive) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error("Backend timed out");
}

export async function stopBackend(proc: ChildProcess) {
  if (proc) {
    proc.kill("SIGTERM");
    return new Promise((r) => proc.on("exit", r));
  }
}

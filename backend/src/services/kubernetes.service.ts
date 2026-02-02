import { KubeConfig, Exec, Watch, V1Status } from '@kubernetes/client-node';
import { loadKubeConfig } from '../config/k8s.js';
import { Writable, PassThrough } from 'stream';
import WebSocket from 'ws';

export interface ShellSession {
  write: (data: string) => void;
  kill: () => void;
  resize?: (cols: number, rows: number) => void;
}

export class K8sService {
  private kc: KubeConfig | null = null;
  private watch: Watch | null = null;
  private exec: Exec | null = null;
  private isInitialized = false;

  // 1. Initialize Configuration
  public async initialize(): Promise<void> {
    try {
      this.kc = loadKubeConfig();
      // Initialize Watch here (it's lightweight)
      this.watch = new Watch(this.kc);
      this.exec = new Exec(this.kc);
      this.isInitialized = true;
      console.log('✅ K8s Service Initialized');
    } catch (err) {
      console.error('❌ K8s Init Failed:', err);
      process.exit(1);
    }
  }

  // 3. Watch Resource
  public watchResource(
    resource: 'pods' | 'deployments' | 'services',
    onData: (action: string, obj: any) => void,
    onError: (err: any) => void,
  ): () => void {
    if (!this.isInitialized || !this.watch) {
      onError(new Error('Service not initialized'));
      return () => {};
    }

    const endpoints = {
      pods: '/api/v1/pods',
      deployments: '/apis/apps/v1/deployments',
      services: '/api/v1/services',
    };

    const path = endpoints[resource];
    let req: any = null;
    let isActive = true;

    const startStream = async () => {
      if (!isActive) return;
      try {
        req = await this.watch!.watch(
          path,
          { allowWatchBookmarks: true },
          (type, obj) => {
            if (isActive) onData(type, obj);
          },
          (err) => {
            if (!isActive) return;
            console.error(`⚠️ Watch error (${resource}):`, err);
            setTimeout(startStream, 3000);
          },
        );
      } catch (e) {
        if (isActive) setTimeout(startStream, 3000);
      }
    };

    startStream();

    return () => {
      isActive = false;
      if (req) req.abort();
    };
  }

  // 4. Exec Pod
  public execPod(
    namespace: string,
    pod: string,
    container: string,
    onData: (data: string) => void,
    onError: (data: string) => void,
  ): ShellSession {
    const inputStream = new PassThrough();

    // Combine stdout/stderr logic
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        onData(chunk.toString());
        callback();
      },
    });

    console.log(`🚀 [K8S] Connecting to shell: ${pod}`);

    let socketConnection: WebSocket | null = null;

    this.exec!.exec(
      namespace,
      pod,
      container,
      [
        '/bin/sh',
        '-c',
        'export TERM=xterm; [ -x /bin/bash ] && exec /bin/bash || exec /bin/sh',
      ],
      outputStream,
      outputStream,
      inputStream,
      true, // tty
      (status: V1Status) => {
        if (status.status === 'Failure') {
          onError(`\r\nConnection Failed: ${status.message}\r\n`);
        }
      },
    )
      .then((conn) => {
        socketConnection = conn as unknown as WebSocket;
        console.log('✅ [K8S] WebSocket Connected!');
      })
      .catch((err) => {
        console.error('❌ [K8S] Exec Connection Error:', err);
        onError(`\r\nError connecting to pod: ${err.message}\r\n`);
      });

    return {
      write: (data) => {
        if (inputStream.writable) inputStream.write(data);
      },
      kill: () => {
        console.log('🛑 [K8S] Closing session');
        inputStream.end();
        if (socketConnection) {
          try {
            socketConnection.close();
          } catch (e) {
            /* ignore */
          }
        }
      },
    };
  }
}

export const k8sService = new K8sService();

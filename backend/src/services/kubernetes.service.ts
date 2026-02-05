import {
  KubeConfig,
  Exec,
  Watch,
  CoreV1Api,
  AppsV1Api,
  V1Status,
  Log,
} from '@kubernetes/client-node';
import { loadKubeConfig } from '../config/k8s.js';
import { Writable, PassThrough } from 'stream';
import WebSocket from 'ws';
import { ResourceType, ShellSession } from '../types/common.js';

export class K8sService {
  private kc: KubeConfig | null = null;
  private watch: Watch | null = null;
  private exec: Exec | null = null;
  private log: Log | null = null;

  // REST Clients for fetching initial lists
  private coreApi: CoreV1Api | null = null;
  private appsApi: AppsV1Api | null = null;

  private isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return; // Prevent duplicate initialization

    try {
      this.kc = loadKubeConfig();
      this.watch = new Watch(this.kc);
      this.exec = new Exec(this.kc);
      this.log = new Log(this.kc);

      // Initialize APIs for Listing
      this.coreApi = this.kc.makeApiClient(CoreV1Api);
      this.appsApi = this.kc.makeApiClient(AppsV1Api);

      this.isInitialized = true;
      console.log('✅ K8s Service Initialized');
    } catch (err) {
      console.error('❌ K8s Init Failed:', err);
    }
  }

  // Helper check
  private checkInit() {
    if (!this.isInitialized) throw new Error('K8s Service not ready');
  }

  // Get full list once (Snapshot)
  public async listResource(resource: ResourceType): Promise<any[]> {
    this.checkInit();

    try {
      switch (resource) {
        case 'namespaces':
          return (await this.coreApi!.listNamespace()).items;
        case 'pods':
          return (await this.coreApi!.listPodForAllNamespaces()).items;
        case 'services':
          return (await this.coreApi!.listServiceForAllNamespaces()).items;
        case 'deployments':
          return (await this.appsApi!.listDeploymentForAllNamespaces()).items;
        case 'statefulsets':
          return (await this.appsApi!.listStatefulSetForAllNamespaces()).items;
        default:
          return [];
      }
    } catch (err) {
      console.error(`Error listing ${resource}:`, err);
      return [];
    }
  }

  // WATCH: Stream updates
  public watchResource(
    resource: ResourceType,
    onData: (action: string, obj: any) => void,
    onError: (err: any) => void,
  ): () => void {
    if (!this.isInitialized || !this.watch) {
      onError(new Error('Service not initialized'));
      return () => {};
    }

    const endpoints: Record<ResourceType, string> = {
      namespaces: '/api/v1/namespaces',
      pods: '/api/v1/pods',
      deployments: '/apis/apps/v1/deployments',
      services: '/api/v1/services',
      statefulsets: '/apis/apps/v1/statefulsets',
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
            // Ignore abort errors (user stopped watching)
            if (!isActive || (err && err.message === 'aborted')) return;

            console.warn(`⚠️ Watch interrupted (${resource}), reconnecting...`);
            setTimeout(startStream, 3000);
          },
        );
      } catch (e) {
        if (isActive) setTimeout(startStream, 3000);
      }
    };

    startStream();

    // Return kill function
    return () => {
      isActive = false;
      if (req && req.abort) req.abort();
      console.log(`🛑 Stopped watching: ${resource}`);
    };
  }

  // EXEC SHELL
  public execPod(
    namespace: string,
    pod: string,
    container: string,
    onData: (data: string) => void,
    onError: (data: string) => void,
  ): ShellSession {
    this.checkInit();

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
        console.log('✅ Exec WebSocket Connected!');
      })
      .catch((err) => {
        console.error('❌ Exec Connection Error:', err);
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

  // ✅ FIXED LOGS FUNCTION
  public async streamPodLogs(
    namespace: string,
    pod: string,
    container: string,
    onData: (data: string) => void,
    onError: (err: any) => void,
  ): Promise<() => void> {
    if (!this.isInitialized || !this.log) {
      const e = new Error('Service not initialized');
      onError(e.message);
      return () => {};
    }

    const logStream = new PassThrough();
    let req: any = null;

    // 1. Handle Stream Data
    logStream.on('data', (chunk) => {
      onData(chunk.toString());
    });

    logStream.on('error', (err) => {
      onError(err.message);
    });

    try {
      // 2. Start K8s Log Request
      req = await this.log.log(namespace, pod, container, logStream, {
        follow: true, // Keep streaming
        tailLines: 100, // Get history
        pretty: false,
        timestamps: true,
      });
    } catch (err: any) {
      console.error(`❌ Failed to start log stream for ${pod}:`, err);
      onError(err.message || 'Log stream failed');
    }

    // 3. Return Cleanup Function
    return () => {
      console.log(`🛑 Stopped logs for ${pod}`);
      if (req && req.abort) {
        req.abort();
      }
      logStream.destroy();
    };
  }
}

export const k8sService = new K8sService();

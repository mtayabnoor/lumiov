import * as k8s from '@kubernetes/client-node';
import {
  KubeConfig,
  Exec,
  Watch,
  CoreV1Api,
  AppsV1Api,
  V1Status,
  Log,
  KubernetesObjectApi,
} from '@kubernetes/client-node';
import { loadKubeConfig } from '../config/k8s';
import { Writable, PassThrough } from 'stream';
import WebSocket from 'ws';
import type { ResourceType, ShellSession } from '../types/common';
import * as yaml from 'js-yaml';
import equal from 'fast-deep-equal';

export class K8sService {
  private kc: KubeConfig | null = null;
  private watch: Watch | null = null;
  private exec: Exec | null = null;
  private log: Log | null = null;

  // REST Clients for fetching initial lists
  private coreApi: CoreV1Api | null = null;
  private appsApi: AppsV1Api | null = null;
  private objectApi: KubernetesObjectApi | null = null;

  public isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.kc = loadKubeConfig(); // Ensure this returns a KubeConfig instance
      this.watch = new Watch(this.kc);
      this.exec = new Exec(this.kc);
      this.log = new Log(this.kc);

      this.coreApi = this.kc.makeApiClient(CoreV1Api);
      this.appsApi = this.kc.makeApiClient(AppsV1Api);

      // ⚠️ THE FIX: Use the static factory method for the generic object API
      this.objectApi = KubernetesObjectApi.makeApiClient(this.kc);

      this.isInitialized = true;
      console.log('✅ K8s Service Initialized');
    } catch (err) {
      console.error('❌ K8s Init Failed:', err);
      throw err; // Re-throw so the server knows it failed
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
  public async watchResource(
    resource: ResourceType,
    onData: (action: string, obj: any) => void,
    onError: (err: any) => void,
  ): Promise<() => void> {
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
    let retryTimeout: NodeJS.Timeout | null = null;

    const startStream = async () => {
      if (!isActive) return;

      try {
        console.log(`🔌 Watching: ${path}`);

        // 2. Await the connection
        const newReq = await this.watch!.watch(
          path,
          { allowWatchBookmarks: true },
          (type, obj) => {
            if (isActive) onData(type, obj);
          },
          (err) => {
            if (!isActive) return;
            // 3. Prevent Infinite Loops on Fatal Errors
            if (err) {
              console.warn(`⚠️ Watch error (${resource}):`, err);
              // If 401/403/404, do NOT retry
              const msg = String(err);
              if (
                msg.includes('401') ||
                msg.includes('403') ||
                msg.includes('404')
              ) {
                onError(new Error(`Fatal Watch Error: ${msg}`));
                isActive = false;
                return;
              }
            }
            // Retry
            retryTimeout = setTimeout(startStream, 3000);
          },
        );

        if (!isActive) {
          if (newReq && newReq.abort) newReq.abort();
          return;
        }

        req = newReq;
      } catch (e) {
        console.error(`❌ Watch connection failed:`, e);
        if (isActive) retryTimeout = setTimeout(startStream, 3000);
      }
    };

    startStream();

    return () => {
      isActive = false;
      if (retryTimeout) clearTimeout(retryTimeout);
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
      write(chunk, _encoding, callback) {
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

  // ✅ ENHANCED LOGS FUNCTION WITH DYNAMIC OPTIONS
  public async streamPodLogs(
    namespace: string,
    pod: string,
    container: string,
    onData: (data: string) => void,
    onError: (err: any) => void,
    options?: {
      tailLines?: number;
      sinceSeconds?: number;
      previous?: boolean;
      timestamps?: boolean;
      follow?: boolean; // true = live streaming, false = snapshot (fetch once)
    },
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

    // Build log options dynamically
    const logOptions: any = {
      follow: options?.follow ?? true, // Default to live streaming
      pretty: false,
      timestamps: options?.timestamps ?? true,
    };

    // Add tailLines if specified
    if (options?.sinceSeconds) {
      // Time-based: get logs since X seconds ago
      logOptions.sinceSeconds = options.sinceSeconds;
    } else if (options?.tailLines && options.tailLines > 0) {
      // Line-based: get last N lines
      logOptions.tailLines = options.tailLines;
    } else if (options?.tailLines === -1) {
      // Fetch ALL logs (no tail limit)
      delete logOptions.tailLines;
    } else {
      logOptions.tailLines = 100; // Default fallback
    }

    // Previous container logs (for crashed/restarted containers)
    if (options?.previous) {
      logOptions.previous = true;
    }

    console.log(`📜 [K8S] Streaming logs: ${pod}/${container}`, logOptions);

    try {
      // 2. Start K8s Log Request
      req = await this.log.log(
        namespace,
        pod,
        container,
        logStream,
        logOptions,
      );
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
  // GET SINGLE RESOURCE (YAML/JSON)
  public async getResourceGeneric(
    apiVersion: string,
    kind: string,
    namespace: string,
    name: string,
  ): Promise<string> {
    this.checkInit();
    try {
      // Use the pre-initialized objectApi
      const response = await this.objectApi!.read({
        apiVersion,
        kind,
        metadata: { name, namespace },
      });

      //const body = response as any;
      //if (body.metadata?.managedFields) delete body.metadata.managedFields;

      return yaml.dump(response, { indent: 2 });
    } catch (err: any) {
      throw new Error(err.response?.body?.message || err.message);
    }
  }

  // ✅ FIXED: UPDATE RESOURCE (GENERIC)
  public async updateResourceGeneric(yamlString: string): Promise<any> {
    this.checkInit();

    // Safety: Auto-repair client
    if (!this.objectApi && this.kc) {
      this.objectApi = k8s.KubernetesObjectApi.makeApiClient(this.kc);
    }

    try {
      // 1. Parse Your YAML (Plain Object)
      let newSpec: any = yaml.load(yamlString);
      if (typeof newSpec === 'string') newSpec = yaml.load(newSpec);
      if (newSpec.yaml && !newSpec.kind) newSpec = yaml.load(newSpec.yaml);

      if (!newSpec || !newSpec.kind || !newSpec.metadata?.name) {
        throw new Error(
          'Invalid YAML: Missing kind, apiVersion, or metadata.name',
        );
      }

      // 2. Fetch the LIVE version
      const response = await this.objectApi!.read({
        apiVersion: newSpec.apiVersion,
        kind: newSpec.kind,
        metadata: {
          name: newSpec.metadata.name,
          namespace: newSpec.metadata.namespace,
        },
      });

      // ⚠️ CRITICAL FIX: Normalize the Live Object
      // This converts 'V1Container' classes into plain objects matching 'newSpec'
      const liveSpec = JSON.parse(JSON.stringify(response));

      // 3. Prepare Objects for Comparison
      // We clean up fields that differ but don't matter (like managedFields)
      const cleanForCompare = (obj: any) => {
        const clone = JSON.parse(JSON.stringify(obj));
        delete clone.status; // Ignore status changes
        if (clone.metadata) {
          // Remove system fields that the user cannot edit
          delete clone.metadata.managedFields;
          delete clone.metadata.creationTimestamp;
          delete clone.metadata.uid;
          delete clone.metadata.resourceVersion;
          delete clone.metadata.generation;
          delete clone.metadata.selfLink;
        }
        return clone;
      };

      const cleanLive = cleanForCompare(liveSpec);
      const cleanNew = cleanForCompare(newSpec);

      // 4. SMART CHECK: Did anything actually change?
      // If they are equal, return immediately. No API call = No Errors.
      if (equal(cleanLive, cleanNew)) {
        console.log(
          `✅ No changes detected for ${newSpec.metadata.name}. Skipping update.`,
        );
        return liveSpec;
      }

      console.log(
        `📝 Detected changes. Replacing resource ${newSpec.metadata.name}...`,
      );

      // 5. Prepare for REPLACE (PUT)
      // We need the valid resourceVersion from the LIVE object to allow the update
      newSpec.metadata.resourceVersion = liveSpec.metadata.resourceVersion;

      // Optional: Copy UID to be safe, though not strictly required for PUT
      if (liveSpec.metadata.uid) {
        newSpec.metadata.uid = liveSpec.metadata.uid;
      }

      // Remove status from the update payload (it's read-only)
      delete newSpec.status;

      // 6. EXECUTE REPLACE (PUT)
      const updateResponse = await this.objectApi!.replace(
        newSpec, // The full object
        undefined, // pretty
        undefined, // dryRun
        undefined, // fieldManager
        undefined, // options (headers)
      );

      return updateResponse.body;
    } catch (err: any) {
      const errorMessage = err.response?.body?.message || err.message;
      console.error(`❌ Update Error: ${errorMessage}`);

      if (errorMessage.includes('Conflict')) {
        throw new Error(
          `Update Conflict: Someone else edited this resource. Please refresh.`,
        );
      }
      if (errorMessage.includes('Forbidden')) {
        throw new Error(
          `Forbidden: You are trying to change an immutable field (like Ports or Image) on a running Pod. Delete and recreate it instead.`,
        );
      }

      throw new Error(errorMessage);
    }
  }

  // DELETE POD
  public async deleteResourceGeneric(
    apiVersion: string,
    kind: string,
    name: string,
    namespace: string,
  ): Promise<string> {
    this.checkInit();

    try {
      console.log(
        `🗑️ [K8S] Deleting Resource: kind: ${kind} name: ${name} in ns ${namespace}`,
      );
      const pod = {
        apiVersion: apiVersion,
        kind: kind,
        metadata: {
          name: name,
          namespace: namespace,
        },
      };

      // Use the CoreV1Api to delete the pod
      await this.objectApi!.delete(pod);

      return `Resource Kind: ${kind} Name: ${name} deleted successfully.`;
    } catch (err: any) {
      const errorMessage = err.response?.body?.message || err.message;
      console.error(`❌ Delete Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  public async scaleDeployment(
    name: string,
    namespace: string,
    replicas: number,
  ): Promise<string> {
    this.checkInit();

    try {
      console.log(
        `🔄 [K8S] Scaling Deployment: name: ${name} in ns ${namespace} to ${replicas} replicas`,
      );

      const deployment = await this.appsApi!.readNamespacedDeployment({
        name,
        namespace,
      });

      const newDeployment = {
        ...deployment,
        spec: {
          ...deployment.spec,
          replicas,
        },
      };

      // Use the AppsV1Api to scale the deployment
      await this.appsApi!.replaceNamespacedDeployment({
        name,
        namespace,
        body: newDeployment as any,
      });

      return `Deployment ${name} scaled to ${replicas} replicas successfully.`;
    } catch (err: any) {
      const errorMessage = err.response?.body?.message || err.message;
      console.error(`❌ Scale Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  // ─── DIAGNOSIS HELPERS ───────────────────────────────────────

  /**
   * Get Kubernetes events related to a specific pod
   */
  public async getPodEvents(
    namespace: string,
    podName: string,
  ): Promise<any[]> {
    this.checkInit();
    try {
      const events = await this.coreApi!.listNamespacedEvent({
        namespace,
        fieldSelector: `involvedObject.name=${podName}`,
      });
      return events.items.map((e: any) => ({
        type: e.type,
        reason: e.reason,
        message: e.message,
        count: e.count,
        firstTimestamp: e.firstTimestamp,
        lastTimestamp: e.lastTimestamp,
        source: e.source?.component,
      }));
    } catch (err: any) {
      console.error(`❌ Error fetching events for ${podName}:`, err.message);
      return [];
    }
  }

  /**
   * One-shot log fetch (non-streaming) for diagnosis.
   * Returns the last N lines as a single string.
   */
  public async getPodLogsSnapshot(
    namespace: string,
    podName: string,
    container: string,
    tailLines: number = 100,
    previous: boolean = false,
  ): Promise<string> {
    this.checkInit();
    try {
      const result = await this.coreApi!.readNamespacedPodLog({
        namespace,
        name: podName,
        container,
        tailLines,
        previous,
      });
      return typeof result === 'string' ? result : String(result ?? '');
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch logs';
      // Previous container logs may not exist
      if (
        previous &&
        (msg.includes('not found') || msg.includes('previous terminated'))
      ) {
        return '';
      }
      console.error(`❌ Error fetching logs for ${podName}/${container}:`, msg);
      return `[Error fetching logs: ${msg}]`;
    }
  }
}

export const k8sService = new K8sService();

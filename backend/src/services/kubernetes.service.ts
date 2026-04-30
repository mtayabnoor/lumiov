import * as k8s from '@kubernetes/client-node';
import {
  KubeConfig,
  Exec,
  PortForward,
  Watch,
  CoreV1Api,
  AppsV1Api,
  BatchV1Api,
  NetworkingV1Api,
  StorageV1Api,
  AutoscalingV1Api,
  RbacAuthorizationV1Api,
  ApiextensionsV1Api,
  V1Status,
  Log,
  KubernetesObjectApi,
} from '@kubernetes/client-node';
import { loadKubeConfig } from '../config/k8s';
import { Writable, PassThrough } from 'stream';
import WebSocket from 'ws';
import net from 'node:net';
import type { ResourceType, ShellSession, PortForwardSession } from '../types/common';
import * as yaml from 'js-yaml';
import equal from 'fast-deep-equal';

export class K8sService {
  private kc: KubeConfig | null = null;
  private watch: Watch | null = null;
  private exec: Exec | null = null;
  private portForward: PortForward | null = null;
  private log: Log | null = null;

  // REST Clients for fetching initial lists
  private coreApi: CoreV1Api | null = null;
  private appsApi: AppsV1Api | null = null;
  private batchApi: BatchV1Api | null = null;
  private networkingApi: NetworkingV1Api | null = null;
  private storageApi: StorageV1Api | null = null;
  private autoscalingApi: AutoscalingV1Api | null = null;
  private rbacApi: RbacAuthorizationV1Api | null = null;
  private apiExtensionsApi: ApiextensionsV1Api | null = null;
  private objectApi: KubernetesObjectApi | null = null;

  public isInitialized = false;
  public k8sState = 'INITIALIZING';
  public lastError: string | null = null;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.k8sState = 'INITIALIZING';
    this.lastError = null;

    try {
      this.kc = loadKubeConfig(); // Ensure this returns a KubeConfig instance
      const cluster = this.kc?.getCurrentCluster();

      // The Kubernetes client creates a dummy localhost:8080 cluster when no config file is found
      const isDefaultFallback =
        cluster?.name === 'cluster' && cluster?.server === 'http://localhost:8080';

      if (!this.kc || !cluster || isDefaultFallback) {
        throw new Error('CONFIG_MISSING: No valid cluster found in KubeConfig');
      }

      this.watch = new Watch(this.kc);
      this.exec = new Exec(this.kc);
      this.portForward = new PortForward(this.kc);
      this.log = new Log(this.kc);

      this.coreApi = this.kc.makeApiClient(CoreV1Api);
      this.appsApi = this.kc.makeApiClient(AppsV1Api);
      this.batchApi = this.kc.makeApiClient(BatchV1Api);
      this.networkingApi = this.kc.makeApiClient(NetworkingV1Api);
      this.storageApi = this.kc.makeApiClient(StorageV1Api);
      this.autoscalingApi = this.kc.makeApiClient(AutoscalingV1Api);
      this.rbacApi = this.kc.makeApiClient(RbacAuthorizationV1Api);
      this.apiExtensionsApi = this.kc.makeApiClient(ApiextensionsV1Api);

      // ⚠️ THE FIX: Use the static factory method for the generic object API
      this.objectApi = KubernetesObjectApi.makeApiClient(this.kc);

      // Ping to verify cluster is actually reachable
      try {
        await this.coreApi.getAPIResources();
      } catch (pingErr: any) {
        throw new Error(`CLUSTER_UNREACHABLE: ${pingErr.message}`);
      }

      this.isInitialized = true;
      this.k8sState = 'CONNECTED';
      console.log('✅ K8s Service Initialized');
    } catch (err: any) {
      if (
        err.message.includes('CONFIG_MISSING') ||
        err.message.includes('Could not load KubeConfig')
      ) {
        this.k8sState = 'CONFIG_MISSING';
        this.lastError = 'No kubeconfig file found or kubeconfig is invalid.';
      } else if (
        err.message.includes('CLUSTER_UNREACHABLE') ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT'
      ) {
        this.k8sState = 'CLUSTER_UNREACHABLE';
        this.lastError =
          'Kubernetes cluster is unreachable. Please ensure it is running.';
      } else {
        this.k8sState = 'ERROR';
        this.lastError = err.message || 'Unknown Kubernetes error';
      }
      console.error(`❌ K8s Init Failed: [${this.k8sState}]`, err.message);
      this.isInitialized = false;
      throw err; // Re-throw so the server knows it failed
    }
  }

  public async retryInitialization(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }

  // Enterprise-grade exponential backoff for read operations
  private async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        const isNetworkError =
          err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ECONNRESET';
        if (!isNetworkError || attempt >= maxRetries) {
          throw err;
        }
        const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s...
        console.log(
          `⚠️ Network error occurred. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Operation failed after retries');
  }

  // Helper check
  private checkInit() {
    if (!this.isInitialized)
      throw new Error('K8s Service not ready - State: ' + this.k8sState);
  }

  // Get full list once (Snapshot)
  public async listResource(resource: ResourceType): Promise<any[]> {
    this.checkInit();

    try {
      return await this.withRetry(async () => {
        switch (resource) {
          // ─── Cluster ───
          case 'namespaces':
            return (await this.coreApi!.listNamespace()).items ?? [];
          case 'nodes':
            return (await this.coreApi!.listNode()).items ?? [];

          // ─── Workloads ───
          case 'pods':
            return (await this.coreApi!.listPodForAllNamespaces()).items ?? [];
          case 'deployments':
            return (await this.appsApi!.listDeploymentForAllNamespaces()).items ?? [];
          case 'statefulsets':
            return (await this.appsApi!.listStatefulSetForAllNamespaces()).items ?? [];
          case 'daemonsets':
            return (await this.appsApi!.listDaemonSetForAllNamespaces()).items ?? [];
          case 'replicasets':
            return (await this.appsApi!.listReplicaSetForAllNamespaces()).items ?? [];
          case 'jobs':
            return (await this.batchApi!.listJobForAllNamespaces()).items ?? [];
          case 'cronjobs':
            return (await this.batchApi!.listCronJobForAllNamespaces()).items ?? [];

          // ─── Storage ───
          case 'persistentvolumeclaims':
            return (
              (await this.coreApi!.listPersistentVolumeClaimForAllNamespaces()).items ??
              []
            );
          case 'persistentvolumes':
            return (await this.coreApi!.listPersistentVolume()).items ?? [];
          case 'storageclasses':
            return (await this.storageApi!.listStorageClass()).items ?? [];

          // ─── Network ───
          case 'services':
            return (await this.coreApi!.listServiceForAllNamespaces()).items ?? [];
          case 'ingresses':
            return (await this.networkingApi!.listIngressForAllNamespaces()).items ?? [];
          case 'networkpolicies':
            return (
              (await this.networkingApi!.listNetworkPolicyForAllNamespaces()).items ?? []
            );
          case 'endpoints':
            return (await this.coreApi!.listEndpointsForAllNamespaces()).items ?? [];

          // ─── Configuration ───
          case 'configmaps':
            return (await this.coreApi!.listConfigMapForAllNamespaces()).items ?? [];
          case 'secrets':
            return (await this.coreApi!.listSecretForAllNamespaces()).items ?? [];
          case 'resourcequotas':
            return (await this.coreApi!.listResourceQuotaForAllNamespaces()).items ?? [];
          case 'limitranges':
            return (await this.coreApi!.listLimitRangeForAllNamespaces()).items ?? [];
          case 'horizontalpodautoscalers':
            return (
              (await this.autoscalingApi!.listHorizontalPodAutoscalerForAllNamespaces())
                .items ?? []
            );

          // ─── Access Control ───
          case 'serviceaccounts':
            return (await this.coreApi!.listServiceAccountForAllNamespaces()).items ?? [];
          case 'roles':
            return (await this.rbacApi!.listRoleForAllNamespaces()).items ?? [];
          case 'rolebindings':
            return (await this.rbacApi!.listRoleBindingForAllNamespaces()).items ?? [];
          case 'clusterroles':
            return (await this.rbacApi!.listClusterRole()).items ?? [];
          case 'clusterrolebindings':
            return (await this.rbacApi!.listClusterRoleBinding()).items ?? [];

          // ─── Custom Resources ───
          case 'customresourcedefinitions':
            return (
              (await this.apiExtensionsApi!.listCustomResourceDefinition()).items ?? []
            );

          default:
            console.warn(`Unknown resource type: ${resource}`);
            return [];
        }
      });
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
      // Cluster
      namespaces: '/api/v1/namespaces',
      nodes: '/api/v1/nodes',
      // Workloads
      pods: '/api/v1/pods',
      deployments: '/apis/apps/v1/deployments',
      statefulsets: '/apis/apps/v1/statefulsets',
      daemonsets: '/apis/apps/v1/daemonsets',
      replicasets: '/apis/apps/v1/replicasets',
      jobs: '/apis/batch/v1/jobs',
      cronjobs: '/apis/batch/v1/cronjobs',
      // Storage
      persistentvolumeclaims: '/api/v1/persistentvolumeclaims',
      persistentvolumes: '/api/v1/persistentvolumes',
      storageclasses: '/apis/storage.k8s.io/v1/storageclasses',
      // Network
      services: '/api/v1/services',
      ingresses: '/apis/networking.k8s.io/v1/ingresses',
      networkpolicies: '/apis/networking.k8s.io/v1/networkpolicies',
      endpoints: '/api/v1/endpoints',
      // Configuration
      configmaps: '/api/v1/configmaps',
      secrets: '/api/v1/secrets',
      resourcequotas: '/api/v1/resourcequotas',
      limitranges: '/api/v1/limitranges',
      horizontalpodautoscalers: '/apis/autoscaling/v1/horizontalpodautoscalers',
      // Access Control
      serviceaccounts: '/api/v1/serviceaccounts',
      roles: '/apis/rbac.authorization.k8s.io/v1/roles',
      rolebindings: '/apis/rbac.authorization.k8s.io/v1/rolebindings',
      clusterroles: '/apis/rbac.authorization.k8s.io/v1/clusterroles',
      clusterrolebindings: '/apis/rbac.authorization.k8s.io/v1/clusterrolebindings',
      // Custom Resources
      customresourcedefinitions:
        '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
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
              if (msg.includes('401') || msg.includes('403') || msg.includes('404')) {
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

  public async startPodPortForward(
    namespace: string,
    podName: string,
    localPort: number,
    remotePort: number,
    onError: (err: string) => void,
  ): Promise<PortForwardSession> {
    this.checkInit();

    if (!this.portForward) {
      throw new Error('PortForward client is not initialized');
    }

    const clientSockets = new Set<net.Socket>();
    const activeConnections = new Set<WebSocket | (() => WebSocket | null)>();

    const server = net.createServer(async (clientSocket) => {
      clientSockets.add(clientSocket);

      const errorStream = new Writable({
        write(chunk, _encoding, callback) {
          onError(chunk.toString());
          callback();
        },
      });

      clientSocket.on('error', (err) => {
        onError(err.message);
      });

      clientSocket.on('close', () => {
        clientSockets.delete(clientSocket);
      });

      try {
        const wsConnection = await this.portForward!.portForward(
          namespace,
          podName,
          [remotePort],
          clientSocket,
          errorStream,
          clientSocket,
        );
        activeConnections.add(wsConnection);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        onError(message);
        if (!clientSocket.destroyed) {
          clientSocket.destroy();
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      const handleError = (err: NodeJS.ErrnoException) => {
        reject(err);
      };

      server.once('error', handleError);
      server.listen(localPort, '127.0.0.1', () => {
        server.off('error', handleError);
        resolve();
      });
    });

    return {
      stop: () => {
        for (const sock of clientSockets) {
          if (!sock.destroyed) {
            sock.destroy();
          }
        }
        clientSockets.clear();

        for (const connection of activeConnections) {
          try {
            const ws = typeof connection === 'function' ? connection() : connection;
            ws?.close();
          } catch {
            // Ignore cleanup failures
          }
        }
        activeConnections.clear();

        try {
          server.close();
        } catch {
          // Ignore cleanup failures
        }
      },
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
      req = await this.log.log(namespace, pod, container, logStream, logOptions);
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
      return await this.withRetry(async () => {
        // Use the pre-initialized objectApi
        const response = await this.objectApi!.read({
          apiVersion,
          kind,
          metadata: { name, namespace },
        });

        return yaml.dump(response, { indent: 2 });
      });
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
        throw new Error('Invalid YAML: Missing kind, apiVersion, or metadata.name');
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

      console.log(`📝 Detected changes. Replacing resource ${newSpec.metadata.name}...`);

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
    namespace: string | undefined,
  ): Promise<string> {
    this.checkInit();

    try {
      console.log(
        `🗑️ [K8S] Deleting Resource: kind: ${kind} name: ${name} in ns ${namespace || 'CLUSTER-SCOPE'}`,
      );

      // 1. Create the base metadata with just the name
      const metadata: any = {
        name: name,
      };

      // 2. Only add 'namespace' key if it is defined and not empty
      // This ensures cluster-scoped resources don't get a "namespace: undefined" key
      if (namespace) {
        metadata.namespace = namespace;
      }

      const resource = {
        apiVersion: apiVersion,
        kind: kind,
        metadata: metadata,
      };

      // Use the CoreV1Api to delete the resource
      await this.objectApi!.delete(resource);

      return `Resource Kind: ${kind} Name: ${name} deleted successfully.`;
    } catch (err: any) {
      const errorMessage = err.response?.body?.message || err.message;
      console.error(`❌ Delete Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  // CREATE RESOURCE (from raw YAML)
  public async createResourceGeneric(yamlString: string): Promise<any> {
    this.checkInit();

    if (!this.objectApi && this.kc) {
      this.objectApi = k8s.KubernetesObjectApi.makeApiClient(this.kc);
    }

    try {
      let spec: any = yaml.load(yamlString);
      if (typeof spec === 'string') spec = yaml.load(spec);

      if (!spec || !spec.kind || !spec.apiVersion || !spec.metadata?.name) {
        throw new Error('Invalid YAML: Missing kind, apiVersion, or metadata.name');
      }

      // Remove status if present (it's read-only)
      delete spec.status;

      console.log(
        `🆕 [K8S] Creating resource: kind=${spec.kind} name=${spec.metadata.name} ns=${spec.metadata.namespace || 'CLUSTER-SCOPE'}`,
      );

      const response = await this.objectApi!.create(spec);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.body?.message || err.message;
      console.error(`❌ Create Error: ${errorMessage}`);

      if (errorMessage.includes('already exists')) {
        throw new Error(`Resource already exists. Use the editor to update it instead.`);
      }

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

  public async getDeploymentReplicaCount(
    name: string,
    namespace: string,
  ): Promise<number | null> {
    this.checkInit();

    try {
      const deployment = await this.appsApi!.readNamespacedDeployment({
        name,
        namespace,
      });

      if (typeof deployment.spec?.replicas === 'number') {
        return deployment.spec.replicas;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err.response?.body?.message || err.message;
      console.error(`❌ Read Deployment Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  // ─── DIAGNOSIS HELPERS ───────────────────────────────────────

  /**
   * Get Kubernetes events related to a specific pod
   */
  public async getPodEvents(namespace: string, podName: string): Promise<any[]> {
    this.checkInit();
    try {
      return await this.withRetry(async () => {
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
      });
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
      return await this.withRetry(async () => {
        const result = await this.coreApi!.readNamespacedPodLog({
          namespace,
          name: podName,
          container,
          tailLines,
          previous,
        });
        return typeof result === 'string' ? result : String(result ?? '');
      });
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

  /**
   * Fetch comprehensive pod details (like kubectl describe pod)
   * Returns: overview, containers, events, volumes, labels, and annotations
   */
  public async getPodDescribeDetails(
    namespace: string,
    podName: string,
  ): Promise<{
    overview: any;
    containers: any[];
    events: any[];
    volumes: any[];
    labels: Record<string, string>;
    annotations: Record<string, string>;
  }> {
    this.checkInit();
    try {
      return await this.withRetry(async () => {
        // Fetch pod full object
        const pod = await this.coreApi!.readNamespacedPod({
          namespace,
          name: podName,
        });

        // Fetch events
        const events = await this.getPodEvents(namespace, podName);

        // Build overview
        const overview = {
          name: pod.metadata?.name,
          namespace: pod.metadata?.namespace,
          status: pod.status?.phase,
          podIP: pod.status?.podIP,
          hostIP: pod.status?.hostIP,
          nodeName: pod.spec?.nodeName,
          restartPolicy: pod.spec?.restartPolicy,
          serviceAccountName: pod.spec?.serviceAccountName,
          age: pod.metadata?.creationTimestamp,
          uid: pod.metadata?.uid,
          creationTimestamp: pod.metadata?.creationTimestamp,
          deletionTimestamp: pod.metadata?.deletionTimestamp,
          qosClass: pod.status?.qosClass,
        };

        // Build containers info
        const containers = (pod.spec?.containers || []).map(
          (container: any, idx: number) => {
            const status = pod.status?.containerStatuses?.[idx];
            return {
              name: container.name,
              image: container.image,
              imagePullPolicy: container.imagePullPolicy,
              ports: container.ports,
              resources: container.resources,
              env: container.env,
              volumeMounts: container.volumeMounts,
              livenessProbe: container.livenessProbe,
              readinessProbe: container.readinessProbe,
              startupProbe: container.startupProbe,
              securityContext: container.securityContext,
              ready: status?.ready,
              restartCount: status?.restartCount,
              state: status?.state,
              containerID: status?.containerID,
            };
          },
        );

        // Build volumes info
        const volumes = (pod.spec?.volumes || []).map((volume: any) => ({
          name: volume.name,
          type:
            Object.keys(volume)
              .filter((k) => k !== 'name')
              .pop() || 'unknown',
          details: Object.entries(volume)
            .filter(([k]) => k !== 'name')
            .reduce((acc: any, [k, v]) => ({ ...acc, [k]: v }), {}),
        }));

        return {
          overview,
          containers,
          events,
          volumes,
          labels: pod.metadata?.labels || {},
          annotations: pod.metadata?.annotations || {},
        };
      });
    } catch (err: any) {
      console.error(`❌ Error fetching pod details for ${podName}:`, err.message);
      throw err;
    }
  }

  // ─── CONTEXT MANAGEMENT ─────────────────────────────────────

  /**
   * List all available kubeconfig contexts and identify the current one.
   * This creates a fresh KubeConfig read so it always reflects the latest file state.
   */
  public getContexts(): {
    contexts: { name: string; cluster: string; user: string }[];
    current: string;
  } {
    const freshKc = loadKubeConfig();
    const rawContexts = freshKc.getContexts();

    // If the service is running an active in-memory context (due to switching),
    // use it. Otherwise, fallback to whatever is set in the kubeconfig file.
    const current = this.kc ? this.kc.getCurrentContext() : freshKc.getCurrentContext();

    const contexts = rawContexts.map((ctx) => ({
      name: ctx.name,
      cluster: ctx.cluster,
      user: ctx.user,
    }));

    return { contexts, current };
  }

  /**
   * Switch to a different kubeconfig context.
   * This resets all API clients and re-initializes against the new cluster.
   */
  public async switchContext(contextName: string): Promise<void> {
    // 1. Load a fresh kubeconfig and validate the target context exists
    const freshKc = loadKubeConfig();
    const available = freshKc.getContexts().map((c) => c.name);

    if (!available.includes(contextName)) {
      throw new Error(
        `Context "${contextName}" not found. Available: ${available.join(', ')}`,
      );
    }

    // 2. Set the new context
    freshKc.setCurrentContext(contextName);

    // 3. Tear down current state
    this.kc = null;
    this.watch = null;
    this.exec = null;
    this.log = null;
    this.coreApi = null;
    this.appsApi = null;
    this.batchApi = null;
    this.networkingApi = null;
    this.storageApi = null;
    this.autoscalingApi = null;
    this.rbacApi = null;
    this.apiExtensionsApi = null;
    this.objectApi = null;
    this.isInitialized = false;
    this.k8sState = 'INITIALIZING';
    this.lastError = null;

    // 4. Re-initialize with the pre-configured KubeConfig
    //    (bypass loadKubeConfig in initialize() by assigning kc directly)
    this.kc = freshKc;

    try {
      const cluster = this.kc.getCurrentCluster();
      const isDefaultFallback =
        cluster?.name === 'cluster' && cluster?.server === 'http://localhost:8080';

      if (!cluster || isDefaultFallback) {
        throw new Error('CONFIG_MISSING: No valid cluster found for context');
      }

      this.watch = new Watch(this.kc);
      this.exec = new Exec(this.kc);
      this.log = new Log(this.kc);

      this.coreApi = this.kc.makeApiClient(CoreV1Api);
      this.appsApi = this.kc.makeApiClient(AppsV1Api);
      this.batchApi = this.kc.makeApiClient(BatchV1Api);
      this.networkingApi = this.kc.makeApiClient(NetworkingV1Api);
      this.storageApi = this.kc.makeApiClient(StorageV1Api);
      this.autoscalingApi = this.kc.makeApiClient(AutoscalingV1Api);
      this.rbacApi = this.kc.makeApiClient(RbacAuthorizationV1Api);
      this.apiExtensionsApi = this.kc.makeApiClient(ApiextensionsV1Api);
      this.objectApi = KubernetesObjectApi.makeApiClient(this.kc);

      // Ping to verify new cluster is reachable
      try {
        await this.coreApi.getAPIResources();
      } catch (pingErr: any) {
        throw new Error(`CLUSTER_UNREACHABLE: ${pingErr.message}`);
      }

      this.isInitialized = true;
      this.k8sState = 'CONNECTED';
      console.log(`✅ Context switched to "${contextName}" successfully`);
    } catch (err: any) {
      if (
        err.message.includes('CONFIG_MISSING') ||
        err.message.includes('Could not load KubeConfig')
      ) {
        this.k8sState = 'CONFIG_MISSING';
        this.lastError = 'No valid cluster found for the selected context.';
      } else if (
        err.message.includes('CLUSTER_UNREACHABLE') ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT'
      ) {
        this.k8sState = 'CLUSTER_UNREACHABLE';
        this.lastError = 'Target cluster is unreachable. Please ensure it is running.';
      } else {
        this.k8sState = 'ERROR';
        this.lastError = err.message || 'Unknown error during context switch';
      }
      console.error(`❌ Context switch failed: [${this.k8sState}]`, err.message);
      this.isInitialized = false;
      throw err;
    }
  }
}

export const k8sService = new K8sService();

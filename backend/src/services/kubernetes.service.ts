import * as k8s from '@kubernetes/client-node';
import { loadKubeConfig } from '../config/k8s.js';

type ResourceType = 'pods' | 'deployments' | 'services';

export class K8sService {
  private kc: k8s.KubeConfig | null = null;
  private watch: k8s.Watch | null = null;
  private isInitialized = false;

  public async initialize(): Promise<void> {
    try {
      this.kc = loadKubeConfig();
      this.watch = new k8s.Watch(this.kc);
      this.isInitialized = true;
      console.log('✅ K8s Service Initialized');
    } catch (err) {
      console.error('❌ K8s Init Failed:', err);
      process.exit(1); // Fatal error if we can't connect
    }
  }

  private getPath(resource: ResourceType): string {
    const map: Record<ResourceType, string> = {
      pods: '/api/v1/pods',
      deployments: '/apis/apps/v1/deployments',
      services: '/api/v1/services',
    };
    return map[resource];
  }

  // Returns a function to STOP the watch
  public watchResource(
    resource: ResourceType,
    onData: (action: string, obj: any) => void,
    onError: (err: any) => void,
  ): () => void {
    if (!this.isInitialized || !this.watch) {
      onError(new Error('Service not initialized'));
      return () => {};
    }

    const path = this.getPath(resource);
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
            if (err) console.error(`⚠️ Watch error (${resource}):`, err);
            // Auto-reconnect after 3s
            setTimeout(() => startStream(), 3000);
          },
        );
      } catch (e) {
        if (isActive) setTimeout(() => startStream(), 3000);
      }
    };

    startStream();

    // The cleanup function
    return () => {
      isActive = false;
      if (req) req.abort();
    };
  }
}

// Singleton export
export const k8sService = new K8sService();

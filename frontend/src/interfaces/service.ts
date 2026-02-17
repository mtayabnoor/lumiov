export interface Service {
  apiVersion: 'v1';
  kind: 'Service';
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  spec: {
    type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
    clusterIP?: string;
    clusterIPs?: string[];
    externalIPs?: string[];
    externalName?: string;
    loadBalancerIP?: string;
    selector?: Record<string, string>;
    ports?: Array<{
      name?: string;
      protocol?: string;
      port: number;
      targetPort?: number | string;
      nodePort?: number;
    }>;
    sessionAffinity?: string;
    [key: string]: any;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{
        ip?: string;
        hostname?: string;
      }>;
    };
  };
}

export interface Ingress {
  apiVersion: "networking.k8s.io/v1";
  kind: "Ingress";
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
    ingressClassName?: string;
    defaultBackend?: {
      service?: {
        name: string;
        port: { name?: string; number?: number };
      };
    };
    tls?: Array<{
      hosts?: string[];
      secretName?: string;
    }>;
    rules?: Array<{
      host?: string;
      http?: {
        paths: Array<{
          path?: string;
          pathType: "Prefix" | "Exact" | "ImplementationSpecific";
          backend: {
            service?: {
              name: string;
              port: { name?: string; number?: number };
            };
          };
        }>;
      };
    }>;
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

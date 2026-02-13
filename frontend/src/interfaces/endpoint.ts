export interface Endpoints {
  apiVersion: "v1";
  kind: "Endpoints";
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  subsets?: Array<{
    addresses?: Array<{
      ip: string;
      hostname?: string;
      nodeName?: string;
      targetRef?: {
        kind?: string;
        name?: string;
        namespace?: string;
        uid?: string;
      };
    }>;
    notReadyAddresses?: Array<{
      ip: string;
      hostname?: string;
      nodeName?: string;
    }>;
    ports?: Array<{
      name?: string;
      port: number;
      protocol?: string;
    }>;
  }>;
}

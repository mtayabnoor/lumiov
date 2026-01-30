import { Metadata } from "./metadata.js";

export interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec?: any;
  status?: any;
  data?: any;
  stringData?: any;
  [key: string]: any;
}

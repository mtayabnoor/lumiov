import * as k8s from '@kubernetes/client-node';

export const loadKubeConfig = (): k8s.KubeConfig => {
  const kc = new k8s.KubeConfig();

  try {
    // Automatically looks for ~/.kube/config or KUBECONFIG env var
    kc.loadFromDefault();
  } catch (err) {
    throw new Error(`Could not load KubeConfig: ${(err as Error).message}`);
  }

  return kc;
};

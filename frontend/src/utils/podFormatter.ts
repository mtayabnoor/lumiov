/**
 * Pod Data Formatting Utilities
 * Formats raw Kubernetes pod data into human-readable display format
 */

interface Container {
  name: string;
  image?: string;
  imagePullPolicy?: string;
  ports?: any[];
  resources?: any;
  env?: any[];
  volumeMounts?: any[];
  livenessProbe?: any;
  readinessProbe?: any;
  startupProbe?: any;
  securityContext?: any;
  ready?: boolean;
  restartCount?: number;
  state?: any;
  containerID?: string;
}

interface Event {
  type?: string;
  reason?: string;
  message?: string;
  count?: number;
  firstTimestamp?: string;
  lastTimestamp?: string;
  source?: string;
}

interface Volume {
  name?: string;
  type?: string;
  details?: any;
}

/**
 * Format container information for display
 */
export const formatContainerInfo = (container: Container): string => {
  const lines: string[] = [];

  lines.push(`Container: ${container.name}`);
  if (container.image) lines.push(`  Image: ${container.image}`);
  if (container.imagePullPolicy) lines.push(`  Image Pull Policy: ${container.imagePullPolicy}`);

  if (container.ports && container.ports.length > 0) {
    lines.push('  Ports:');
    container.ports.forEach((port: any) => {
      const portInfo = `${port.containerPort}/${port.protocol || 'TCP'}`;
      const hostPort = port.hostPort ? ` -> ${port.hostPort}` : '';
      lines.push(`    - ${portInfo}${hostPort}`);
    });
  }

  if (container.resources) {
    lines.push('  Resources:');
    if (container.resources.requests) {
      lines.push(`    Requests: CPU=${container.resources.requests.cpu || 'N/A'}, Memory=${container.resources.requests.memory || 'N/A'}`);
    }
    if (container.resources.limits) {
      lines.push(`    Limits: CPU=${container.resources.limits.cpu || 'N/A'}, Memory=${container.resources.limits.memory || 'N/A'}`);
    }
  }

  if (container.env && container.env.length > 0) {
    lines.push('  Environment Variables:');
    container.env.forEach((envVar: any) => {
      const value = envVar.value || '<from valueFrom>';
      lines.push(`    - ${envVar.name}=${value}`);
    });
  }

  if (container.volumeMounts && container.volumeMounts.length > 0) {
    lines.push('  Volume Mounts:');
    container.volumeMounts.forEach((vm: any) => {
      const readOnly = vm.readOnly ? ' (read-only)' : '';
      lines.push(`    - ${vm.name} -> ${vm.mountPath}${readOnly}`);
    });
  }

  if (container.livenessProbe || container.readinessProbe || container.startupProbe) {
    lines.push('  Probes:');
    if (container.livenessProbe) lines.push(`    - Liveness: ${JSON.stringify(container.livenessProbe)}`);
    if (container.readinessProbe) lines.push(`    - Readiness: ${JSON.stringify(container.readinessProbe)}`);
    if (container.startupProbe) lines.push(`    - Startup: ${JSON.stringify(container.startupProbe)}`);
  }

  lines.push(`  Status: Ready=${container.ready ? 'Yes' : 'No'}, Restarts=${container.restartCount || 0}`);

  if (container.state) {
    const stateKey = Object.keys(container.state)[0];
    lines.push(`  State: ${stateKey}`);
    if (container.state[stateKey]?.reason) {
      lines.push(`    Reason: ${container.state[stateKey].reason}`);
    }
    if (container.state[stateKey]?.message) {
      lines.push(`    Message: ${container.state[stateKey].message}`);
    }
  }

  if (container.containerID) {
    lines.push(`  Container ID: ${container.containerID}`);
  }

  return lines.join('\n');
};

/**
 * Format events for display
 */
export const formatEvents = (events: Event[]): string => {
  if (!events || events.length === 0) {
    return 'No events';
  }

  const lines: string[] = [];
  events.forEach((event, idx) => {
    lines.push(`Event ${idx + 1}:`);
    lines.push(`  Type: ${event.type || 'Unknown'}`);
    lines.push(`  Reason: ${event.reason || 'N/A'}`);
    lines.push(`  Message: ${event.message || 'N/A'}`);
    lines.push(`  Count: ${event.count || 1}`);
    lines.push(`  First Seen: ${formatTimestamp(event.firstTimestamp)}`);
    lines.push(`  Last Seen: ${formatTimestamp(event.lastTimestamp)}`);
    if (event.source) lines.push(`  Source: ${event.source}`);
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Format volumes for display
 */
export const formatVolumes = (volumes: Volume[]): string => {
  if (!volumes || volumes.length === 0) {
    return 'No volumes';
  }

  const lines: string[] = [];
  volumes.forEach((volume, idx) => {
    lines.push(`Volume ${idx + 1}:`);
    lines.push(`  Name: ${volume.name || 'N/A'}`);
    lines.push(`  Type: ${volume.type || 'unknown'}`);
    if (volume.details) {
      Object.entries(volume.details).forEach(([key, value]: [string, any]) => {
        lines.push(`  ${key}: ${JSON.stringify(value)}`);
      });
    }
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Format labels and annotations for display
 */
export const formatLabelsAnnotations = (labels: Record<string, string> | undefined, annotations: Record<string, string> | undefined): string => {
  const lines: string[] = [];

  if (labels && Object.keys(labels).length > 0) {
    lines.push('Labels:');
    Object.entries(labels).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value}`);
    });
  } else {
    lines.push('Labels: None');
  }

  lines.push('');

  if (annotations && Object.keys(annotations).length > 0) {
    lines.push('Annotations:');
    Object.entries(annotations).forEach(([key, value]) => {
      lines.push(`  ${key}: ${value}`);
    });
  } else {
    lines.push('Annotations: None');
  }

  return lines.join('\n');
};

/**
 * Format pod overview information
 */
export const formatPodOverview = (overview: any): string => {
  const lines: string[] = [];

  lines.push(`Name: ${overview.name || 'N/A'}`);
  lines.push(`Namespace: ${overview.namespace || 'N/A'}`);
  lines.push(`Status: ${overview.status || 'N/A'}`);
  lines.push(`Pod IP: ${overview.podIP || 'N/A'}`);
  lines.push(`Host IP: ${overview.hostIP || 'N/A'}`);
  lines.push(`Node: ${overview.nodeName || 'N/A'}`);
  lines.push(`Restart Policy: ${overview.restartPolicy || 'Always'}`);
  lines.push(`Service Account: ${overview.serviceAccountName || 'default'}`);
  lines.push(`QoS Class: ${overview.qosClass || 'N/A'}`);
  lines.push(`UID: ${overview.uid || 'N/A'}`);
  lines.push(`Created: ${formatTimestamp(overview.creationTimestamp)}`);

  if (overview.deletionTimestamp) {
    lines.push(`Deletion Timestamp: ${formatTimestamp(overview.deletionTimestamp)}`);
  }

  return lines.join('\n');
};

/**
 * Format a timestamp to human-readable format
 */
const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
};

/**
 * Calculate pod age from creation timestamp
 */
export const calculatePodAge = (creationTimestamp: string | undefined): string => {
  if (!creationTimestamp) return 'N/A';
  try {
    const created = new Date(creationTimestamp);
    const now = new Date();
    const ms = now.getTime() - created.getTime();

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  } catch {
    return 'N/A';
  }
};

import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

// Cluster
import Overview from "./features/overview/Overview";
import Namespaces from "./features/namespaces/Namespaces";
import Nodes from "./features/nodes/Nodes";

// Workloads
import Pods from "./features/pods/Pods";
import Deployments from "./features/deployments/Deployments";
import StatefulSets from "./features/statefulsets/StatefulSets";
import DaemonSets from "./features/daemonsets/DaemonSets";
import ReplicaSets from "./features/replicasets/ReplicaSets";
import Jobs from "./features/jobs/Jobs";
import CronJobs from "./features/cronjobs/CronJobs";

// Storage
import PersistentVolumeClaims from "./features/persistentvolumeclaims/PersistentVolumeClaims";
import PersistentVolumes from "./features/persistentvolumes/PersistentVolumes";
import StorageClasses from "./features/storageclasses/StorageClasses";

// Network
import Services from "./features/services/Services";
import Ingresses from "./features/ingresses/Ingresses";
import NetworkPolicies from "./features/networkpolicies/NetworkPolicies";
import EndpointsPage from "./features/endpoints/Endpoints";

// Configuration
import ConfigMaps from "./features/configmaps/ConfigMaps";
import Secrets from "./features/secrets/Secrets";
import ResourceQuotas from "./features/resourcequotas/ResourceQuotas";
import LimitRanges from "./features/limitranges/LimitRanges";
import HPAs from "./features/hpa/HPAs";

// Access Control
import ServiceAccounts from "./features/serviceaccounts/ServiceAccounts";
import Roles from "./features/roles/Roles";
import RoleBindings from "./features/rolebindings/RoleBindings";
import ClusterRoles from "./features/clusterroles/ClusterRoles";
import ClusterRoleBindings from "./features/clusterrolebindings/ClusterRoleBindings";

// Custom Resources
import CRDs from "./features/crds/CRDs";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="overview" replace />} />

        {/* Cluster */}
        <Route path="overview" element={<Overview />} />
        <Route path="namespaces" element={<Namespaces />} />
        <Route path="nodes" element={<Nodes />} />

        {/* Workloads */}
        <Route path="pods" element={<Pods />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="statefulsets" element={<StatefulSets />} />
        <Route path="daemonsets" element={<DaemonSets />} />
        <Route path="replicasets" element={<ReplicaSets />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="cronjobs" element={<CronJobs />} />

        {/* Storage */}
        <Route
          path="persistentvolumeclaims"
          element={<PersistentVolumeClaims />}
        />
        <Route path="persistentvolumes" element={<PersistentVolumes />} />
        <Route path="storageclasses" element={<StorageClasses />} />

        {/* Network */}
        <Route path="services" element={<Services />} />
        <Route path="ingresses" element={<Ingresses />} />
        <Route path="networkpolicies" element={<NetworkPolicies />} />
        <Route path="endpoints" element={<EndpointsPage />} />

        {/* Configuration */}
        <Route path="configmaps" element={<ConfigMaps />} />
        <Route path="secrets" element={<Secrets />} />
        <Route path="resourcequotas" element={<ResourceQuotas />} />
        <Route path="limitranges" element={<LimitRanges />} />
        <Route path="horizontalpodautoscalers" element={<HPAs />} />

        {/* Access Control */}
        <Route path="serviceaccounts" element={<ServiceAccounts />} />
        <Route path="roles" element={<Roles />} />
        <Route path="rolebindings" element={<RoleBindings />} />
        <Route path="clusterroles" element={<ClusterRoles />} />
        <Route path="clusterrolebindings" element={<ClusterRoleBindings />} />

        {/* Custom Resources */}
        <Route path="customresourcedefinitions" element={<CRDs />} />
      </Route>
    </Routes>
  );
};

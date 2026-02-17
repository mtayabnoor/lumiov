import React from 'react';

// Icons Imports
import DnsIcon from '@mui/icons-material/Dns';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MemoryIcon from '@mui/icons-material/Memory';
import LayersIcon from '@mui/icons-material/Layers';
import WidgetsIcon from '@mui/icons-material/Widgets';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import FlipToFrontIcon from '@mui/icons-material/FlipToFront';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SaveIcon from '@mui/icons-material/Save';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import CategoryIcon from '@mui/icons-material/Category';
import RouterIcon from '@mui/icons-material/Router';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import PolicyIcon from '@mui/icons-material/Policy';
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import TuneIcon from '@mui/icons-material/Tune';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import LinkIcon from '@mui/icons-material/Link';
import SecurityIcon from '@mui/icons-material/Security';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ExtensionIcon from '@mui/icons-material/Extension';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';

// 1. Icon Mapping Helper
export const iconMapping: { [key: string]: React.ReactElement } = {
  dns: <DnsIcon />,
  dashboard: <DashboardIcon />,
  account_tree: <AccountTreeIcon />,
  memory: <MemoryIcon />,
  layers: <LayersIcon />,
  widgets: <WidgetsIcon />,
  cloud_upload: <CloudUploadIcon />,
  storage: <StorageIcon />,
  sync_alt: <SyncAltIcon />,
  flip_to_front: <FlipToFrontIcon />,
  work: <WorkIcon />,
  schedule: <ScheduleIcon />,
  save_alt: <SaveAltIcon />,
  save: <SaveIcon />,
  sd_storage: <SdStorageIcon />,
  category: <CategoryIcon />,
  router: <RouterIcon />,
  electrical_services: <ElectricalServicesIcon />,
  alt_route: <AltRouteIcon />,
  policy: <PolicyIcon />,
  swap_calls: <SwapCallsIcon />,
  settings: <SettingsIcon />,
  description: <DescriptionIcon />,
  lock: <LockIcon />,
  account_balance_wallet: <AccountBalanceWalletIcon />,
  data_usage: <DataUsageIcon />,
  tune: <TuneIcon />,
  admin_panel_settings: <AdminPanelSettingsIcon />,
  person: <PersonIcon />,
  shield: <ShieldIcon />,
  link: <LinkIcon />,
  security: <SecurityIcon />,
  link_off: <LinkOffIcon />,
  extension: <ExtensionIcon />,
  developer_board: <DeveloperBoardIcon />,
};

// Your Data Structure
export const sidebarItems = [
  {
    title: 'Cluster',
    icon: 'dns',
    items: [
      { label: 'Overview', route: '/overview', icon: 'dashboard' },
      { label: 'Namespaces', route: '/namespaces', icon: 'account_tree' },
      { label: 'Nodes', route: '/nodes', icon: 'memory' },
    ],
  },
  {
    title: 'Workloads',
    icon: 'layers',
    items: [
      { label: 'Pods', route: '/pods', icon: 'widgets' },
      { label: 'Deployments', route: '/deployments', icon: 'cloud_upload' },
      { label: 'StatefulSets', route: '/statefulsets', icon: 'storage' },
      { label: 'DaemonSets', route: '/daemonsets', icon: 'sync_alt' },
      { label: 'ReplicaSets', route: '/replicasets', icon: 'flip_to_front' },
      { label: 'Jobs', route: '/jobs', icon: 'work' },
      { label: 'CronJobs', route: '/cronjobs', icon: 'schedule' },
    ],
  },
  {
    title: 'Storage',
    icon: 'save_alt',
    items: [
      { label: 'PVC', route: '/persistentvolumeclaims', icon: 'save' },
      { label: 'PV', route: '/persistentvolumes', icon: 'sd_storage' },
      { label: 'Storage Classes', route: '/storageclasses', icon: 'category' },
    ],
  },
  {
    title: 'Network',
    icon: 'router',
    items: [
      { label: 'Services', route: '/services', icon: 'electrical_services' },
      { label: 'Ingresses', route: '/ingresses', icon: 'alt_route' },
      { label: 'Network Policies', route: '/networkpolicies', icon: 'policy' },
      { label: 'Endpoints', route: '/endpoints', icon: 'swap_calls' },
    ],
  },
  {
    title: 'Configuration',
    icon: 'settings',
    items: [
      { label: 'ConfigMaps', route: '/configmaps', icon: 'description' },
      { label: 'Secrets', route: '/secrets', icon: 'lock' },
      {
        label: 'Resource Quotas',
        route: '/resourcequotas',
        icon: 'account_balance_wallet',
      },
      { label: 'Limit Ranges', route: '/limitranges', icon: 'data_usage' },
      { label: 'HPA', route: '/horizontalpodautoscalers', icon: 'tune' },
    ],
  },
  {
    title: 'Access Control',
    icon: 'admin_panel_settings',
    items: [
      { label: 'Service Accounts', route: '/serviceaccounts', icon: 'person' },
      { label: 'Roles', route: '/roles', icon: 'shield' },
      { label: 'Role Bindings', route: '/rolebindings', icon: 'link' },
      { label: 'Cluster Roles', route: '/clusterroles', icon: 'security' },
      {
        label: 'Cluster Role Bindings',
        route: '/clusterrolebindings',
        icon: 'link_off',
      },
    ],
  },
  {
    title: 'Custom Resources',
    icon: 'extension',
    items: [
      {
        label: 'CRDs',
        route: '/customresourcedefinitions',
        icon: 'developer_board',
      },
    ],
  },
];

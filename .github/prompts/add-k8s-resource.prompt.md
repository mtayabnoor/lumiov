---
description: 'Scaffold a new Kubernetes resource feature — frontend feature module, backend route, and Socket.IO watch handler following existing patterns (pods, deployments, etc.)'
name: 'Add Kubernetes Resource'
argument-hint: "Resource name (e.g. 'statefulsets', 'services')"
agent: 'agent'
---

Scaffold a new Kubernetes resource feature for the resource: **$input**

Follow the existing patterns in this codebase exactly. Use `features/pods/` and the existing backend files as the canonical reference.

## 1. Add to ResourceType union

In [backend/src/types/common.ts](../../backend/src/types/common.ts), add `'$input'` to the `ResourceType` union in the appropriate category (Workloads / Storage / Network / Configuration / Access Control).

## 2. Backend — Kubernetes service support

In [backend/src/services/kubernetes.service.ts](../../backend/src/services/kubernetes.service.ts):

- Ensure `listResource()` and `watchResource()` handle the new resource type
- Add any required API client calls (use the appropriate existing client: `coreApi`, `appsApi`, `batchApi`, `networkingApi`, etc.)

## 3. Frontend — Feature module

Create `frontend/src/features/$input/` with a single component file following the Pods pattern:

- **File**: `frontend/src/features/$input/<PascalCaseName>.tsx`
- Use the `useResource<K8sType>('$input')` hook for live Socket.IO subscription
- Use `useDeleteResource()` for deletion
- Render an MUI `Table` with columns: Namespace, Name, Age — plus any resource-specific columns
- Include a delete action with `ResourceDeleteConfirmDialog`
- Include an edit action with `ResourceEditor`
- Status badge using `getStatusCssClass()` pattern if the resource has a status/phase field

## 4. Frontend — Route

In [frontend/src/routes.tsx](../../frontend/src/routes.tsx), add a route for the new feature page following the existing pattern.

## 5. Frontend — Navigation

In the sidebar/drawer navigation component (check `frontend/src/components/drawer/`), add a nav item for the new resource in the appropriate section.

## Conventions to follow

- TypeScript strict mode — no untyped `any`
- Error shape: `{ code: string; message: string; recoverable: boolean }`
- Never assume K8s connectivity — the `useResource` hook handles disconnected state
- MUI v7 components only — no custom CSS files
- Functional components with hooks — no class components

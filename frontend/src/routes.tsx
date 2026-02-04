import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Pods from "./features/pods/Pods";
import Deployment from "./features/deployments/Deployments";
import Overview from "./features/overview/Overview";
import Namespaces from "./features/namespaces/Namespaces";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="namespaces" element={<Namespaces />} />
        <Route path="pods" element={<Pods />} />
        <Route path="deployments" element={<Deployment />} />
      </Route>
    </Routes>
  );
};

import React from "react";
import { usePods } from "../../hooks/usePods";
import { useDeployments } from "../../hooks/useDeployments";
import Charts from "../../components/charts/Charts";

function Overview() {
  // These hooks run in parallel.
  // The backend will receive 3 distinct subscribe events.
  const { pods, loading: podsLoading } = usePods();
  const { deployments, loading: depsLoading } = useDeployments();

  const cpuData = [
    { time: "10:00", usage: 20 },
    { time: "10:05", usage: 35 },
    { time: "10:10", usage: 50 },
    { time: "10:15", usage: 45 },
  ];

  const memoryData = [
    { time: "10:00", usage: 60 },
    { time: "10:05", usage: 62 },
    { time: "10:10", usage: 65 },
    { time: "10:15", usage: 64 },
  ];

  return (
    <div className="dashboard-grid">
      <div className="card">
        <h3>Pods</h3>
        <p>{podsLoading ? "Loading..." : pods.length}</p>
      </div>

      <div className="card">
        <h3>Deployments</h3>
        <p>{depsLoading ? "Loading..." : deployments.length}</p>
      </div>
      <Charts title="CPU Usage" data={cpuData} color="#3b82f6" />
      <Charts title="Memory Usage" data={memoryData} color="#8b5cf6" />
    </div>
  );
}

export default Overview;

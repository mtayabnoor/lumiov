import { useState, useEffect } from "react";

// Reuse your logic, but adapted for a component
const ResourceLiveAge = ({
  creationTimestamp,
}: {
  creationTimestamp?: string;
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const calculateAge = () => {
    if (!creationTimestamp) return "-";
    const now = new Date();
    const creation = new Date(creationTimestamp);
    const ageMs = Math.max(now.getTime() - creation.getTime(), 0);
    const ageSeconds = Math.floor(ageMs / 1000);

    if (ageSeconds < 60) return `${ageSeconds}s`;
    const ageMinutes = Math.floor(ageSeconds / 60);
    if (ageMinutes < 60) return `${ageMinutes}m`;
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) return `${ageHours}h`;
    const ageDays = Math.floor(ageHours / 24);
    return `${ageDays}d`;
  };

  return <span>{calculateAge()}</span>;
};

export default ResourceLiveAge;

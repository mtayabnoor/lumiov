import { useState, useEffect } from "react";

// Reuse your logic, but adapted for a component
const ResourceLiveAge = ({
  creationTimestamp,
}: {
  creationTimestamp?: string;
}) => {
  const [ageLabel, setAgeLabel] = useState("-");

  useEffect(() => {
    if (!creationTimestamp) return;

    const calculateAge = () => {
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

    // Update immediately
    setAgeLabel(calculateAge());

    // Update every second
    const intervalId = setInterval(() => {
      setAgeLabel(calculateAge());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [creationTimestamp]);

  return <span>{ageLabel}</span>;
};

export default ResourceLiveAge;

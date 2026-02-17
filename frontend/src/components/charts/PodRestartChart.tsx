import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Paper } from "@mui/material";
import type { Pod } from "../../interfaces/pod";

interface PodRestartChartProps {
  pods: Pod[];
  title?: string;
  maxPods?: number;
}

function PodRestartChart({
  pods,
  title = "Pod Restart Counts",
  maxPods = 10,
}: PodRestartChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const podsWithRestarts = pods
    .map((pod) => {
      // 1. We calculate total restarts across all containers in the pod
      const totalRestarts =
        pod.status?.containerStatuses?.reduce(
          (sum, cs) => sum + (cs.restartCount || 0),
          0,
        ) || 0;

      return {
        name:
          pod.metadata.name.length > 15
            ? `${pod.metadata.name.slice(0, 15)}...`
            : pod.metadata.name,
        fullName: pod.metadata.name,
        restarts: totalRestarts,
        namespace: pod.metadata.namespace,
      };
    })
    // 2. Only show pods that have actually restarted (CrashLoopBackOff etc.)
    .filter((p) => p.restarts > 0)
    // 3. Sort by most restarts first
    .sort((a, b) => b.restarts - a.restarts)
    // 4. Limit the result
    .slice(0, maxPods);

  const chartData = podsWithRestarts;

  // Color based on severity
  const getBarColor = (restarts: number) => {
    if (restarts >= 10) return isDark ? "#f87171" : "#ef4444"; // red - critical
    if (restarts >= 5) return isDark ? "#fbbf24" : "#f59e0b"; // amber - warning
    return isDark ? "#60a5fa" : "#3b82f6"; // blue - info
  };

  if (chartData.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary">
          No pod restarts detected ✓
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: 300,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: "text.primary",
        }}
      >
        {title}
      </Typography>

      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke={isDark ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: "none",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                color: theme.palette.text.primary,
              }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName || ""
              }
              formatter={(value) => {
                const v = Number(value) || 0;
                return [`${v} restart${v !== 1 ? "s" : ""}`, "Count"];
              }}
            />
            <Bar dataKey="restarts" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.restarts)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default PodRestartChart;

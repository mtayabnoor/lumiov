import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Paper } from "@mui/material";
import type { Pod } from "../../interfaces/pod";

interface PodStatusChartProps {
  pods: Pod[];
  title?: string;
}

// Pod phase colors following Kubernetes conventions with theme awareness
const getPhaseColors = (isDark: boolean) => ({
  Running: isDark ? "#4ade80" : "#22c55e", // green
  Pending: isDark ? "#fbbf24" : "#f59e0b", // amber
  Succeeded: isDark ? "#60a5fa" : "#3b82f6", // blue
  Failed: isDark ? "#f87171" : "#ef4444", // red
  Unknown: isDark ? "#9ca3af" : "#6b7280", // gray
});

function PodStatusChart({
  pods,
  title = "Pod Status Distribution",
}: PodStatusChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const COLORS = getPhaseColors(isDark);

  const statusCounts: Record<string, number> = {};

  // 1. Count the frequency of each pod phase
  pods.forEach((pod) => {
    const phase = pod.status?.phase || "Unknown";
    statusCounts[phase] = (statusCounts[phase] || 0) + 1;
  });

  // 2. Transform the map into a chart-ready array
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS] || COLORS.Unknown,
  }));

  if (pods.length === 0) {
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
          bgcolor: "background.paper",
        }}
      >
        <Typography color="text.secondary">No pods available</Typography>
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={theme.palette.background.paper}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: "none",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                color: theme.palette.text.primary,
              }}
              formatter={(value, name) => {
                const v = Number(value) || 0;
                return [`${v} pod${v !== 1 ? "s" : ""}`, String(name)];
              }}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{
                paddingLeft: 20,
              }}
              formatter={(value) => (
                <span
                  style={{ color: theme.palette.text.secondary, fontSize: 13 }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default PodStatusChart;

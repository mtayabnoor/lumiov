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
import { Pod } from "../../interfaces/pod";
import { Deployment } from "../../interfaces/deployment";

interface NamespaceDistributionChartProps {
  pods?: Pod[];
  deployments?: Deployment[];
  title?: string;
  resourceType?: "pods" | "deployments" | "both";
}

// Elegant color palette for namespaces
const NAMESPACE_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#0ea5e9", // sky
  "#3b82f6", // blue
];

function NamespaceDistributionChart({
  pods = [],
  deployments = [],
  title = "Resources by Namespace",
  resourceType = "both",
}: NamespaceDistributionChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const namespaceMap: Record<string, { pods: number; deployments: number }> =
    {};

  // 1. Logic for Pods
  if (resourceType === "pods" || resourceType === "both") {
    pods.forEach((pod) => {
      const ns = pod.metadata.namespace || "default";
      if (!namespaceMap[ns]) {
        namespaceMap[ns] = { pods: 0, deployments: 0 };
      }
      namespaceMap[ns].pods++;
    });
  }

  // 2. Logic for Deployments
  if (resourceType === "deployments" || resourceType === "both") {
    deployments.forEach((dep) => {
      const ns = dep.metadata.namespace || "default";
      if (!namespaceMap[ns]) {
        namespaceMap[ns] = { pods: 0, deployments: 0 };
      }
      namespaceMap[ns].deployments++;
    });
  }

  // 3. Final Transformation & Sorting
  const chartData = Object.entries(namespaceMap)
    .map(([name, counts], index) => ({
      name: name.length > 12 ? `${name.slice(0, 12)}...` : name,
      fullName: name,
      pods: counts.pods,
      deployments: counts.deployments,
      total: counts.pods + counts.deployments,
      color: NAMESPACE_COLORS[index % NAMESPACE_COLORS.length],
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

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
          bgcolor: "background.paper",
        }}
      >
        <Typography color="text.secondary">No resources available</Typography>
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
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              allowDecimals={false}
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
              formatter={(value, name) => [
                value ?? 0,
                String(name).charAt(0).toUpperCase() + String(name).slice(1),
              ]}
            />
            {(resourceType === "pods" || resourceType === "both") && (
              <Bar
                dataKey="pods"
                fill={isDark ? "#60a5fa" : "#3b82f6"}
                radius={resourceType === "pods" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                name="Pods"
              />
            )}
            {(resourceType === "deployments" || resourceType === "both") && (
              <Bar
                dataKey="deployments"
                fill={isDark ? "#a78bfa" : "#8b5cf6"}
                radius={[4, 4, 0, 0]}
                name="Deployments"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default NamespaceDistributionChart;

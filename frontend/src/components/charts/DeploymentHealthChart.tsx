import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Paper } from "@mui/material";
import type { Deployment } from "../../interfaces/deployment";

interface DeploymentHealthChartProps {
  deployments: Deployment[];
  title?: string;
}

function DeploymentHealthChart({
  deployments,
  title = "Deployment Replica Status",
}: DeploymentHealthChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const colors = {
    ready: isDark ? "#4ade80" : "#22c55e",
    unavailable: isDark ? "#f87171" : "#ef4444",
    updating: isDark ? "#fbbf24" : "#f59e0b",
  };

  const chartData = deployments.slice(0, 8).map((deployment) => {
    const desired = deployment.spec?.replicas ?? 0;
    const ready = deployment.status?.readyReplicas ?? 0;
    const unavailable = deployment.status?.unavailableReplicas ?? 0;
    const updating = desired - ready - unavailable;

    // We perform the name truncation right here inside the map
    const name =
      deployment.metadata.name.length > 12
        ? `${deployment.metadata.name.slice(0, 12)}...`
        : deployment.metadata.name;

    return {
      name,
      fullName: deployment.metadata.name,
      ready,
      unavailable,
      updating: updating > 0 ? updating : 0,
      desired,
    };
  });

  if (deployments.length === 0) {
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
        <Typography color="text.secondary">No deployments available</Typography>
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
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              width={100}
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
            <Legend
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: 12,
                    textTransform: "capitalize",
                  }}
                >
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="ready"
              stackId="a"
              fill={colors.ready}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="updating"
              stackId="a"
              fill={colors.updating}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="unavailable"
              stackId="a"
              fill={colors.unavailable}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default DeploymentHealthChart;

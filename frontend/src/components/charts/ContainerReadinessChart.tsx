import React, { useMemo } from "react";
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
import { Pod } from "../../interfaces/pod";

interface ContainerReadinessChartProps {
  pods: Pod[];
  title?: string;
}

function ContainerReadinessChart({
  pods,
  title = "Container Readiness",
}: ContainerReadinessChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const colors = {
    ready: isDark ? "#4ade80" : "#22c55e",
    notReady: isDark ? "#f87171" : "#ef4444",
  };

  const chartData = useMemo(() => {
    let ready = 0;
    let notReady = 0;

    pods.forEach((pod) => {
      pod.status?.containerStatuses?.forEach((cs) => {
        if (cs.ready) {
          ready++;
        } else {
          notReady++;
        }
      });
    });

    if (ready === 0 && notReady === 0) {
      return [];
    }

    return [
      { name: "Ready", value: ready, color: colors.ready },
      { name: "Not Ready", value: notReady, color: colors.notReady },
    ].filter((d) => d.value > 0);
  }, [pods, colors]);

  const totalContainers = chartData.reduce((sum, d) => sum + d.value, 0);

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
        <Typography color="text.secondary">No containers available</Typography>
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

      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
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
                return [
                  `${v} container${v !== 1 ? "s" : ""} (${((v / totalContainers) * 100).toFixed(1)}%)`,
                  String(name),
                ];
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

        {/* Center label */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "calc(50% - 40px)",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            {totalContainers}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Total
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default ContainerReadinessChart;

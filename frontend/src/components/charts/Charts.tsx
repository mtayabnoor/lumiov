import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  time: string; // "10:00", "10:05"
  usage: number; // e.g., 45 (percent)
}

interface ResourceChartProps {
  title: string;
  data: DataPoint[];
  color: string; // "#8884d8" for CPU, "#82ca9d" for Memory
}

function Charts({ title, data, color }: ResourceChartProps) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "300px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#555" }}>
        {title}
      </h3>

      <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`gradient-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#eee"
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#999" }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#999" }}
              unit="%" // Adds % sign to axis
            />

            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />

            <Area
              type="monotone"
              dataKey="usage"
              stroke={color}
              fillOpacity={1}
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Charts;

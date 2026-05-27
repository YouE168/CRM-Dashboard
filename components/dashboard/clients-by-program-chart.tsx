"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { clientsByProgramChart } from "@/lib/mock-data";

interface ClientsByProgramChartProps {
  selectedProgram?: string;
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

export function ClientsByProgramChart({
  selectedProgram = "All Programs",
}: ClientsByProgramChartProps) {
  // Filter data based on selected program
  let data = clientsByProgramChart;
  if (selectedProgram !== "All Programs") {
    data = data.filter((item) => item.program === selectedProgram);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Clients by Program
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" barCategoryGap={10}>
          <XAxis
            type="number"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="program"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={125}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: "#f3f4f6" }}
          />
          <Bar dataKey="clients" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {data.map((item, i) => (
          <div
            key={item.program}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {item.program}
          </div>
        ))}
      </div>
    </div>
  );
}

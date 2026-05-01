"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { sessionsPerMonth } from "@/lib/mock-data";

export function SessionsChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Sessions per Month
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={sessionsPerMonth}>
          <defs>
            <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#sessGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

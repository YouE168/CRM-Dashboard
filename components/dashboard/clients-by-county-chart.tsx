"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { clientsByCountyChart } from "@/lib/mock-data";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const data = [
  { name: "Linn", value: 24 },
  { name: "Bourbon", value: 31 },
  { name: "Crawford", value: 18 },
  { name: "Cherokee", value: 27 },
  { name: "Labette", value: 24 },
  { name: "Montgomery", value: 15 },
  { name: "Woodson", value: 12 },
  { name: "Wilson", value: 20 },
  { name: "Allen", value: 19 },
  { name: "Neosho", value: 22 },
  { name: "Greenwood", value: 16 },
];

export function ClientsByCountyChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Clients by County
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={clientsByCountyChart}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={75}
            paddingAngle={2}
            dataKey="clients"
            nameKey="county"
          >
            {clientsByCountyChart.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-1 justify-center">
        {clientsByCountyChart.map((item, i) => (
          <div
            key={item.county}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {item.county} {item.clients}
          </div>
        ))}
      </div>
    </div>
  );
}

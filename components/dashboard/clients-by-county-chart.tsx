"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect, useCallback } from "react";
import {
  getClientsByCountyChart,
  subscribeToDashboardChanges,
  type ChartRow,
} from "@/lib/supabase/dashboard-data";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#a855f7",
];

export function ClientsByCountyChart() {
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const rows = await getClientsByCountyChart();
      setData(rows);
    } catch (err) {
      console.error("Failed to load clients-by-county chart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDashboardChanges(loadData);
    return unsubscribe;
  }, [loadData]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Clients by County
      </h3>
      {loading ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">
          Loading…
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="label"
              >
                {data.map((_, i) => (
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
            {data.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-xs text-gray-500"
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {item.label} {item.value}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

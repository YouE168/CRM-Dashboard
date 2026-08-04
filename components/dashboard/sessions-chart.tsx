"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState, useEffect, useCallback, useRef } from "react";
import { Download } from "lucide-react";
import {
  getLiveSessionsPerMonth,
  subscribeToLiveDashboardData,
  type SessionMonthRow,
} from "@/lib/supabase/dashboard-data";

export function SessionsChart() {
  const [data, setData] = useState<SessionMonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const rows = await getLiveSessionsPerMonth();
      setData(rows);
    } catch (err) {
      console.error("Failed to load sessions chart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToLiveDashboardData(loadData);
    return unsubscribe;
  }, [loadData]);

  const exportPDF = async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      const dateLabel = new Date().toISOString().slice(0, 10);
      pdf.save(`sessions-per-month-${dateLabel}.pdf`);
    } catch (err) {
      console.error("Failed to export sessions chart to PDF:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      ref={chartRef}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Sessions per Month
        </h3>
        <button
          type="button"
          onClick={exportPDF}
          disabled={loading || exporting}
          title="Export as PDF"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Exporting…" : "PDF"}
        </button>
      </div>
      {loading ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">
          Loading…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
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
      )}
    </div>
  );
}

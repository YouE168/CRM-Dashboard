"use client";

import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "success" | "warning" | "danger";
}

const iconBg: Record<string, string> = {
  default: "bg-gray-100 text-gray-500",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-orange-100 text-orange-500",
  danger: "bg-red-100 text-red-500",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {(trend || subtitle) && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {trend && (
                <span
                  className={`text-xs font-semibold ${trend.isPositive ? "text-emerald-600" : "text-red-500"}`}
                >
                  {trend.isPositive ? "+" : "-"}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-gray-400">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg shrink-0 ml-3 ${iconBg[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

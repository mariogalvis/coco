"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "critical";
  format?: "number" | "currency" | "percent" | "none";
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant = "default",
  format = "none",
  loading = false,
}: KPICardProps) {
  const formattedValue = () => {
    if (typeof value === "string") return value;
    switch (format) {
      case "number":
        return formatNumber(value);
      case "currency":
        return formatCurrency(value);
      case "percent":
        return formatPercent(value);
      default:
        return value.toString();
    }
  };

  const variantStyles = {
    default: "border-l-4 border-l-primary",
    success: "border-l-4 border-l-fraud-low",
    warning: "border-l-4 border-l-fraud-medium",
    danger: "border-l-4 border-l-fraud-high",
    critical: "border-l-4 border-l-fraud-critical",
  };

  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? "text-fraud-low" : trend && trend < 0 ? "text-fraud-critical" : "text-muted-foreground";

  if (loading) {
    return (
      <Card className={cn("animate-pulse", variantStyles[variant])}>
        <CardContent className="p-6">
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="h-8 w-32 bg-muted rounded mb-2" />
          <div className="h-3 w-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all hover:shadow-lg", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="text-3xl font-bold mt-2 tracking-tight">{formattedValue()}</p>
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
                <TrendIcon className="h-4 w-4" />
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
            {(trendLabel || subtitle) && (
              <p className="text-xs text-muted-foreground">{trendLabel || subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

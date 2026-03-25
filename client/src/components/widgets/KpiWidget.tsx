import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiWidgetProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

export function KpiWidget({ label, value, subtitle, trend, color }: KpiWidgetProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="flex flex-col justify-center h-full min-h-[80px]">
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color ?? ""}`}>{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1 mt-1">
          {trend && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      )}
    </div>
  );
}

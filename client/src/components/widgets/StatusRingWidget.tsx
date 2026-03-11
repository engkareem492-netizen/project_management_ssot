import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

interface StatusRingWidgetProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export function StatusRingWidget({ label, value, max, color = "#3b82f6" }: StatusRingWidgetProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const data = [{ value: percentage, fill: color }];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <ResponsiveContainer width={160} height={160}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            data={data}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: "#e5e7eb" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{percentage}%</span>
          <span className="text-xs text-muted-foreground">{value}/{max}</span>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-center">{label}</div>
    </div>
  );
}

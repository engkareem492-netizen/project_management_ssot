import React from "react";
import { Button } from "@/components/ui/button";

interface TableWidgetProps {
  title?: string;
  columns: { key: string; label: string }[];
  rows: Record<string, React.ReactNode>[];
  emptyMessage?: string;
  maxRows?: number;
}

export function TableWidget({
  columns,
  rows,
  emptyMessage = "No data available",
  maxRows = 5,
}: TableWidgetProps) {
  const displayRows = rows.slice(0, maxRows);
  const hasMore = rows.length > maxRows;

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide py-1.5 px-2"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr
              key={i}
              className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-1.5 px-2 text-xs">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          +{rows.length - maxRows} more rows
        </div>
      )}
    </div>
  );
}

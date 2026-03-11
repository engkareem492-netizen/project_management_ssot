import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Settings, X } from "lucide-react";

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  onConfigure?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
  isConfiguring?: boolean;
}

export function WidgetCard({
  title,
  children,
  onRemove,
  onConfigure,
  dragHandleProps,
  className,
  isConfiguring,
}: WidgetCardProps) {
  return (
    <motion.div layout className={`h-full ${className ?? ""}`}>
      <Card className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <div
            {...dragHandleProps}
            className="cursor-grab text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="flex-1 text-sm font-semibold truncate">{title}</span>
          {(onConfigure || onRemove) && (
            <div className="flex items-center gap-1">
              {onConfigure && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${isConfiguring ? "text-primary" : "text-muted-foreground"}`}
                  onClick={onConfigure}
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              )}
              {onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto">{children}</div>
      </Card>
    </motion.div>
  );
}

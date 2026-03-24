import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Accept either a Lucide icon component (e.g. BookOpen) or a pre-rendered ReactNode (e.g. <BookOpen />) */
  icon: LucideIcon | ReactNode;
  title: string;
  description?: string;
  /** Legacy: simple text label for a single action button */
  actionLabel?: string;
  onAction?: () => void;
  /** New: arbitrary JSX action element */
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, action }: EmptyStateProps) {
  // Lucide icons are forwardRef objects (typeof === 'object'), not plain functions.
  // Use React.isValidElement to detect pre-rendered JSX; otherwise treat as a component type.
  const IconElement = React.isValidElement(icon)
    ? icon
    : React.createElement(icon as React.ElementType, { className: "w-8 h-8 text-muted-foreground" });

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {IconElement}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
      {!action && actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="gap-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

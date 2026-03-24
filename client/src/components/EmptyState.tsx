import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
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
  // Determine whether icon is a component constructor or a rendered element
  const isComponent = typeof icon === "function";
  const IconElement = isComponent
    ? (() => { const Icon = icon as LucideIcon; return <Icon className="w-8 h-8 text-muted-foreground" />; })()
    : (icon as ReactNode);

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

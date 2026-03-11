import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive";
  }[];
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          key="bulk-bar"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm text-white rounded-full shadow-2xl px-4 py-3"
        >
          <span className="text-sm font-medium mr-1 whitespace-nowrap">
            {selectedCount} selected
          </span>
          <div className="w-px h-4 bg-white/20 mx-1" />
          {actions.map((action, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={action.variant === "destructive" ? "destructive" : "secondary"}
              className={
                action.variant === "destructive"
                  ? "h-7 text-xs rounded-full"
                  : "h-7 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white border-0"
              }
              onClick={action.onClick}
            >
              {action.icon && (
                <span className="mr-1 [&>svg]:h-3.5 [&>svg]:w-3.5">{action.icon}</span>
              )}
              {action.label}
            </Button>
          ))}
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
            onClick={onClearSelection}
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

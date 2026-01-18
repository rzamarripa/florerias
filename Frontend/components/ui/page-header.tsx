"use client";

import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    customElement?: React.ReactNode;
  };
}

export function PageHeader({
  title,
  description,
  badge,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && (
        action.customElement ? (
          action.customElement
        ) : (
          <Button onClick={action.onClick} className="gap-2" disabled={action.disabled}>
            {action.icon}
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

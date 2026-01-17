"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
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
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <span className={index === breadcrumbs.length - 1 ? "text-foreground" : ""}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between">
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
    </div>
  );
}

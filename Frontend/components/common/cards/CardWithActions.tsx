"use client";
import { useState } from "react";
import { TbChevronDown, TbRefresh, TbX } from "react-icons/tb";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

import type { ChildrenType } from "@/types";

type CardWithActionsProps = {
  title: string;
  isCollapsible?: boolean;
  isRefreshable?: boolean;
  isCloseable?: boolean;
} & ChildrenType;

const CardWithActions = ({
  title,
  isCloseable,
  isCollapsible,
  isRefreshable,
  children,
}: CardWithActionsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  if (!isVisible) return null;

  return (
    <Card className="relative">
      {isRefreshing && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {isCollapsible && (
            <button
              className="p-1 hover:bg-muted rounded"
              onClick={handleToggle}
            >
              <TbChevronDown
                className="transition-transform"
                style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}
              />
            </button>
          )}
          {isRefreshable && (
            <button
              className="p-1 hover:bg-muted rounded"
              onClick={handleRefresh}
            >
              <TbRefresh />
            </button>
          )}
          {isCloseable && (
            <button
              className="p-1 hover:bg-muted rounded"
              onClick={handleClose}
            >
              <TbX />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent
        className="pt-2"
        style={{
          display: isCollapsed ? "none" : "block",
          transition: "all 0.3s ease",
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
};

export default CardWithActions;

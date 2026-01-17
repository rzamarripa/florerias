"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DateFiltersProps {
  onSearch: (filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
  }) => void;
}

const DateFilters: React.FC<DateFiltersProps> = ({ onSearch }) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "mes">("mes");

  // Inicializar con fechas del mes actual
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));

    // Trigger search automáticamente con fechas del mes
    setTimeout(() => {
      onSearch({
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        viewMode: "mes",
      });
    }, 100);
  }, []);

  const handleSearch = () => {
    onSearch({ startDate, endDate, viewMode });
  };

  const handleViewModeChange = (mode: "dia" | "semana" | "mes") => {
    setViewMode(mode);
    const today = new Date();
    let newStartDate: Date;
    let newEndDate: Date = today;

    switch (mode) {
      case "dia":
        newStartDate = today;
        newEndDate = today;
        break;
      case "semana":
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 7);
        break;
      case "mes":
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        newStartDate = today;
    }

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    setStartDate(formatDate(newStartDate));
    setEndDate(formatDate(newEndDate));

    // Auto-search cuando cambia el modo
    onSearch({
      startDate: formatDate(newStartDate),
      endDate: formatDate(newEndDate),
      viewMode: mode,
    });
  };

  return (
    <div
      className="card border-0 shadow-sm mb-2"
      style={{ borderRadius: "10px" }}
    >
      <div className="card-body p-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          <div className="md:col-span-4">
            <div className="space-y-1">
              <Label
                className="font-semibold text-muted-foreground mb-1"
                style={{ fontSize: "13px" }}
              >
                Fecha Inicial <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-muted rounded-lg py-2 px-3 text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="space-y-1">
              <Label
                className="font-semibold text-muted-foreground mb-1"
                style={{ fontSize: "13px" }}
              >
                Fecha Final <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-muted rounded-lg py-2 px-3 text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <Button
              onClick={handleSearch}
              variant="default"
              className="w-full rounded-lg py-2 px-4 font-semibold text-sm"
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="mt-1">
          <div className="flex justify-end">
            <div className="inline-flex rounded-lg overflow-hidden border">
              <Button
                variant={viewMode === "dia" ? "default" : "outline"}
                onClick={() => handleViewModeChange("dia")}
                className="rounded-none rounded-l-lg font-semibold text-xs py-1.5 px-3"
                size="sm"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === "semana" ? "default" : "outline"}
                onClick={() => handleViewModeChange("semana")}
                className="rounded-none border-l-0 border-r-0 font-semibold text-xs py-1.5 px-3"
                size="sm"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === "mes" ? "default" : "outline"}
                onClick={() => handleViewModeChange("mes")}
                className="rounded-none rounded-r-lg font-semibold text-xs py-1.5 px-3"
                size="sm"
              >
                Mes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFilters;

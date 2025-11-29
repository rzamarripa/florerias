"use client";

import React, { useState, useEffect } from "react";
import { Form, Button, ButtonGroup } from "react-bootstrap";

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
      className="card border-0 shadow-sm mb-4"
      style={{ borderRadius: "12px" }}
    >
      <div className="card-body p-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <Form.Group className="mb-0">
              <Form.Label
                className="fw-semibold text-muted mb-1"
                style={{ fontSize: "13px" }}
              >
                Fecha Inicial <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-light"
                style={{
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "14px",
                }}
              />
            </Form.Group>
          </div>

          <div className="col-md-4">
            <Form.Group className="mb-0">
              <Form.Label
                className="fw-semibold text-muted mb-1"
                style={{ fontSize: "13px" }}
              >
                Fecha Final <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-light"
                style={{
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "14px",
                }}
              />
            </Form.Group>
          </div>

          <div className="col-md-4">
            <Button
              onClick={handleSearch}
              variant="primary"
              className="w-100"
              style={{
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-12">
            <div className="d-flex justify-content-end">
              <ButtonGroup size="sm">
                <Button
                  variant={viewMode === "dia" ? "primary" : "outline-secondary"}
                  onClick={() => handleViewModeChange("dia")}
                  style={{
                    borderRadius: "8px 0 0 8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    padding: "6px 12px",
                  }}
                >
                  Día
                </Button>
                <Button
                  variant={
                    viewMode === "semana" ? "primary" : "outline-secondary"
                  }
                  onClick={() => handleViewModeChange("semana")}
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    padding: "6px 12px",
                  }}
                >
                  Semana
                </Button>
                <Button
                  variant={viewMode === "mes" ? "primary" : "outline-secondary"}
                  onClick={() => handleViewModeChange("mes")}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    fontWeight: "600",
                    fontSize: "13px",
                    padding: "6px 12px",
                  }}
                >
                  Mes
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFilters;

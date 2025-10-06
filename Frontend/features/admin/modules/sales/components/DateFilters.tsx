"use client";

import React, { useState } from "react";
import { Form, Button, ButtonGroup } from "react-bootstrap";

interface DateFiltersProps {
  onSearch: (filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
  }) => void;
}

const DateFilters: React.FC<DateFiltersProps> = ({ onSearch }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "mes">("dia");

  const handleSearch = () => {
    onSearch({ startDate, endDate, viewMode });
  };

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
      <div className="card-body p-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <Form.Group>
              <Form.Label className="fw-semibold text-muted mb-2">
                Fecha Inicial <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-light"
                style={{ borderRadius: "10px", padding: "12px 16px" }}
              />
            </Form.Group>
          </div>

          <div className="col-md-4">
            <Form.Group>
              <Form.Label className="fw-semibold text-muted mb-2">
                Fecha Final <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-light"
                style={{ borderRadius: "10px", padding: "12px 16px" }}
              />
            </Form.Group>
          </div>

          <div className="col-md-4">
            <Button
              onClick={handleSearch}
              className="w-100"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "10px",
                padding: "12px 24px",
                fontWeight: "600",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              }}
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-end">
              <ButtonGroup>
                <Button
                  variant={viewMode === "dia" ? "primary" : "outline-secondary"}
                  onClick={() => setViewMode("dia")}
                  style={{
                    borderRadius: "10px 0 0 10px",
                    fontWeight: "600",
                    ...(viewMode === "dia"
                      ? {
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }
                      : {}),
                  }}
                >
                  Día
                </Button>
                <Button
                  variant={viewMode === "semana" ? "primary" : "outline-secondary"}
                  onClick={() => setViewMode("semana")}
                  style={{
                    fontWeight: "600",
                    ...(viewMode === "semana"
                      ? {
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }
                      : {}),
                  }}
                >
                  Semana
                </Button>
                <Button
                  variant={viewMode === "mes" ? "primary" : "outline-secondary"}
                  onClick={() => setViewMode("mes")}
                  style={{
                    borderRadius: "0 10px 10px 0",
                    fontWeight: "600",
                    ...(viewMode === "mes"
                      ? {
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }
                      : {}),
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

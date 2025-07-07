"use client";

import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { budgetService } from "../services/budgetService";
import { BudgetFormData, BudgetTreeNode } from "../types";

interface BudgetInputFormProps {
  show: boolean;
  onHide: () => void;
  node: BudgetTreeNode | null;
  selectedMonth: string;
  onBudgetSaved: () => void;
}

const BudgetInputForm: React.FC<BudgetInputFormProps> = ({
  show,
  onHide,
  node,
  selectedMonth,
  onBudgetSaved,
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    categoryId: "",
    companyId: "",
    branchId: "",
    brandId: "",
    routeId: "",
    assignedAmount: 0,
    month: selectedMonth,
  });
  const [loading, setLoading] = useState(false);
  const [parentTotals, setParentTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    if (node && show) {
      setFormData({
        categoryId: node.data?.categoryId || "",
        companyId: node.data?.companyId || "",
        branchId: node.data?.branchId || "",
        brandId: node.data?.brandId || "",
        routeId: node.data?.routeId || "",
        assignedAmount: node.assignedAmount || 0,
        month: selectedMonth,
      });

      // Load parent totals
      loadParentTotals();
    }
  }, [node, show, selectedMonth]);

  const loadParentTotals = async () => {
    if (!node || !selectedMonth) return;

    try {
      const totals: Record<string, number> = {};

      if (node.data?.companyId) {
        const companyTotal = await budgetService.calculateParentTotal(
          "companyId",
          node.data.companyId,
          selectedMonth
        );
        if (companyTotal.success) {
          totals[`company_${node.data.companyId}`] = companyTotal.data || 0;
        }
      }

      if (node.data?.branchId) {
        const branchTotal = await budgetService.calculateParentTotal(
          "branchId",
          node.data.branchId,
          selectedMonth
        );
        if (branchTotal.success) {
          totals[`branch_${node.data.branchId}`] = branchTotal.data || 0;
        }
      }

      if (node.data?.brandId) {
        const brandTotal = await budgetService.calculateParentTotal(
          "brandId",
          node.data.brandId,
          selectedMonth
        );
        if (brandTotal.success) {
          totals[`brand_${node.data.brandId}`] = brandTotal.data || 0;
        }
      }

      setParentTotals(totals);
    } catch (error) {
      console.error("Error loading parent totals:", error);
    }
  };

  const generateMonthOptions = () => {
    const months = [];
    const currentYear = new Date().getFullYear();

    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthValue = `${year}-${month.toString().padStart(2, "0")}`;
        const monthLabel = new Date(year, month - 1).toLocaleDateString(
          "es-ES",
          {
            year: "numeric",
            month: "long",
          }
        );
        months.push({ value: monthValue, label: monthLabel });
      }
    }

    return months;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!node) return;

    if (formData.assignedAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setLoading(true);

    try {
      const result = await budgetService.createBudget(formData);

      if (result.success) {
        toast.success("Presupuesto asignado correctamente");
        onBudgetSaved();
        onHide();
      } else {
        toast.error(result.message || "Error al asignar presupuesto");
      }
    } catch (error: any) {
      toast.error(
        "Error al asignar presupuesto: " +
          (error.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof BudgetFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!node) return null;

  const monthOptions = generateMonthOptions();

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Asignar Presupuesto - {node.text}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mes</Form.Label>
                <Form.Select
                  value={formData.month}
                  onChange={(e) => handleInputChange("month", e.target.value)}
                  required
                >
                  <option value="">Selecciona un mes...</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Monto Asignado</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.assignedAmount}
                  onChange={(e) =>
                    handleInputChange(
                      "assignedAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                  placeholder="0.00"
                />
              </Form.Group>
            </Col>
          </Row>

          {Object.keys(parentTotals).length > 0 && (
            <div className="mt-4">
              <h6>Totales de Niveles Superiores</h6>
              <div className="border rounded p-3 bg-light">
                {Object.entries(parentTotals).map(([key, total]) => {
                  const [type] = key.split("_");
                  let label = "";

                  switch (type) {
                    case "company":
                      label = "Total Razón Social";
                      break;
                    case "branch":
                      label = "Total Sucursal";
                      break;
                    case "brand":
                      label = "Total Marca";
                      break;
                  }

                  return (
                    <div
                      key={key}
                      className="d-flex justify-content-between mb-2"
                    >
                      <span>{label}:</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4">
            <h6>Información del Nodo</h6>
            <div className="border rounded p-3 bg-light">
              <p>
                <strong>Tipo:</strong>{" "}
                {node.type === "route" ? "Ruta" : "Sucursal"}
              </p>
              <p>
                <strong>Nombre:</strong> {node.text}
              </p>
              {node.assignedAmount && node.assignedAmount > 0 && (
                <p>
                  <strong>Presupuesto Actual:</strong>{" "}
                  {formatCurrency(node.assignedAmount)}
                </p>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Asignar Presupuesto"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BudgetInputForm;

"use client";

import {
  UserSessionStore,
  useUserSessionStore,
} from "@/stores/userSessionStore";
import React, { useEffect, useState } from "react";
import { Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import BudgetTree from "./components/BudgetTree";
import { budgetService } from "./services/budgetService";
import { BudgetFormData, BudgetTreeNode } from "./types";

const Budget: React.FC = () => {
  const [treeData, setTreeData] = useState<BudgetTreeNode[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const user = useUserSessionStore((state: UserSessionStore) => state.user);

  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const currentYear = currentDate.getFullYear().toString();
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadBudgetTree();
    }
  }, [selectedMonth, selectedYear, user]);

  const loadBudgetTree = async () => {
    if (!selectedMonth || !selectedYear) return;
    setLoading(true);
    try {
      const monthYear = `${selectedYear}-${selectedMonth}`;
      const response = await budgetService.getBudgetTree(monthYear, user?._id);
      if (response.success) {
        setTreeData(response.data || []);
      } else {
        toast.error(
          response.message || "Error al cargar el árbol de presupuestos"
        );
      }
    } catch {
      toast.error("Error al cargar el árbol de presupuestos");
    } finally {
      setLoading(false);
    }
  };

  const updateNodeInTree = (
    nodes: BudgetTreeNode[],
    nodeId: string,
    newAmount: number
  ): BudgetTreeNode[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, budgetAmount: newAmount };
      }
      if (node.children) {
        const updatedChildren = updateNodeInTree(
          node.children,
          nodeId,
          newAmount
        );
        const hasChanged = updatedChildren !== node.children;
        if (hasChanged) {
          const newTotal = updatedChildren.reduce((sum, child) => {
            return sum + (child.budgetAmount || child.total || 0);
          }, 0);
          return { ...node, children: updatedChildren, total: newTotal };
        }
      }
      return node;
    });
  };

  const handleUpdateBudget = async (
    node: BudgetTreeNode,
    newAmount: number
  ) => {
    if (
      !node.entityIds ||
      !node.entityIds.categoryId ||
      !node.entityIds.companyId ||
      !node.entityIds.brandId ||
      !node.entityIds.branchId
    ) {
      toast.error("Faltan datos de la entidad para guardar el presupuesto.");
      return;
    }

    const budgetData: BudgetFormData = {
      categoryId: node.entityIds.categoryId,
      companyId: node.entityIds.companyId,
      branchId: node.entityIds.branchId,
      brandId: node.entityIds.brandId,
      routeId: node.entityIds.routeId,
      assignedAmount: newAmount,
      month: `${selectedYear}-${selectedMonth}`,
    };

    try {
      const response = await budgetService.createBudget(budgetData);
      if (response.success) {
        setTreeData((prevTreeData) =>
          updateNodeInTree(prevTreeData, node.id, newAmount)
        );
        toast.success("Presupuesto guardado correctamente");
      } else {
        toast.error(response.message || "Error al guardar el presupuesto");
      }
    } catch (error: any) {
      toast.error(`Error al guardar: ${error.message}`);
    }
  };

  const generateYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
      years.push(year.toString());
    }
    return years;
  };

  const generateMonthOptions = () => {
    return [
      { value: "01", label: "Enero" },
      { value: "02", label: "Febrero" },
      { value: "03", label: "Marzo" },
      { value: "04", label: "Abril" },
      { value: "05", label: "Mayo" },
      { value: "06", label: "Junio" },
      { value: "07", label: "Julio" },
      { value: "08", label: "Agosto" },
      { value: "09", label: "Septiembre" },
      { value: "10", label: "Octubre" },
      { value: "11", label: "Noviembre" },
      { value: "12", label: "Diciembre" },
    ];
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <h4 className="card-title">Gestión de Presupuestos</h4>
          <p className="text-muted mb-0">
            Selecciona el período para ver y asignar presupuestos.
          </p>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Año *</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Selecciona un año...</option>
                  {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Mes *</Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Selecciona un mes...</option>
                  {generateMonthOptions().map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="card-title">Árbol de Presupuestos</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p>Cargando datos...</p>
            </div>
          ) : (
            <BudgetTree data={treeData} onUpdateBudget={handleUpdateBudget} />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Budget;

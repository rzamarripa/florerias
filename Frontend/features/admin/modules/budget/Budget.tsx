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
        if (hasChanged && node.total !== undefined) {
          const newTotal = updatedChildren.reduce((sum, child) => {
            if (child.budgetAmount !== undefined) {
              return sum + child.budgetAmount;
            }
            if (child.total !== undefined) {
              return sum + child.total;
            }
            return sum;
          }, 0);
          return { ...node, children: updatedChildren, total: newTotal };
        }
        return { ...node, children: updatedChildren };
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
      !node.entityIds.branchId ||
      !node.entityIds.expenseConceptId
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
      expenseConceptId: node.entityIds.expenseConceptId,
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
    <Card>
      <Card.Header className="p-3 w-100">
        <Row className="align-items-center justify-content-between w-100">
          <Col md={6}>
            <h5 className="card-title">Árbol de Presupuestos</h5>
          </Col>
          <Col
            md={6}
            className="d-flex justify-content-between align-items-center gap-1"
          >
            <Form.Group className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0">Año: </Form.Label>
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
            <Form.Group className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0">Mes: </Form.Label>
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
  );
};

export default Budget;

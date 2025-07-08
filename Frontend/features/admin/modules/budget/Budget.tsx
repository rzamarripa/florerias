"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import BudgetTree from "./components/BudgetTree";
import { budgetService } from "./services/budgetService";
import { BudgetTreeNode } from "./types";

const Budget: React.FC = () => {
  const [treeData, setTreeData] = useState<BudgetTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, number>>(
    {}
  );
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>(
    {}
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;
    setSelectedMonth(currentMonth);
  }, []);

  // Cuando cambia el mes, solo carga el árbol
  useEffect(() => {
    if (selectedMonth) {
      loadTreeData();
    }
  }, [selectedMonth]);

  // Cuando cambia el árbol o el mes, carga los presupuestos
  useEffect(() => {
    if (selectedMonth && treeData.length > 0) {
      loadBudgetAmounts();
    }
  }, [selectedMonth, treeData]);

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

  const loadTreeData = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudgetTreeData();

      if (!response.success) {
        toast.error(response.message || "Error al cargar datos del árbol");
        return;
      }

      setTreeData(response.data || []);
    } catch (error: any) {
      toast.error(
        "Error al cargar datos del árbol: " +
          (error.message || "Error desconocido")
      );
      console.error("Error loading tree data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetAmounts = async () => {
    if (!selectedMonth || treeData.length === 0) return;

    try {
      const amounts: Record<string, number> = {};
      const editableNodes = treeData.filter(
        (node) =>
          node.type === "route" || (node.type === "branch" && !node.hasRoutes)
      );

      console.log(
        "[Budget] loadBudgetAmounts - Nodos editables encontrados:",
        editableNodes
      );

      // Mostrar específicamente nodos de tipo route
      const routeNodes = editableNodes.filter((node) => node.type === "route");
      console.log(
        "[Budget] loadBudgetAmounts - Nodos de tipo ROUTE:",
        routeNodes
      );

      for (const node of editableNodes) {
        const filters: any = {
          companyId: node.data?.companyId,
          categoryId: node.data?.categoryId,
          brandId: node.data?.brandId,
          month: selectedMonth,
        };
        if (node.type === "route") {
          filters.routeId = node.data?.routeId;
          console.log(
            `[Budget] loadBudgetAmounts - Consultando presupuesto para RUTA "${node.text}":`,
            filters
          );
        } else if (node.type === "branch") {
          filters.branchId = node.data?.branchId;
          console.log(
            `[Budget] loadBudgetAmounts - Consultando presupuesto para SUCURSAL "${node.text}":`,
            filters
          );
        }

        const nodeKey = node.id;
        const response = await budgetService.getBudgetsByMonth(
          selectedMonth,
          filters
        );

        console.log(
          `[Budget] loadBudgetAmounts - Respuesta para "${node.text}" (${node.type}):`,
          response
        );

        if (response.success && response.data && response.data.length > 0) {
          const budget = response.data[0];
          amounts[nodeKey] = budget.assignedAmount;
        } else {
          amounts[nodeKey] = 0;
        }
      }
      setBudgetAmounts(amounts);
      console.log("[Budget] loadBudgetAmounts - Amounts finales:", amounts);
    } catch (error: any) {
      console.error("Error loading budget amounts:", error);
    }
  };

  const handleBudgetChanged = () => {
    loadBudgetAmounts();
    loadTreeData();
  };

  const handleInputChange = (nodeId: string, value: number) => {
    const originalValue = budgetAmounts[nodeId] || 0;

    setPendingChanges((prev) => {
      const newChanges = { ...prev };

      if (value === originalValue) {
        delete newChanges[nodeId];
      } else {
        newChanges[nodeId] = value;
      }

      return newChanges;
    });
  };

  const findNodeById = (
    id: string,
    nodes: BudgetTreeNode[]
  ): BudgetTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
    }
    return null;
  };

  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info("No hay cambios para guardar");
      return;
    }

    setSaving(true);
    try {
      const promises = Object.entries(pendingChanges).map(
        async ([nodeId, amount]) => {
          const node = findNodeById(nodeId, treeData);
          if (!node) return;

          const budgetData = {
            categoryId: node.data?.categoryId || "",
            companyId: node.data?.companyId || "",
            branchId: node.data?.branchId || "",
            brandId: node.data?.brandId || "",
            routeId: node.data?.routeId || "",
            assignedAmount: amount,
            month: selectedMonth,
          };

          return budgetService.createBudget(budgetData);
        }
      );

      const results = await Promise.all(promises);
      const failedSaves = results.filter(
        (result: any) => result && !result.success
      );

      if (failedSaves.length > 0) {
        toast.error(`Error al guardar ${failedSaves.length} presupuesto(s)`);
      } else {
        toast.success("Presupuestos guardados correctamente");
        setPendingChanges({});
        handleBudgetChanged();
      }
    } catch (error: any) {
      toast.error(
        "Error al guardar presupuestos: " +
          (error.message || "Error desconocido")
      );
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = Object.entries(pendingChanges).some(
    ([nodeId, newValue]) => {
      const originalValue = budgetAmounts[nodeId] || 0;
      return newValue !== originalValue;
    }
  );

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const monthOptions = generateMonthOptions();

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <h4 className="card-title">Gestión de Presupuestos</h4>
          <p className="text-muted mb-0">
            Asigna presupuestos a rutas o sucursales según la configuración de
            cada unidad de negocio.
          </p>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Mes</Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  disabled={loading}
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
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-start w-100">
            <div>
              <h5 className="card-title">Árbol de Presupuesto</h5>
              <p className="text-muted mb-0">
                Haz clic en las rutas (si aplica) o sucursales para asignar
                presupuesto.
              </p>
            </div>
            {hasUnsavedChanges && (
              <Button
                variant="primary"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando árbol de presupuesto...</p>
            </div>
          ) : (
            <BudgetTree
              data={treeData}
              selectedMonth={selectedMonth}
              budgetAmounts={budgetAmounts}
              pendingChanges={pendingChanges}
              onInputChange={handleInputChange}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Budget;

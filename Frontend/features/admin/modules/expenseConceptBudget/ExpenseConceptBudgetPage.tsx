"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { expenseConceptBudgetService } from "./services/expenseConceptBudgetService";
import {
  ExpenseConcept,
  Department,
  BudgetByConceptResponse,
  PaidByConceptResponse,
  PendingByConceptResponse,
} from "./types";

interface ConceptWithBudget extends ExpenseConcept {
  budgetData?: BudgetByConceptResponse;
  paidData?: PaidByConceptResponse;
  pendingData?: PendingByConceptResponse;
  loading?: boolean;
}

const ExpenseConceptBudgetPage: React.FC = () => {
  const [concepts, setConcepts] = useState<ConceptWithBudget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);

    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      loadConcepts();
    }
  }, [selectedDepartment, selectedYear, selectedMonth]);

  const loadDepartments = async () => {
    try {
      const response = await expenseConceptBudgetService.getDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar departamentos");
      }
    } catch (error: any) {
      toast.error(
        "Error al cargar departamentos: " +
          (error.message || "Error desconocido")
      );
    }
  };

  const loadConcepts = async () => {
    setLoading(true);
    try {
      const filters = {
        ...(selectedDepartment && { departmentId: selectedDepartment }),
      };

      const response = await expenseConceptBudgetService.getAllExpenseConcepts(
        filters
      );

      if (response.success) {
        const conceptsData = response.data || [];
        setConcepts(
          conceptsData.map((concept) => ({ ...concept, loading: true }))
        );

        // Format month as YYYY-MM
        const formattedMonth = `${selectedYear}-${selectedMonth}`;

        // Load budget, paid and pending data for each concept
        await Promise.all(
          conceptsData.map(async (concept) => {
            try {
              // Load budget data
              const budgetResponse =
                await expenseConceptBudgetService.getBudgetByExpenseConceptId(
                  concept._id,
                  formattedMonth
                );

              // Load paid data
              const paidResponse =
                await expenseConceptBudgetService.getPaidByExpenseConceptId(
                  concept._id,
                  formattedMonth
                );

              // Load pending data
              const pendingResponse =
                await expenseConceptBudgetService.getPendingByExpenseConceptId(
                  concept._id,
                  formattedMonth
                );

              setConcepts((prev) =>
                prev.map((c) =>
                  c._id === concept._id
                    ? {
                        ...c,
                        budgetData: budgetResponse.success
                          ? budgetResponse.data
                          : undefined,
                        paidData: paidResponse.success
                          ? paidResponse.data
                          : undefined,
                        pendingData: pendingResponse.success
                          ? pendingResponse.data
                          : undefined,
                        loading: false,
                      }
                    : c
                )
              );
            } catch (error) {
              console.error(
                `Error loading data for concept ${concept._id}:`,
                error
              );
              setConcepts((prev) =>
                prev.map((c) =>
                  c._id === concept._id ? { ...c, loading: false } : c
                )
              );
            }
          })
        );
      } else {
        toast.error(response.message || "Error al cargar conceptos de gasto");
      }
    } catch (error: any) {
      toast.error(
        "Error al cargar datos: " + (error.message || "Error desconocido")
      );
      console.error("Error loading expense concepts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Presupuestos Por Conceptos</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Departamento</Form.Label>
                    <Form.Select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="">Todos los departamentos</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Año</Form.Label>
                    <Form.Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Mes</Form.Label>
                    <Form.Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="01">Enero</option>
                      <option value="02">Febrero</option>
                      <option value="03">Marzo</option>
                      <option value="04">Abril</option>
                      <option value="05">Mayo</option>
                      <option value="06">Junio</option>
                      <option value="07">Julio</option>
                      <option value="08">Agosto</option>
                      <option value="09">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </Spinner>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Concepto de Gasto</th>
                        <th>Departamento</th>
                        <th>Presupuesto Asignado</th>
                        <th>Pagado</th>
                        <th>Por Pagar</th>
                        <th>Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {concepts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">
                            No se encontraron datos para los filtros
                            seleccionados
                          </td>
                        </tr>
                      ) : (
                        concepts.map((concept, index) => (
                          <tr key={concept._id}>
                            <td>{index + 1}</td>
                            <td>
                              <div>
                                <strong>{concept.name}</strong>
                                {concept.description && (
                                  <div className="text-muted small">
                                    {concept.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{concept.departmentId?.name || "N/A"}</td>
                            <td>
                              {concept.loading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                formatCurrency(
                                  concept.budgetData?.totalAssigned || 0
                                )
                              )}
                            </td>
                            <td>
                              {concept.loading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                formatCurrency(concept.paidData?.totalPaid || 0)
                              )}
                            </td>
                            <td>
                              {concept.loading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                formatCurrency(
                                  concept.pendingData?.totalPending || 0
                                )
                              )}
                            </td>
                            <td>
                              {concept.loading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                (() => {
                                  const assigned =
                                    concept.budgetData?.totalAssigned || 0;
                                  const paid = concept.paidData?.totalPaid || 0;
                                  const pending =
                                    concept.pendingData?.totalPending || 0;
                                  const available = assigned - (paid + pending);

                                  const colorClass =
                                    available < 0
                                      ? "text-danger"
                                      : available === 0
                                      ? "text-warning"
                                      : "text-success";

                                  return (
                                    <span className={colorClass}>
                                      <strong>
                                        {formatCurrency(available)}
                                      </strong>
                                    </span>
                                  );
                                })()
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ExpenseConceptBudgetPage;

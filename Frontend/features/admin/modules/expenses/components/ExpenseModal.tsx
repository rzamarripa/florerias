"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { expensesService } from "../services/expenses";
import { Expense, CreateExpenseData, UpdateExpenseData } from "../types";
import { cashRegistersService } from "../../cash-registers/services/cashRegisters";
import { branchesService } from "../../branches/services/branches";
import { expenseConceptsService } from "../../expenseConcepts/services/expenseConcepts";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { toast } from "react-toastify";

interface ExpenseModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  expense?: Expense | null;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  show,
  onHide,
  onSuccess,
  expense,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCashRegisters, setLoadingCashRegisters] = useState<boolean>(false);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [loadingConcepts, setLoadingConcepts] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    concept: "",
    total: "",
    expenseType: "check_transfer" as "check_transfer" | "petty_cash",
    cashRegisterId: "",
    branchId: "",
  });

  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);

  const { getUserId } = useUserSessionStore();
  const { role, hasRole } = useUserRoleStore();

  const userId = getUserId();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");
  const isManager = hasRole("Gerente") || hasRole("Manager");

  // Cargar sucursales si el usuario es Administrador
  useEffect(() => {
    if (show && isAdmin) {
      loadBranches();
    }
  }, [show, isAdmin]);

  // Cargar cajas cuando se selecciona tipo "petty_cash"
  useEffect(() => {
    if (show && formData.expenseType === "petty_cash") {
      if (isManager) {
        // Si es gerente, cargar sus cajas directamente
        loadCashRegistersByManager();
      } else if (isAdmin && formData.branchId) {
        // Si es admin y ya seleccionó una sucursal, cargar las cajas de esa sucursal
        loadCashRegistersByBranch(formData.branchId);
      }
    }
  }, [show, formData.expenseType, formData.branchId, isAdmin, isManager]);

  // Cargar conceptos de gasto cuando se abre el modal
  useEffect(() => {
    if (show) {
      loadExpenseConcepts();
    }
  }, [show]);

  useEffect(() => {
    if (expense) {
      setFormData({
        paymentDate: new Date(expense.paymentDate).toISOString().split("T")[0],
        concept: expense.concept?._id || "",
        total: expense.total.toString(),
        expenseType: expense.expenseType,
        cashRegisterId: expense.cashRegister?._id || "",
        branchId: "",
      });
    } else {
      setFormData({
        paymentDate: new Date().toISOString().split("T")[0],
        concept: "",
        total: "",
        expenseType: "check_transfer",
        cashRegisterId: "",
        branchId: "",
      });
    }
  }, [expense, show]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await branchesService.getUserBranches();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error("Error loading branches:", error);
      toast.error("Error al cargar las sucursales");
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadCashRegistersByManager = async () => {
    try {
      setLoadingCashRegisters(true);
      const response = await cashRegistersService.getAllCashRegisters({
        isActive: true,
        limit: 1000,
      });
      if (response.success) {
        setCashRegisters(response.data);
      }
    } catch (error) {
      console.error("Error loading cash registers:", error);
      toast.error("Error al cargar las cajas");
    } finally {
      setLoadingCashRegisters(false);
    }
  };

  const loadCashRegistersByBranch = async (branchId: string) => {
    try {
      setLoadingCashRegisters(true);
      const response = await cashRegistersService.getAllCashRegisters({
        branchId,
        isActive: true,
        limit: 1000,
      });
      if (response.success) {
        setCashRegisters(response.data);
      }
    } catch (error) {
      console.error("Error loading cash registers:", error);
      toast.error("Error al cargar las cajas");
    } finally {
      setLoadingCashRegisters(false);
    }
  };

  const loadExpenseConcepts = async () => {
    try {
      setLoadingConcepts(true);
      const response = await expenseConceptsService.getAllExpenseConcepts({
        isActive: true,
        limit: 1000,
      });
      if (response.success) {
        setExpenseConcepts(response.data);
      }
    } catch (error) {
      console.error("Error loading expense concepts:", error);
      toast.error("Error al cargar los conceptos de gastos");
    } finally {
      setLoadingConcepts(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentDate || !formData.concept || !formData.total) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const totalValue = parseFloat(formData.total);
    if (isNaN(totalValue) || totalValue <= 0) {
      toast.error("El total debe ser un número mayor a 0");
      return;
    }

    // Validar caja chica
    if (formData.expenseType === "petty_cash") {
      if (isAdmin && !formData.branchId) {
        toast.error("Por favor selecciona una sucursal");
        return;
      }
      if (!formData.cashRegisterId) {
        toast.error("Por favor selecciona una caja registradora");
        return;
      }
    }

    try {
      setLoading(true);

      if (expense) {
        // Actualizar gasto existente
        const updateData: UpdateExpenseData = {
          paymentDate: formData.paymentDate,
          concept: formData.concept,
          total: totalValue,
          expenseType: formData.expenseType,
          ...(formData.expenseType === "petty_cash" && {
            cashRegisterId: formData.cashRegisterId,
          }),
        };

        const response = await expensesService.updateExpense(
          expense._id,
          updateData
        );

        if (response.success) {
          toast.success("Gasto actualizado exitosamente");
          onSuccess();
          onHide();
        }
      } else {
        // Crear nuevo gasto
        const createData: CreateExpenseData = {
          paymentDate: formData.paymentDate,
          concept: formData.concept,
          total: totalValue,
          expenseType: formData.expenseType,
          ...(formData.expenseType === "petty_cash" && {
            cashRegisterId: formData.cashRegisterId,
          }),
        };

        const response = await expensesService.createExpense(createData);

        if (response.success) {
          toast.success("Gasto creado exitosamente");
          onSuccess();
          onHide();
        }
      }
    } catch (error: any) {
      console.error("Error al guardar gasto:", error);
      toast.error(
        error?.message || "Error al guardar el gasto. Por favor intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={!loading}
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
        }}
      >
        <Modal.Title className="fw-bold">
          {expense ? "Editar Gasto" : "Nuevo Gasto"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <div className="row g-3">
            {/* Tipo de Gasto */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Tipo de Gasto <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="expenseType"
                  value={formData.expenseType}
                  onChange={(e) => {
                    handleChange(e);
                    // Resetear campos de caja al cambiar tipo
                    if (e.target.value !== "petty_cash") {
                      setFormData((prev) => ({
                        ...prev,
                        cashRegisterId: "",
                        branchId: "",
                      }));
                      setCashRegisters([]);
                    }
                  }}
                  required
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                >
                  <option value="check_transfer">Cheque / Transferencia</option>
                  <option value="petty_cash">Caja Chica</option>
                </Form.Select>
              </Form.Group>
            </div>

            {/* Sucursal (solo para Admin con petty_cash) */}
            {formData.expenseType === "petty_cash" && isAdmin && (
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Sucursal <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="branchId"
                    value={formData.branchId}
                    onChange={(e) => {
                      handleChange(e);
                      // Resetear caja al cambiar sucursal
                      setFormData((prev) => ({
                        ...prev,
                        branchId: e.target.value,
                        cashRegisterId: "",
                      }));
                      setCashRegisters([]);
                    }}
                    required
                    disabled={loadingBranches}
                    style={{
                      borderRadius: "8px",
                      border: "2px solid #e9ecef",
                    }}
                  >
                    <option value="">
                      {loadingBranches
                        ? "Cargando sucursales..."
                        : "Selecciona una sucursal"}
                    </option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            )}

            {/* Caja Registradora (para petty_cash) */}
            {formData.expenseType === "petty_cash" &&
              ((isManager) || (isAdmin && formData.branchId)) && (
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Caja Registradora <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="cashRegisterId"
                      value={formData.cashRegisterId}
                      onChange={handleChange}
                      required
                      disabled={loadingCashRegisters}
                      style={{
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                      }}
                    >
                      <option value="">
                        {loadingCashRegisters
                          ? "Cargando cajas..."
                          : "Selecciona una caja"}
                      </option>
                      {cashRegisters.map((cashRegister) => (
                        <option key={cashRegister._id} value={cashRegister._id}>
                          {cashRegister.name} - Saldo: $
                          {cashRegister.currentBalance.toFixed(2)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              )}

            {/* Fecha de Pago */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Fecha de Pago <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  required
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                />
              </Form.Group>
            </div>

            {/* Concepto */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Concepto <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="concept"
                  value={formData.concept}
                  onChange={handleChange}
                  required
                  disabled={loadingConcepts}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                >
                  <option value="">
                    {loadingConcepts
                      ? "Cargando conceptos..."
                      : "Selecciona un concepto"}
                  </option>
                  {expenseConcepts.map((concept) => (
                    <option key={concept._id} value={concept._id}>
                      {concept.name}
                      {concept.description && ` - ${concept.description}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            {/* Total */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Total <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="total"
                  value={formData.total}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                />
              </Form.Group>
            </div>

            {expense && (
              <>
                {/* Folio (solo lectura en edición) */}
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-semibold">Folio</Form.Label>
                    <Form.Control
                      type="text"
                      value={expense.folio}
                      disabled
                      style={{
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                        backgroundColor: "#f8f9fa",
                      }}
                    />
                  </Form.Group>
                </div>
              </>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer
          style={{
            borderTop: "2px solid #f1f3f5",
            padding: "1rem 1.5rem",
          }}
        >
          <Button
            variant="light"
            onClick={onHide}
            disabled={loading}
            style={{
              borderRadius: "8px",
              padding: "8px 20px",
              fontWeight: "600",
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontWeight: "600",
            }}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Guardando...
              </>
            ) : expense ? (
              "Actualizar Gasto"
            ) : (
              "Crear Gasto"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ExpenseModal;

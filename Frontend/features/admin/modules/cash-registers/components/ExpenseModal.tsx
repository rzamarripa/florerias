"use client";

import React, { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { cashRegistersService } from "../services/cashRegisters";
import { CashRegister } from "../types";

interface ExpenseModalProps {
  show: boolean;
  onHide: () => void;
  cashRegister: CashRegister;
  onExpenseRegistered: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  show,
  onHide,
  cashRegister,
  onExpenseRegistered,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    expenseConcept: "",
    amount: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.expenseConcept.trim()) {
      toast.error("El concepto del gasto es requerido");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un número positivo");
      return;
    }

    if (amount > cashRegister.currentBalance) {
      toast.error("El monto del gasto excede el saldo disponible en la caja");
      return;
    }

    try {
      setLoading(true);
      const response = await cashRegistersService.registerExpense(
        cashRegister._id,
        {
          expenseConcept: formData.expenseConcept.trim(),
          amount: amount,
        }
      );

      if (response.success) {
        toast.success(response.message || "Gasto registrado exitosamente");
        setFormData({ expenseConcept: "", amount: "" });
        onExpenseRegistered();
        onHide();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el gasto");
      console.error("Error al registrar gasto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ expenseConcept: "", amount: "" });
      onHide();
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center gap-2">
            <span>Registrar Gasto</span>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3 p-3 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">Caja:</small>
                <div className="fw-bold">{cashRegister.name}</div>
              </div>
              <div className="text-end">
                <small className="text-muted">Saldo disponible:</small>
                <div className="fw-bold text-success fs-5">
                  {formatCurrency(cashRegister.currentBalance)}
                </div>
              </div>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Concepto del gasto <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="expenseConcept"
              value={formData.expenseConcept}
              onChange={handleInputChange}
              placeholder="Ej: Compra de material de empaque, pago de servicio, etc."
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Monto <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Ingresa el monto del gasto (máximo:{" "}
              {formatCurrency(cashRegister.currentBalance)})
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
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
                Registrando...
              </>
            ) : (
              "Registrar Gasto"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ExpenseModal;

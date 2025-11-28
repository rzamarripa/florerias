"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Spinner, Alert } from "react-bootstrap";
import { DollarSign, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { orderPaymentsService, OrderPayment } from "../services/orderPayments";
import { cashRegistersService, CashRegister } from "../services/cashRegisters";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Sale } from "../types";

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  sale: Sale;
  onPaymentAdded?: () => void;
}

interface PaymentMethod {
  _id: string;
  name: string;
  status: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  onHide,
  sale,
  onPaymentAdded,
}) => {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedCashRegister, setSelectedCashRegister] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const userId = useUserSessionStore((state) => state.getUserId());

  useEffect(() => {
    if (show && sale) {
      loadPayments();
      loadCashRegisters();
      loadPaymentMethods();
    }
  }, [show, sale]);

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const paymentsData = await orderPaymentsService.getOrderPayments(sale._id);
      setPayments(paymentsData);
    } catch (error: any) {
      console.error("Error loading payments:", error);
      toast.error(error.message || "Error al cargar los pagos");
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadCashRegisters = async () => {
    try {
      // Extraer el ID de la sucursal (puede ser string o objeto poblado)
      const branchId: string = typeof sale.branchId === 'string'
        ? sale.branchId
        : sale.branchId._id;

      const cashRegisterData = await cashRegistersService.getOpenCashRegistersByBranch(branchId);
      setCashRegisters(cashRegisterData);

      // Auto-seleccionar si solo hay una caja abierta
      if (cashRegisterData.length === 1) {
        setSelectedCashRegister(cashRegisterData[0]._id);
      }
    } catch (error: any) {
      console.error("Error loading cash registers:", error);
      toast.error(error.message || "Error al cargar las cajas registradoras");
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        status: true,
      });
      if (response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error: any) {
      console.error("Error loading payment methods:", error);
      toast.error(error.message || "Error al cargar los métodos de pago");
    }
  };

  // Verificar si el método de pago seleccionado es efectivo
  const isEffectivoSelected = () => {
    if (!selectedPaymentMethod) return false;
    const method = paymentMethods.find(pm => pm._id === selectedPaymentMethod);
    return method?.name.toLowerCase() === 'efectivo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("No se pudo obtener el ID del usuario");
      return;
    }

    const amountNum = parseFloat(amount);

    // Validaciones
    if (!amount || amountNum <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (amountNum > sale.remainingBalance) {
      toast.error(`El monto no puede exceder el saldo pendiente ($${sale.remainingBalance.toFixed(2)})`);
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }

    // Solo validar caja si el método de pago es efectivo
    if (isEffectivoSelected() && !selectedCashRegister) {
      toast.error("Selecciona una caja registradora");
      return;
    }

    try {
      setSubmitting(true);

      await orderPaymentsService.createOrderPayment({
        orderId: sale._id,
        amount: amountNum,
        paymentMethod: selectedPaymentMethod,
        cashRegisterId: isEffectivoSelected() ? selectedCashRegister : null,
        registeredBy: userId,
        notes: notes.trim(),
      });

      toast.success("Pago registrado exitosamente");

      // Limpiar formulario
      setAmount("");
      setSelectedPaymentMethod("");
      setNotes("");

      // Recargar pagos
      await loadPayments();

      // Notificar al componente padre
      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pago?")) return;

    try {
      await orderPaymentsService.deleteOrderPayment(paymentId);
      toast.success("Pago eliminado exitosamente");
      await loadPayments();

      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      toast.error(error.message || "Error al eliminar el pago");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <DollarSign size={24} className="text-primary" />
              <span>Pagos de la Venta</span>
            </div>
            <div className="text-muted" style={{ fontSize: "14px" }}>
              {sale.orderNumber}
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Información de la venta */}
        <div className="mb-4 p-3 bg-light rounded">
          <div className="row">
            <div className="col-6">
              <small className="text-muted">Cliente</small>
              <div className="fw-semibold">{sale.clientInfo?.name || "N/A"}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Total de la venta</small>
              <div className="fw-semibold">${sale.total.toFixed(2)}</div>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-6">
              <small className="text-muted">Anticipo inicial</small>
              <div className="fw-semibold text-success">${(sale.advance - totalPaid).toFixed(2)}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Saldo pendiente</small>
              <div className="fw-semibold text-danger">${sale.remainingBalance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabla de pagos realizados */}
        <div className="mb-4">
          <h6 className="fw-semibold mb-3">Pagos Realizados</h6>
          {loadingPayments ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" variant="primary" />
            </div>
          ) : payments.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No hay pagos adicionales registrados para esta venta.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Caja</th>
                    <th>Registrado por</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{formatDate(payment.date)}</td>
                      <td className="fw-semibold text-success">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td>{payment.paymentMethod?.name || "N/A"}</td>
                      <td>{payment.cashRegisterId?.name || "N/A"}</td>
                      <td>{payment.registeredBy?.username || "N/A"}</td>
                      <td className="text-center">
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => handleDeletePayment(payment._id)}
                          className="border-0"
                          title="Eliminar pago"
                        >
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td className="fw-bold">Total pagado adicional:</td>
                    <td className="fw-bold text-success" colSpan={5}>
                      ${totalPaid.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </div>

        {/* Formulario para nuevo pago */}
        {sale.remainingBalance > 0 && (
          <div className="border-top pt-4">
            <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
              <Plus size={18} />
              Registrar Nuevo Pago
            </h6>

            {cashRegisters.length === 0 && paymentMethods.some(pm => pm.name.toLowerCase() === 'efectivo') ? (
              <Alert variant="warning">
                No hay cajas registradoras abiertas en esta sucursal. Las cajas solo son necesarias para pagos en efectivo.
              </Alert>
            ) : null}

            <Form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>Monto *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={sale.remainingBalance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                      <Form.Text className="text-muted">
                        Máximo: ${sale.remainingBalance.toFixed(2)}
                      </Form.Text>
                    </Form.Group>
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>Método de Pago *</Form.Label>
                      <Form.Select
                        value={selectedPaymentMethod}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        required
                      >
                        <option value="">Selecciona un método</option>
                        {paymentMethods.map((method) => (
                          <option key={method._id} value={method._id}>
                            {method.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>
                        Caja Registradora {isEffectivoSelected() ? "*" : "(solo para efectivo)"}
                      </Form.Label>
                      <Form.Select
                        value={selectedCashRegister}
                        onChange={(e) => setSelectedCashRegister(e.target.value)}
                        required={isEffectivoSelected()}
                        disabled={!isEffectivoSelected()}
                        className={!isEffectivoSelected() ? "bg-light" : ""}
                      >
                        <option value="">Selecciona una caja</option>
                        {cashRegisters.map((cashRegister) => (
                          <option key={cashRegister._id} value={cashRegister._id}>
                            {cashRegister.name} - {cashRegister.branchId?.branchName || ""}
                          </option>
                        ))}
                      </Form.Select>
                      {!isEffectivoSelected() && (
                        <Form.Text className="text-muted">
                          La caja registradora solo se requiere para pagos en efectivo
                        </Form.Text>
                      )}
                    </Form.Group>
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>Notas (opcional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={1}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Agrega notas sobre este pago..."
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={submitting}
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                    className="d-flex align-items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Registrar Pago
                      </>
                    )}
                  </Button>
                </div>
              </Form>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PaymentModal;

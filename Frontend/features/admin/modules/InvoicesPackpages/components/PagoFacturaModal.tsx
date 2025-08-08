import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { expenseConceptService } from "../../expenseConcepts/services/expenseConcepts";
import {
  getBudgetByExpenseConcept,
  BudgetByExpenseConceptResult,
} from "../services/budget";
import { InfoIcon } from "lucide-react";
import { formatCurrency } from "@/utils";

interface ExpenseConcept {
  _id: string;
  name: string;
  description: string;
  categoryId: {
    _id: string;
    name: string;
  };
  departmentId: {
    _id: string;
    name: string;
  };
}

interface PagoFacturaModalProps {
  show: boolean;
  onClose: () => void;
  tipoPago: "completo" | "parcial";
  saldo: number;
  invoiceId: string | null;
  companyId?: string;
  brandId?: string;
  branchId?: string;
  selectedYear?: number;
  selectedMonth?: number;
  tempPayments?: {
    [invoiceId: string]: {
      tipoPago: "completo" | "parcial";
      descripcion: string;
      monto?: number;
      originalImportePagado: number;
      originalSaldo: number;
      conceptoGasto?: string;
    };
  };
  tempCashPayments?: {
    _id: string;
    importeAPagar: number;
    expenseConcept: {
      _id: string;
      name: string;
      categoryId?: {
        _id: string;
        name: string;
      };
    };
    description?: string;
    createdAt: string;
  }[];
  invoices?: any[];
  onSuccess: (
    invoiceId: string,
    tipoPago: "completo" | "parcial",
    descripcion: string,
    monto?: number,
    conceptoGasto?: string
  ) => void;
}

const PagoFacturaModal: React.FC<PagoFacturaModalProps> = ({
  show,
  onClose,
  tipoPago,
  saldo,
  invoiceId,
  companyId,
  brandId,
  branchId,
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth(),
  tempPayments = {},
  tempCashPayments = [],
  invoices = [],
  onSuccess,
}) => {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [conceptoGasto, setConceptoGasto] = useState("");
  const [conceptosGasto, setConceptosGasto] = useState<ExpenseConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConceptos, setLoadingConceptos] = useState(false);
  const [budgetData, setBudgetData] =
    useState<BudgetByExpenseConceptResult | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [exceedsbudget, setExceedsBudget] = useState(false);
  const { user } = useUserSessionStore();

  useEffect(() => {
    if (show && user?.departmentId) {
      loadConceptosGasto();
    }
  }, [show, user?.departmentId]);

  useEffect(() => {
    if (conceptoGasto && companyId && brandId && branchId) {
      loadBudgetData();
    } else {
      setBudgetData(null);
      setExceedsBudget(false);
    }
  }, [conceptoGasto, companyId, brandId, branchId, selectedYear, selectedMonth]);

  const loadConceptosGasto = async () => {
    if (!user?.departmentId) return;

    try {
      setLoadingConceptos(true);
      const response = await expenseConceptService.getByDepartment(
        user.departmentId
      );

      if (response.data && Array.isArray(response.data)) {
        setConceptosGasto(response.data);
      } else {
        toast.error("Error al cargar los conceptos de gasto");
      }
    } catch (error) {
      console.error("Error cargando conceptos de gasto:", error);
      toast.error("Error al cargar los conceptos de gasto");
    } finally {
      setLoadingConceptos(false);
    }
  };

  const loadBudgetData = async () => {
    if (!conceptoGasto || !companyId || !brandId || !branchId) return;

    try {
      setLoadingBudget(true);
      const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

      const budgetInfo = await getBudgetByExpenseConcept({
        expenseConceptId: conceptoGasto,
        companyId,
        brandId,
        branchId,
        month,
      });

      // Calcular el gasto adicional del estado local que aún no se ha enviado
      let localSpent = 0;
      
      // Sumar pagos temporales de facturas para el mismo concepto
      Object.entries(tempPayments).forEach(([invoiceIdKey, payment]) => {
        if (payment.conceptoGasto === conceptoGasto) {
          if (payment.tipoPago === "completo") {
            const invoice = invoices.find((inv: any) => inv._id === invoiceIdKey);
            if (invoice) {
              localSpent += invoice.importeAPagar - invoice.importePagado;
            }
          } else if (payment.tipoPago === "parcial" && payment.monto) {
            localSpent += payment.monto;
          }
        }
      });
      
      // Sumar pagos en efectivo temporales para el mismo concepto
      tempCashPayments.forEach((cashPayment) => {
        if (cashPayment.expenseConcept._id === conceptoGasto) {
          localSpent += cashPayment.importeAPagar;
        }
      });

      // Ajustar el presupuesto disponible considerando el estado local
      const adjustedBudgetInfo = {
        ...budgetInfo,
        totalSpent: budgetInfo.totalSpent + localSpent,
        availableBudget: budgetInfo.availableBudget - localSpent
      };

      setBudgetData(adjustedBudgetInfo);

      const montoAPagar = tipoPago === "completo" ? saldo : Number(monto) || 0;
      const excede = montoAPagar >= adjustedBudgetInfo.availableBudget;
        
      if (excede && montoAPagar > 0) {
        toast.warning("Presupuesto excedido. Se requerirá un folio de autorización");
      }
      
      setExceedsBudget(excede);
    } catch (error) {
      console.error(
        "Error al cargar información de presupuesto:",
        error
      );
      setBudgetData(null);
      setExceedsBudget(false);
    } finally {
      setLoadingBudget(false);
    }
  };

  useEffect(() => {
    if (budgetData) {
      const montoAPagar = tipoPago === "completo" ? saldo : Number(monto) || 0;
      const excede = montoAPagar >= budgetData.availableBudget;

      if (excede && !exceedsbudget && montoAPagar > 0) {
        toast.warning(
          "Presupuesto excedido. Se requerirá un folio de autorización"
        );
      }

      setExceedsBudget(excede);
    }
  }, [monto, tipoPago, saldo, budgetData, exceedsbudget]);

  const handleOk = async () => {
    if (!invoiceId) {
      toast.error("ID de factura no válido");
      return;
    }

    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }

    if (!conceptoGasto) {
      toast.error("Debe seleccionar un concepto de gasto");
      return;
    }

    if (tipoPago === "parcial" && (!monto || Number(monto) <= 0)) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (tipoPago === "parcial" && Number(monto) > saldo) {
      toast.error("El monto no puede exceder el saldo disponible");
      return;
    }

    try {
      setLoading(true);

      onSuccess(
        invoiceId,
        tipoPago,
        descripcion,
        tipoPago === "parcial" ? Number(monto) : undefined,
        conceptoGasto
      );

      setDescripcion("");
      setMonto("");
      setConceptoGasto("");
      onClose();
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescripcion("");
    setMonto("");
    setConceptoGasto("");
    setBudgetData(null);
    setExceedsBudget(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Body className="text-center p-4">
        <div className="mb-3 d-flex justify-content-center">
          <div
            className="border border-info rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 48, height: 48 }}
          >
            <InfoIcon className="text-info" size={24} />
          </div>
        </div>
        <h4 className="fw-bold mb-2">
          {tipoPago === "completo"
            ? "Introduce la descripción:"
            : "Introduce la cantidad a pagar y la descripción:"}
        </h4>
        <div className="mb-2">
          Su Saldo es:{" "}
          <span className="fw-medium">${saldo.toLocaleString()}</span>
        </div>

        <Form.Group className="mb-2">
          <Form.Label>
            Concepto de Gasto <span className="text-danger">*</span>
          </Form.Label>
          <Form.Select
            value={conceptoGasto}
            onChange={(e) => {
              setConceptoGasto(e.target.value);
            }}
            disabled={loadingConceptos}
            required
          >
            <option value="">Seleccione un concepto de gasto...</option>
            {(Array.isArray(conceptosGasto) ? conceptosGasto : []).map(
              (concepto) => (
                <option key={concepto._id} value={concepto._id}>
                  {concepto.categoryId.name} - {concepto.name}
                </option>
              )
            )}
          </Form.Select>
          {loadingConceptos && (
            <small className="text-muted">Cargando conceptos...</small>
          )}
        </Form.Group>

        {loadingBudget && (
          <div className="text-center mb-3">
            <Spinner animation="border" size="sm" className="me-2" />
            <small className="text-muted">
              Cargando información de presupuesto...
            </small>
          </div>
        )}

        {budgetData && (
          <div className="mb-3">
            <div className="border rounded p-3 bg-light">
              <h6 className="mb-2">📊 Información del Presupuesto</h6>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted d-block">
                    Presupuesto Total:
                  </small>
                  <strong>{formatCurrency(budgetData.totalBudget)}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Ya Gastado:</small>
                  <strong className="text-warning">
                    {formatCurrency(budgetData.totalSpent)}
                  </strong>
                </div>
                <div className="col-12 mt-2">
                  <small className="text-muted d-block">Disponible:</small>
                  <strong
                    className={
                      budgetData.availableBudget > 0
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    {formatCurrency(budgetData.availableBudget)}
                  </strong>
                </div>
              </div>

              {budgetData &&
                (tipoPago === "completo" || (monto && Number(monto) > 0)) && (
                  <div className="mt-2 pt-2 border-top">
                    <small className="text-muted d-block">
                      Después del pago quedará:
                    </small>
                    <strong
                      className={
                        budgetData.availableBudget -
                          (tipoPago === "completo"
                            ? saldo
                            : Number(monto) || 0) >
                        0
                          ? "text-success"
                          : "text-danger"
                      }
                    >
                      {formatCurrency(
                        Math.max(
                          0,
                          budgetData.availableBudget -
                            (tipoPago === "completo"
                              ? saldo
                              : Number(monto) || 0)
                        )
                      )}
                    </strong>
                  </div>
                )}
            </div>
          </div>
        )}

        {tipoPago === "parcial" && (
          <Form.Group className="mb-2">
            <Form.Control
              type="number"
              min="1"
              max={saldo}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Cantidad"
              className=""
            />
          </Form.Group>
        )}
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción"
            className="shadow-none"
          />
        </Form.Group>
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button variant="light" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleOk} disabled={loading}>
            {loading ? "Procesando..." : "Guardar"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PagoFacturaModal;

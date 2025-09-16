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
  routeId?: string;
  selectedPaymentDate?: string;
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
  routeId,
  selectedPaymentDate,
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
  const [isEditing, setIsEditing] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const { user } = useUserSessionStore();

  useEffect(() => {
    if (show && invoiceId) {
      const invoice = invoices.find((inv: any) => inv._id === invoiceId);
      if (invoice) {
        setIsEditing(invoice.importePagado > 0);
        setIsBlacklisted(invoice.providerStatus === 'blacklist');
      }
    }
  }, [show, invoiceId, invoices]);

  useEffect(() => {
    if (show && user?.departmentId) {
      loadConceptosGasto();
    }
  }, [show, user?.departmentId]);

  useEffect(() => {
    // Cargar presupuesto cuando se tenga concepto y estructura mínima (company/brand/branch)
    // routeId es opcional - si no hay rutas, se consulta a nivel de sucursal
    if (conceptoGasto && companyId && brandId && branchId) {
      loadBudgetData();
    } else {
      setBudgetData(null);
    }
  }, [
    conceptoGasto,
    companyId,
    brandId,
    branchId,
    routeId,
    selectedPaymentDate,
  ]);

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
    if (!conceptoGasto || !companyId || !brandId || !branchId) {
      console.warn(
        "❌ PagoFacturaModal: Faltan parámetros requeridos para cargar presupuesto",
        {
          conceptoGasto,
          companyId,
          brandId,
          branchId,
          routeId,
        }
      );
      return;
    }

    try {
      setLoadingBudget(true);

      // Extraer año y mes de selectedPaymentDate o usar fecha actual como fallback
      let month: string;
      if (selectedPaymentDate) {
        const paymentDate = new Date(selectedPaymentDate);
        month = `${paymentDate.getFullYear()}-${String(
          paymentDate.getMonth() + 1
        ).padStart(2, "0")}`;
      } else {
        const today = new Date();
        month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      console.log("🔍 PagoFacturaModal: Cargando presupuesto con parámetros:", {
        expenseConceptId: conceptoGasto,
        companyId,
        brandId,
        branchId,
        routeId: routeId || "No especificado (nivel sucursal)",
        month,
      });

      const budgetInfo = await getBudgetByExpenseConcept({
        expenseConceptId: conceptoGasto,
        companyId,
        brandId,
        branchId,
        month,
        routeId,
      });

      console.log(
        "📊 PagoFacturaModal: Respuesta del presupuesto:",
        budgetInfo
      );

      let localSpent = 0;

      Object.entries(tempPayments).forEach(([invoiceIdKey, payment]) => {
        if (payment.conceptoGasto === conceptoGasto) {
          if (payment.tipoPago === "completo") {
            const invoice = invoices.find(
              (inv: any) => inv._id === invoiceIdKey
            );
            if (invoice) {
              localSpent += invoice.importeAPagar - invoice.importePagado;
            }
          } else if (payment.tipoPago === "parcial" && payment.monto) {
            localSpent += payment.monto;
          }
        }
      });

      tempCashPayments.forEach((cashPayment) => {
        if (cashPayment.expenseConcept._id === conceptoGasto) {
          localSpent += cashPayment.importeAPagar;
        }
      });

      const adjustedBudgetInfo = {
        ...budgetInfo,
        totalSpent: budgetInfo.totalSpent + localSpent,
        availableBudget: budgetInfo.availableBudget - localSpent,
      };

      setBudgetData(adjustedBudgetInfo);
    } catch (error) {
      console.error("Error al cargar información de presupuesto:", error);
      setBudgetData(null);
    } finally {
      setLoadingBudget(false);
    }
  };

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

    if (budgetData) {
      const montoAPagar = tipoPago === "completo" ? saldo : Number(monto) || 0;
      const excede = montoAPagar >= budgetData.availableBudget;

      if (excede && montoAPagar > 0) {
        toast.warning(
          "Presupuesto excedido. Se requerirá un folio de autorización"
        );
      }
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
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Body className="p-4">
        <div className="mb-3 d-flex justify-content-center">
          <div
            className="border border-info rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 48, height: 48 }}
          >
            <InfoIcon className="text-info" size={24} />
          </div>
        </div>

        <h4 className="fw-bold mb-3 text-center">
          {isEditing ? "Editar Pago de Factura" : "Nuevo Pago de Factura"}
        </h4>

        {isBlacklisted && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>
              <strong>Factura no pagable:</strong> Esta factura no puede ser pagada porque el proveedor está en la lista negra.
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="text-center">
            <small className="text-muted">Saldo disponible:</small>
            <div className="h4 text-warning mb-0">
              ${saldo.toLocaleString()}
            </div>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>
            Concepto de Gasto <span className="text-danger">*</span>
          </Form.Label>
          <Form.Select
            value={conceptoGasto}
            onChange={(e) => {
              setConceptoGasto(e.target.value);
            }}
            disabled={loadingConceptos || isBlacklisted}
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
          <Form.Group className="mb-3">
            <Form.Label>
              Cantidad a Pagar <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="number"
              min="1"
              max={saldo}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Cantidad"
              className=""
              disabled={isBlacklisted}
            />
            <small className="text-muted">
              Saldo disponible: {formatCurrency(saldo)}
            </small>
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label>
            Descripción del Pago <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del pago..."
            className="shadow-none"
            disabled={isBlacklisted}
          />
        </Form.Group>

        <div className="d-flex justify-content-center gap-2 mt-4">
          <Button variant="light" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleOk} disabled={loading || isBlacklisted}>
            {loading
              ? "Procesando..."
              : isEditing
              ? "Actualizar Pago"
              : "Guardar Pago"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PagoFacturaModal;

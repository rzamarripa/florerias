import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { cashPaymentSchema, CashPaymentFormData } from "../schemas/cashPaymentSchema";
import { expenseConceptService } from "../../expenseConcepts/services/expenseConcepts";
import { getBudgetByExpenseConcept, BudgetByExpenseConceptResult } from "../../InvoicesPackpages/services/budget";
import { formatCurrency } from "@/utils";

interface CashPaymentModalSimpleProps {
    show: boolean;
    onHide: () => void;
    onSuccess: (data: CashPaymentFormData) => void;
    loading?: boolean;
    departmentId?: string;
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
}

export const CashPaymentModalSimple: React.FC<CashPaymentModalSimpleProps> = ({
    show,
    onHide,
    onSuccess,
    loading,
    departmentId,
    companyId,
    brandId,
    branchId,
    selectedYear = new Date().getFullYear(),
    selectedMonth = new Date().getMonth(),
    tempPayments = {},
    tempCashPayments = [],
    invoices = []
}) => {
    const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);
    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [budgetData, setBudgetData] = useState<BudgetByExpenseConceptResult | null>(null);
    const [loadingBudget, setLoadingBudget] = useState(false);
    const [exceedsBudget, setExceedsBudget] = useState(false);

    const form = useForm<CashPaymentFormData>({
        resolver: zodResolver(cashPaymentSchema),
        defaultValues: { importeAPagar: 0, expenseConcept: "", description: "" },
    });

    const { register, handleSubmit, formState: { errors }, reset, watch } = form;
    const watchedValues = watch();

    useEffect(() => {
        if (show) {
            reset({ importeAPagar: 0, expenseConcept: "", description: "" });
            setSubmitError(null);
            setBudgetData(null);
            setExceedsBudget(false);
        }
    }, [show, reset]);


    useEffect(() => {
        const fetchConcepts = async () => {
            setLoadingConcepts(true);
            try {
                let res;
                if (departmentId) {
                    res = await expenseConceptService.getByDepartment(departmentId);
                    setExpenseConcepts(Array.isArray(res.data) ? res.data : []);
                } else {
                    res = await expenseConceptService.getActive();
                    setExpenseConcepts(Array.isArray(res.data) ? res.data : []);
                }
            } catch {
                setExpenseConcepts([]);
            }
            setLoadingConcepts(false);
        };
        if (show) fetchConcepts();
    }, [show, departmentId]);

    // Cargar información de presupuesto cuando se selecciona un concepto
    useEffect(() => {
        if (watchedValues.expenseConcept && companyId && brandId && branchId) {
            loadBudgetData();
        } else {
            setBudgetData(null);
            setExceedsBudget(false);
        }
    }, [watchedValues.expenseConcept, companyId, brandId, branchId, selectedYear, selectedMonth]);

    // Verificar exceso de presupuesto cuando cambia el monto
    useEffect(() => {
        if (budgetData && watchedValues.importeAPagar) {
            const montoAPagar = Number(watchedValues.importeAPagar);
            const excede = montoAPagar >= budgetData.availableBudget;
            
            if (excede && !exceedsBudget && montoAPagar > 0) {
                // Solo mostrar toast cuando cambia de no excedido a excedido
                toast.warning('Presupuesto excedido. Se requerirá un folio de autorización');
            }
            
            setExceedsBudget(excede);
        }
    }, [watchedValues.importeAPagar, budgetData, exceedsBudget]);

    const onSubmit = async (data: CashPaymentFormData) => {
        setSubmitError(null);

        try {
            onSuccess({
                ...data,
                expenseConcept: typeof data.expenseConcept === 'string' ? data.expenseConcept : ''
            });
            reset();
            onHide();
        } catch (e: any) {
            setSubmitError(e?.message || 'Error al crear el pago');
        }
    };

    const loadBudgetData = async () => {
        if (!watchedValues.expenseConcept || !companyId || !brandId || !branchId) return;

        try {
            setLoadingBudget(true);
            const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            
            const budgetInfo = await getBudgetByExpenseConcept({
                expenseConceptId: watchedValues.expenseConcept,
                companyId,
                brandId,
                branchId,
                month
            });

            // Calcular el gasto adicional del estado local que aún no se ha enviado
            let localSpent = 0;
            
            // Sumar pagos temporales de facturas para el mismo concepto
            Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
                if (payment.conceptoGasto === watchedValues.expenseConcept) {
                    if (payment.tipoPago === "completo") {
                        const invoice = invoices.find((inv: any) => inv._id === invoiceId);
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
                if (cashPayment.expenseConcept._id === watchedValues.expenseConcept) {
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
            
            // Verificar si el monto excede el presupuesto disponible ajustado
            const montoAPagar = Number(watchedValues.importeAPagar || 0);
            const excede = montoAPagar >= adjustedBudgetInfo.availableBudget;
            
            if (excede && montoAPagar > 0) {
                toast.warning('Presupuesto excedido. Se requerirá un folio de autorización');
            }
            
            setExceedsBudget(excede);
            
        } catch (error) {
            console.error('Error al cargar información de presupuesto:', error);
            setBudgetData(null);
            setExceedsBudget(false);
        } finally {
            setLoadingBudget(false);
        }
    };

    const handleCloseModal = () => {
        setSubmitError(null);
        setBudgetData(null);
        setExceedsBudget(false);
        reset();
        onHide();
    };

    return (
        <Modal show={show} onHide={handleCloseModal} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Nuevo pago en efectivo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {submitError && <div className="alert alert-danger py-2">{submitError}</div>}
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-dark mb-1">Importe a pagar *</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0.01}
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register("importeAPagar", { valueAsNumber: true })}
                                    disabled={loading}
                                    isInvalid={!!errors.importeAPagar}
                                    autoFocus
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.importeAPagar?.toString()}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-dark mb-1">Concepto de gasto *</Form.Label>
                                <Form.Select
                                    {...register("expenseConcept", {
                                    })}
                                    disabled={loading || loadingConcepts}
                                    isInvalid={!!errors.expenseConcept}
                                >
                                    <option value="">Seleccione un concepto</option>
                                    {(Array.isArray(expenseConcepts) ? expenseConcepts : []).map((c: any) => (
                                        <option key={c._id} value={c._id}>
                                            {c.categoryId?.name ? `${c.categoryId.name} - ` : ""}{c.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.expenseConcept?.toString()}
                                </Form.Control.Feedback>
                                {loadingConcepts && <small className="text-muted">Cargando conceptos...</small>}
                            </Form.Group>
                        </Col>
                        
                        {/* Información de Presupuesto */}
                        {loadingBudget && (
                            <Col md={12}>
                                <div className="text-center mb-3">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    <small className="text-muted">Cargando información de presupuesto...</small>
                                </div>
                            </Col>
                        )}
                        
                        {budgetData && (
                            <Col md={12}>
                                <div className="border rounded p-3 bg-light mb-3">
                                    <h6 className="mb-2">📊 Información del Presupuesto</h6>
                                    <div className="row">
                                        <div className="col-4">
                                            <small className="text-muted d-block">Presupuesto Total:</small>
                                            <strong>{formatCurrency(budgetData.totalBudget)}</strong>
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted d-block">Ya Gastado:</small>
                                            <strong className="text-warning">{formatCurrency(budgetData.totalSpent)}</strong>
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted d-block">Disponible:</small>
                                            <strong className={budgetData.availableBudget > 0 ? 'text-success' : 'text-danger'}>
                                                {formatCurrency(budgetData.availableBudget)}
                                            </strong>
                                        </div>
                                    </div>
                                    
                                    {/* Mostrar cuánto quedará después del pago */}
                                    {budgetData && watchedValues.importeAPagar && Number(watchedValues.importeAPagar) > 0 && (
                                        <div className="mt-2 pt-2 border-top">
                                            <small className="text-muted d-block">Después del pago quedará:</small>
                                            <strong className={
                                                (budgetData.availableBudget - Number(watchedValues.importeAPagar)) > 0 
                                                    ? 'text-success' 
                                                    : 'text-danger'
                                            }>
                                                {formatCurrency(Math.max(0, budgetData.availableBudget - Number(watchedValues.importeAPagar)))}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        )}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="text-dark mb-1">Descripción del pago</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    maxLength={500}
                                    placeholder="Descripción"
                                    {...register("description")}
                                    disabled={loading}
                                    isInvalid={!!errors.description}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.description?.toString()}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={handleCloseModal}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    onClick={handleSubmit(onSubmit)}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-1" />
                            Creando...
                        </>
                    ) : (
                        <>Crear pago</>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}; 
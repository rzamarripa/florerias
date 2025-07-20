import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cashPaymentSchema, CashPaymentFormData } from "../schemas/cashPaymentSchema";
import { expenseConceptService } from "../../expenseConcepts/services/expenseConcepts";
import { createCashPaymentInPackage, createPackageWithCashPayment } from "../services/cashPayments";
import PackageSelectionStep from "./PackageSelectionStep";
import ConfirmationStep from "./ConfirmationStep";

interface Package {
    _id: string;
    folio: string;
    fechaPago: string;
    comentario: string;
    totalImporteAPagar: number;
    totalPagado: number;
    createdAt: string;
    company?: { name: string };
    brand?: { name: string };
    branch?: { name: string };
}

interface PackageData {
    comentario: string;
    fechaPago: string;
    companyId?: string;
    brandId?: string;
    branchId?: string;
    usuario_id?: string;
    departamento_id?: string;
    departamento?: string;
}

interface CashPaymentModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: (data: CashPaymentFormData) => void;
    loading?: boolean;
    payment?: Partial<CashPaymentFormData>;
    departmentId?: string;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
    show,
    onHide,
    onSuccess,
    loading,
    payment,
    departmentId
}) => {
    const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);
    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [formData, setFormData] = useState<CashPaymentFormData | null>(null);
    const [createdPackageId, setCreatedPackageId] = useState<string | null>(null);
    const [createdPackageFolio, setCreatedPackageFolio] = useState<string | null>(null);
    const [isNewPackage, setIsNewPackage] = useState(false);
    const [stepLoading, setStepLoading] = useState(false);

    const isEditing = Boolean(payment);

    const form = useForm<CashPaymentFormData>({
        resolver: zodResolver(cashPaymentSchema),
        defaultValues: payment || { importeAPagar: 0, expenseConcept: "", description: "" },
    });

    const { register, handleSubmit, formState: { errors }, reset, setValue } = form;

    useEffect(() => {
        if (show) {
            if (payment) {
                setValue("importeAPagar", payment.importeAPagar || 0);
                setValue("expenseConcept", payment.expenseConcept || "");
                setValue("description", payment.description || "");
            } else {
                reset({ importeAPagar: 0, expenseConcept: "", description: "" });
            }
            setStep(1);
            setFormData(null);
            setCreatedPackageId(null);
            setCreatedPackageFolio(null);
            setIsNewPackage(false);
            setSubmitError(null);
        }
    }, [show, payment, reset, setValue]);

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

    const onSubmit = async (data: CashPaymentFormData) => {
        setSubmitError(null);

        if (isEditing) {
            // Si es edición, usar el flujo original
            try {
                await onSuccess({
                    ...data,
                    expenseConcept: typeof data.expenseConcept === 'string' ? data.expenseConcept : ''
                });
                reset();
                onHide();
            } catch (e: any) {
                setSubmitError(e?.message || 'Error al actualizar el pago');
            }
        } else {
            // Si es creación, guardar datos y pasar al siguiente paso
            setFormData({
                ...data,
                expenseConcept: typeof data.expenseConcept === 'string' ? data.expenseConcept : ''
            });
            setStep(2);
        }
    };

    const handleBackToForm = () => {
        setStep(1);
        setSubmitError(null);
    };

    const handleSelectPackage = async (pkg: Package) => {
        if (!formData) return;

        setStepLoading(true);
        setSubmitError(null);

        try {
            await createCashPaymentInPackage({
                ...formData,
                packageId: pkg._id
            });

            setCreatedPackageId(pkg._id);
            setCreatedPackageFolio(pkg.folio);
            setIsNewPackage(false);
            setStep(3);

            // Llamar onSuccess para actualizar la lista en el componente padre
            await onSuccess(formData);
        } catch (e: any) {
            setSubmitError(e?.message || 'Error al agregar el pago al paquete');
        }

        setStepLoading(false);
    };

    const handleCreatePackage = async (packageData: PackageData) => {
        if (!formData) return;

        setStepLoading(true);
        setSubmitError(null);

        try {
            const response = await createPackageWithCashPayment({
                cashPayment: formData,
                packageData
            });

            setCreatedPackageId((response.data as any)?._id);
            setCreatedPackageFolio((response.data as any)?.folio);
            setIsNewPackage(true);
            setStep(3);

            // Llamar onSuccess para actualizar la lista en el componente padre
            await onSuccess(formData);
        } catch (e: any) {
            setSubmitError(e?.message || 'Error al crear el paquete con el pago');
        }

        setStepLoading(false);
    };

    const handleCloseModal = () => {
        setStep(1);
        setFormData(null);
        setCreatedPackageId(null);
        setCreatedPackageFolio(null);
        setIsNewPackage(false);
        setSubmitError(null);
        reset();
        onHide();
    };

    return (
        <Modal show={show} onHide={handleCloseModal} centered size={step === 2 ? "xl" : "lg"}>
            {step === 1 && (
                <div>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {isEditing ? 'Editar pago en efectivo' : 'Nuevo pago en efectivo'}
                        </Modal.Title>
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
                                            {...register("expenseConcept")}
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
                        <Button variant="secondary" onClick={handleCloseModal}>
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
                                    {isEditing ? "Actualizando..." : "Continuar"}
                                </>
                            ) : (
                                <>{isEditing ? "Actualizar" : "Continuar"}</>
                            )}
                        </Button>
                    </Modal.Footer>
                </div>
            )}

            {step === 2 && (
                <div>
                    <Modal.Header closeButton>
                        <Modal.Title>Seleccionar paquete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-0">
                        {submitError && (
                            <div className="alert alert-danger m-3 py-2">{submitError}</div>
                        )}
                        <PackageSelectionStep
                            onBack={handleBackToForm}
                            onSelectPackage={handleSelectPackage}
                            onCreatePackage={handleCreatePackage}
                            loading={stepLoading}
                            cashPaymentData={formData ? {
                                amount: formData.importeAPagar,
                                expenseConcept: formData.expenseConcept,
                                expenseConceptName: expenseConcepts.find((c: any) => c._id === formData.expenseConcept)?.name,
                                description: formData.description
                            } : undefined}
                        />
                    </Modal.Body>
                </div>
            )}

            {step === 3 && (
                <div>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirmación</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-0">
                        <ConfirmationStep
                            onClose={handleCloseModal}
                            packageId={createdPackageId || undefined}
                            isNewPackage={isNewPackage}
                            cashPaymentAmount={formData?.importeAPagar}
                            packageFolio={createdPackageFolio || undefined}
                        />
                    </Modal.Body>
                </div>
            )}
        </Modal>
    );
}; 
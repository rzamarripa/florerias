import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cashPaymentSchema, CashPaymentFormData } from "../schemas/cashPaymentSchema";
import { expenseConceptService } from "../../expenseConcepts/services/expenseConcepts";

interface CashPaymentModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: (data: CashPaymentFormData) => void;
    loading?: boolean;
    payment?: Partial<CashPaymentFormData>;
    departmentId?: string;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({ show, onHide, onSuccess, loading, payment, departmentId }) => {
    const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);
    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEditing = Boolean(payment);

    const form = useForm<CashPaymentFormData>({
        resolver: zodResolver(cashPaymentSchema),
        defaultValues: payment || { amount: 0, expenseConcept: "", description: "" },
    });

    const { register, handleSubmit, formState: { errors }, reset, setValue } = form;

    useEffect(() => {
        if (show) {
            if (payment) {
                setValue("amount", payment.amount || 0);
                setValue("expenseConcept", payment.expenseConcept || "");
                setValue("description", payment.description || "");
            } else {
                reset({ amount: 0, expenseConcept: "", description: "" });
            }
        }
    }, [show, payment, reset, setValue]);

    useEffect(() => {
        const fetchConcepts = async () => {
            setLoadingConcepts(true);
            try {
                let res;
                if (departmentId) {
                    res = await expenseConceptService.getByDepartment(departmentId);
                    setExpenseConcepts(res.data || []);
                } else {
                    res = await expenseConceptService.getActive();
                    setExpenseConcepts(res.data || []);
                }
            } catch {
                setExpenseConcepts([]);
            }
            setLoadingConcepts(false);
        };
        if (show) fetchConcepts();
    }, [show, departmentId]);

    const onSubmit = async (data: CashPaymentFormData) => {
        setSubmitSuccess(null);
        setSubmitError(null);
        try {
            await onSuccess({
                ...data,
                expenseConcept: typeof data.expenseConcept === 'string' ? data.expenseConcept : ''
            });
            setSubmitSuccess('Pago guardado correctamente');
            reset();
            setTimeout(() => {
                setSubmitSuccess(null);
                handleClose();
            }, 800);
        } catch (e: any) {
            setSubmitError(e?.message || 'Error al guardar el pago');
        }
    };

    const handleClose = () => {
        reset();
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Header closeButton className="border-0 pb-2 pt-3">
                    <Modal.Title className="text-dark fs-5">
                        {isEditing ? "Editar pago en efectivo" : "Agregar gasto en efectivo"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-2">
                    {submitSuccess && <div className="alert alert-success py-2">{submitSuccess}</div>}
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
                                    {...register("amount", { valueAsNumber: true })}
                                    disabled={loading}
                                    isInvalid={!!errors.amount}
                                    autoFocus
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.amount?.toString()}
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
                                <Form.Label className="text-dark mb-1">Descripción del gasto</Form.Label>
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
                </Modal.Body>
                <Modal.Footer className="border-0 pt-2 pb-3">
                    <Button
                        type="button"
                        variant="light"
                        onClick={handleClose}
                        className="fw-medium px-4"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="px-3 py-1"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                {isEditing ? "Actualizando..." : "Guardando..."}
                            </>
                        ) : (
                            <>{isEditing ? "Actualizar" : "Guardar"}</>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}; 
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cashPaymentSchema, CashPaymentFormData } from "../schemas/cashPaymentSchema";
import { expenseConceptService } from "../../expenseConcepts/services/expenseConcepts";

interface CashPaymentModalSimpleProps {
    show: boolean;
    onHide: () => void;
    onSuccess: (data: CashPaymentFormData) => void;
    loading?: boolean;
    departmentId?: string;
}

export const CashPaymentModalSimple: React.FC<CashPaymentModalSimpleProps> = ({
    show,
    onHide,
    onSuccess,
    loading,
    departmentId
}) => {
    const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);
    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<CashPaymentFormData>({
        resolver: zodResolver(cashPaymentSchema),
        defaultValues: { importeAPagar: 0, expenseConcept: "", description: "" },
    });

    const { register, handleSubmit, formState: { errors }, reset, setValue } = form;

    useEffect(() => {
        if (show) {
            reset({ importeAPagar: 0, expenseConcept: "", description: "" });
            setSubmitError(null);
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

    const onSubmit = async (data: CashPaymentFormData) => {
        setSubmitError(null);

        try {
            await onSuccess({
                ...data,
                expenseConcept: typeof data.expenseConcept === 'string' ? data.expenseConcept : ''
            });
            reset();
            onHide();
        } catch (e: any) {
            setSubmitError(e?.message || 'Error al crear el pago');
        }
    };

    const handleCloseModal = () => {
        setSubmitError(null);
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
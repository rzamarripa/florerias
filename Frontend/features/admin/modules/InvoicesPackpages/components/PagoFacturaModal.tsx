import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useUserSessionStore } from '@/stores/userSessionStore';
import { expenseConceptService } from '../../expenseConcepts/services/expenseConcepts';

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
    tipoPago: 'completo' | 'parcial';
    saldo: number;
    invoiceId: string | null;
    onSuccess: (invoiceId: string, tipoPago: 'completo' | 'parcial', descripcion: string, monto?: number, conceptoGasto?: string) => void;
}

const PagoFacturaModal: React.FC<PagoFacturaModalProps> = ({
    show,
    onClose,
    tipoPago,
    saldo,
    invoiceId,
    onSuccess
}) => {
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [conceptoGasto, setConceptoGasto] = useState('');
    const [conceptosGasto, setConceptosGasto] = useState<ExpenseConcept[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingConceptos, setLoadingConceptos] = useState(false);
    const { user } = useUserSessionStore();

    // Cargar conceptos de gasto cuando se abre el modal
    useEffect(() => {
        if (show && user?.departmentId) {
            loadConceptosGasto();
        }
    }, [show, user?.departmentId]);

    const loadConceptosGasto = async () => {
        if (!user?.departmentId) return;

        try {
            setLoadingConceptos(true);
            const response = await expenseConceptService.getByDepartment(user.departmentId);
            
            if (response.data && Array.isArray(response.data)) {
                setConceptosGasto(response.data);
            } else {
                toast.error('Error al cargar los conceptos de gasto');
            }
        } catch (error) {
            console.error('💥 DEBUG - Error en catch:', error);
            toast.error('Error al cargar los conceptos de gasto');
        } finally {
            setLoadingConceptos(false);
        }
    };

    const handleOk = async () => {
        if (!invoiceId) {
            toast.error('ID de factura no válido');
            return;
        }

        if (!descripcion.trim()) {
            toast.error('La descripción es obligatoria');
            return;
        }

        if (!conceptoGasto) {
            toast.error('Debe seleccionar un concepto de gasto');
            return;
        }

        if (tipoPago === 'parcial' && (!monto || Number(monto) <= 0)) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        if (tipoPago === 'parcial' && Number(monto) > saldo) {
            toast.error('El monto no puede exceder el saldo disponible');
            return;
        }

        try {
            setLoading(true);

            // Solo guardar en estado local, SIN hacer llamadas al backend
            onSuccess(invoiceId, tipoPago, descripcion, tipoPago === 'parcial' ? Number(monto) : undefined, conceptoGasto);

            setDescripcion('');
            setMonto('');
            setConceptoGasto('');
            onClose();
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            toast.error('Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setDescripcion('');
        setMonto('');
        setConceptoGasto('');
        onClose();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Body className="text-center p-4">
                <div className="mb-3 d-flex justify-content-center">
                    <div className="border border-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                        <i className="bi bi-info-lg text-info fs-2"></i>
                    </div>
                </div>
                <h4 className="fw-bold mb-2">
                    {tipoPago === 'completo' ? 'Introduce la descripción:' : 'Introduce la cantidad a pagar y la descripción:'}
                </h4>
                <div className="mb-2">Su Saldo es: <span className="fw-medium">${saldo.toLocaleString()}</span></div>

                {/* Select de Concepto de Gasto */}
                <Form.Group className="mb-2">
                    <Form.Label>Concepto de Gasto <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        value={conceptoGasto}
                        onChange={e => setConceptoGasto(e.target.value)}
                        disabled={loadingConceptos}
                        required
                    >
                        <option value="">Seleccione un concepto de gasto...</option>
                        {(Array.isArray(conceptosGasto) ? conceptosGasto : []).map(concepto => (
                            <option key={concepto._id} value={concepto._id}>
                                {concepto.categoryId.name} - {concepto.name}
                            </option>
                        ))}
                    </Form.Select>
                    {loadingConceptos && (
                        <small className="text-muted">Cargando conceptos...</small>
                    )}
                </Form.Group>

                {tipoPago === 'parcial' && (
                    <Form.Group className="mb-2">
                        <Form.Control
                            type="number"
                            min="1"
                            max={saldo}
                            value={monto}
                            onChange={e => setMonto(e.target.value)}
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
                        onChange={e => setDescripcion(e.target.value)}
                        placeholder="Descripción"
                        className="shadow-none"
                    />
                </Form.Group>
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <Button
                        className="bg-primary border-0 px-4"
                        onClick={handleOk}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'OK'}
                    </Button>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default PagoFacturaModal; 
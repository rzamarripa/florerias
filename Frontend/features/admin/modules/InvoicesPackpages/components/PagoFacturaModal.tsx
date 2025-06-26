import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { markInvoiceAsFullyPaid, markInvoiceAsPartiallyPaid } from '../services/invoicesPackpage';

interface PagoFacturaModalProps {
    show: boolean;
    onClose: () => void;
    tipoPago: 'completo' | 'parcial';
    saldo: number;
    invoiceId: string | null;
    onSuccess: () => void;
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
    const [loading, setLoading] = useState(false);

    const handleOk = async () => {
        if (!invoiceId) {
            toast.error('ID de factura no válido');
            return;
        }

        if (!descripcion.trim()) {
            toast.error('La descripción es obligatoria');
            return;
        }

        if (tipoPago === 'parcial' && (!monto || Number(monto) <= 0)) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        try {
            setLoading(true);
            
            if (tipoPago === 'completo') {
                await markInvoiceAsFullyPaid(invoiceId, descripcion);
                toast.success('Factura marcada como pagada completamente');
            } else {
                await markInvoiceAsPartiallyPaid(invoiceId, descripcion, Number(monto) || 0);
                toast.success('Pago parcial registrado correctamente');
            }
            
            setDescripcion('');
            setMonto('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            if (tipoPago === 'completo') {
                toast.error('Error al marcar la factura como pagada completamente');
            } else {
                toast.error('Error al registrar el pago parcial');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setDescripcion('');
        setMonto('');
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
                {tipoPago === 'parcial' && (
                    <Form.Group className="mb-2">
                        <Form.Control
                            type="number"
                            min="1"
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
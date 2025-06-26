import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface PagoFacturaModalProps {
    show: boolean;
    onClose: () => void;
    tipoPago: 'completo' | 'parcial';
    saldo: number;
    onSubmit: (data: { descripcion: string; monto?: number }) => void;
}

const PagoFacturaModal: React.FC<PagoFacturaModalProps> = ({ show, onClose, tipoPago, saldo, onSubmit }) => {
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');

    const handleOk = () => {
        if (tipoPago === 'parcial') {
            onSubmit({ descripcion, monto: Number(monto) });
        } else {
            onSubmit({ descripcion });
        }
        setDescripcion('');
        setMonto('');
        onClose();
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
                            className="text-end"
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
                    <Button className="bg-primary border-0 px-4" onClick={handleOk}>OK</Button>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default PagoFacturaModal; 
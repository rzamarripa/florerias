import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { BsQuestionCircle } from 'react-icons/bs';

interface CreatedPackpageModalProps {
    show: boolean;
    onClose: () => void;
    onViewCreated: () => void;
    onViewList: () => void;
}

const CreatedPackpageModal: React.FC<CreatedPackpageModalProps> = ({ show, onClose, onViewCreated, onViewList }) => {
    return (
        <Modal show={show} onHide={onClose} centered backdrop="static">
            <Modal.Body className="text-center py-5">
                <div className="mb-4">
                    <BsQuestionCircle size={80} className="text-primary mb-3" />
                </div>
                <h3 className="fw-bold mb-3">¿Qué te gustaría hacer a continuación?</h3>
                <p className="mb-4 text-muted">
                    Puedes ir al listado de paquetes o ver el detalle del paquete recién creado.
                </p>
                <div className="d-flex justify-content-center gap-3">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onViewCreated}
                    >
                        Ver paquete creado
                    </Button>
                    <Button
                        variant="light"
                        size="lg"
                        onClick={onViewList}
                    >
                        Listado de paquetes
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default CreatedPackpageModal; 
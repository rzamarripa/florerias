import React from 'react';
import { Button, Alert } from 'react-bootstrap';
import { BsCheckCircle, BsEye, BsList } from 'react-icons/bs';
import { useRouter } from 'next/navigation';

interface ConfirmationStepProps {
    onClose: () => void;
    packageId?: string;
    isNewPackage?: boolean;
    cashPaymentAmount?: number;
    packageFolio?: string;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ 
    onClose, 
    packageId, 
    isNewPackage, 
    cashPaymentAmount, 
    packageFolio 
}) => {
    const router = useRouter();

    const handleViewPackage = () => {
        if (packageId) {
            router.push(`/admin-site/modulos/paquetes-facturas/detalle-paquete?packpageId=${packageId}`);
        }
        onClose();
    };

    const handleViewCashPaymentsList = () => {
        router.push('/admin-site/modulos/pagos-efectivo');
        onClose();
    };

    return (
        <div className="p-4">
            <div className="text-center">
                <div className="mb-4">
                    <BsCheckCircle size={80} className="text-success mb-3" />
                </div>
                
                <h3 className="fw-bold mb-3 text-success">
                    ¡Pago en efectivo {isNewPackage ? 'creado' : 'agregado'} exitosamente!
                </h3>
                
                <div className="mb-4">
                    <Alert variant="success" className="text-start">
                        <div className="mb-2">
                            <strong>Resumen de la operación:</strong>
                        </div>
                        <ul className="mb-0">
                            <li>
                                <strong>Pago en efectivo:</strong> {cashPaymentAmount?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                            </li>
                            <li>
                                <strong>Paquete:</strong> {packageFolio || 'Nuevo paquete'}
                            </li>
                            <li>
                                <strong>Estado:</strong> {isNewPackage ? 'Nuevo paquete creado' : 'Agregado a paquete existente'}
                            </li>
                        </ul>
                    </Alert>
                </div>
                
                <p className="mb-4 text-muted">
                    El pago en efectivo ha sido {isNewPackage ? 'incluido en un nuevo paquete' : 'agregado al paquete seleccionado'}. 
                    Puedes ver el detalle del paquete o regresar al listado de pagos en efectivo.
                </p>
                
                <div className="d-flex justify-content-center gap-3">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleViewPackage}
                        disabled={!packageId}
                    >
                        <BsEye size={20} className="me-2" />
                        Ver paquete
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleViewCashPaymentsList}
                    >
                        <BsList size={20} className="me-2" />
                        Listado de pagos
                    </Button>
                </div>
                
                <div className="mt-3">
                    <Button
                        variant="link"
                        onClick={onClose}
                        className="text-muted"
                    >
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationStep; 
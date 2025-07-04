import React, { useState, useEffect } from 'react';
import { Button, Form, Row, Col, Alert, Spinner, Table, Card } from 'react-bootstrap';
import { BsPlus, BsArrowLeft, BsCash } from 'react-icons/bs';
import { getExistingPackagesForCashPayments } from '../services/cashPayments';
import { useUserSessionStore } from '@/stores/userSessionStore';
import { getNextThursdayOfWeek } from '@/utils/dateUtils';

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

interface CashPaymentData {
    amount: number;
    expenseConcept: string;
    expenseConceptName?: string;
    description?: string;
}

interface PackageSelectionStepProps {
    onBack: () => void;
    onSelectPackage: (pkg: Package) => void;
    onCreatePackage: (packageData: PackageData) => void;
    loading?: boolean;
    cashPaymentData?: CashPaymentData;
}

const PackageSelectionStep: React.FC<PackageSelectionStepProps> = ({ 
    onBack, 
    onSelectPackage, 
    onCreatePackage, 
    loading,
    cashPaymentData
}) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPackageData, setNewPackageData] = useState({
        comentario: '',
        fechaPago: '',
        companyId: '',
        brandId: '',
        branchId: ''
    });
    const { user } = useUserSessionStore();

    useEffect(() => {
        fetchPackages();
        
        // Precargar fecha de pago con el próximo jueves
        const today = new Date();
        const nextThursday = getNextThursdayOfWeek(today);
        setNewPackageData(prev => ({
            ...prev,
            fechaPago: nextThursday.toISOString().split('T')[0]
        }));
    }, []);

    const fetchPackages = async () => {
        setLoadingPackages(true);
        setError(null);
        try {
            const response = await getExistingPackagesForCashPayments(user?._id);
            setPackages(Array.isArray(response.data) ? response.data : []);
        } catch (e: any) {
            setError(e?.message || 'Error al cargar paquetes');
            setPackages([]);
        }
        setLoadingPackages(false);
    };

    const handleSelectExistingPackage = () => {
        if (!selectedPackageId) return;
        const selectedPackage = packages.find(p => p._id === selectedPackageId);
        if (selectedPackage) {
            onSelectPackage(selectedPackage);
        }
    };

    const handleCreateNewPackage = () => {
        if (!newPackageData.comentario || !newPackageData.fechaPago) {
            setError('Comentario y fecha de pago son obligatorios');
            return;
        }
        
        onCreatePackage({
            ...newPackageData,
            usuario_id: user?._id,
            departamento_id: user?.departmentId,
            departamento: user?.department,
        });
    };

    if (showCreateForm) {
        return (
            <div className="p-3">
                <div className="d-flex align-items-center mb-3">
                    <Button 
                        variant="link" 
                        className="p-0 me-2" 
                        onClick={() => setShowCreateForm(false)}
                    >
                        <BsArrowLeft size={20} />
                    </Button>
                    <h5 className="mb-0">Crear nuevo paquete</h5>
                </div>

                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-dark mb-1">Fecha de pago *</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={newPackageData.fechaPago}
                                    onChange={e => setNewPackageData(prev => ({ ...prev, fechaPago: e.target.value }))}
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="text-dark mb-1">Comentario *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={newPackageData.comentario}
                                    onChange={e => setNewPackageData(prev => ({ ...prev, comentario: e.target.value }))}
                                    placeholder="Descripción del paquete..."
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-between mt-3">
                        <Button variant="secondary" onClick={onBack} disabled={loading}>
                            Regresar
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleCreateNewPackage}
                            disabled={loading || !newPackageData.comentario || !newPackageData.fechaPago}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Creando...
                                </>
                            ) : (
                                'Crear paquete'
                            )}
                        </Button>
                    </div>
                </Form>
            </div>
        );
    }

    return (
        <div className="p-3">
            <div className="d-flex align-items-center mb-3">
                <Button variant="link" className="p-0 me-2" onClick={onBack}>
                    <BsArrowLeft size={20} />
                </Button>
                <h5 className="mb-0">Selecciona un paquete existente o crea uno nuevo</h5>
            </div>

            {error && <Alert variant="danger" className="py-2">{error}</Alert>}

            {/* Tabla con datos del pago en efectivo */}
            {cashPaymentData && (
                <Card className="mb-4">
                    <Card.Header className="bg-light">
                        <div className="d-flex align-items-center">
                            <BsCash size={20} className="me-2 text-success" />
                            <h6 className="mb-0">Pago en efectivo a agregar</h6>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Importe</th>
                                    <th>Concepto de gasto</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <span className="fw-bold text-success">
                                            {cashPaymentData.amount.toLocaleString('es-MX', { 
                                                style: 'currency', 
                                                currency: 'MXN' 
                                            })}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-primary">
                                            {cashPaymentData.expenseConceptName || cashPaymentData.expenseConcept}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-muted">
                                            {cashPaymentData.description || 'Sin descripción'}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}

            <div className="row g-3">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">Paquetes existentes (Borrador)</h6>
                        </div>
                        <div className="card-body">
                            {loadingPackages ? (
                                <div className="text-center py-3">
                                    <Spinner animation="border" size="sm" />
                                    <p className="text-muted mb-0 mt-2">Cargando paquetes...</p>
                                </div>
                            ) : packages.length === 0 ? (
                                <p className="text-muted mb-0">No hay paquetes en borrador disponibles</p>
                            ) : (
                                <div>
                                    <Form.Select
                                        value={selectedPackageId}
                                        onChange={e => setSelectedPackageId(e.target.value)}
                                        className="mb-3"
                                    >
                                        <option value="">Selecciona un paquete...</option>
                                        {packages.map(pkg => (
                                            <option key={pkg._id} value={pkg._id}>
                                                {pkg.folio} - {pkg.comentario} ({pkg.totalImporteAPagar.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })})
                                            </option>
                                        ))}
                                    </Form.Select>
                                    
                                    {selectedPackageId && (
                                        <div className="bg-light p-2 rounded mb-3">
                                            {(() => {
                                                const pkg = packages.find(p => p._id === selectedPackageId);
                                                return pkg ? (
                                                    <div>
                                                        <small className="text-muted">Paquete seleccionado:</small>
                                                        <p className="mb-1"><strong>{pkg.folio}</strong></p>
                                                        <p className="mb-1">{pkg.comentario}</p>
                                                        <p className="mb-0">
                                                            <small>
                                                                Fecha: {new Date(pkg.fechaPago).toLocaleDateString()} | 
                                                                Total: {pkg.totalImporteAPagar.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                            </small>
                                                        </p>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    )}
                                    
                                    <Button 
                                        variant="primary" 
                                        onClick={handleSelectExistingPackage}
                                        disabled={!selectedPackageId || loading}
                                        className="w-100"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" />
                                                Procesando...
                                            </>
                                        ) : (
                                            'Seleccionar paquete'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">Crear nuevo paquete</h6>
                        </div>
                        <div className="card-body">
                            <p className="text-muted mb-3">
                                Si no hay un paquete adecuado, puedes crear uno nuevo para este pago en efectivo.
                            </p>
                            <Button 
                                variant="success" 
                                onClick={() => setShowCreateForm(true)}
                                className="w-100"
                                disabled={loading}
                            >
                                <BsPlus size={20} className="me-1" />
                                Crear nuevo paquete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageSelectionStep; 
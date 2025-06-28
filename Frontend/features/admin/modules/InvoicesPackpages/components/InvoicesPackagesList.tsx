"use client"
import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Table,
    Button,
    Spinner,
    Badge,
    Form,
    InputGroup,
    Modal,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {
    getInvoicesPackagesByUsuario,
    InvoicesPackage,
    deleteInvoicesPackage
} from '../services/invoicesPackpage';
import { useUserSessionStore } from '@/stores/userSessionStore';
import PackpageActions from './PackpageActions';
import EnviarPagoModal from './EnviarPagoModal';

interface InvoicesPackagesListProps {
    show?: boolean;
}

const InvoicesPackagesList: React.FC<InvoicesPackagesListProps> = ({ show = true }) => {
    const [packages, setPackages] = useState<InvoicesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPackpageId, setSelectedPackpageId] = useState<string | null>(null);
    const [showEnviarPagoModal, setShowEnviarPagoModal] = useState(false);
    const [paqueteExistenteSeleccionado, setPaqueteExistenteSeleccionado] = useState<InvoicesPackage | null>(null);
    const [facturasProcesadas, setFacturasProcesadas] = useState<any[]>([]);
    const { user } = useUserSessionStore();
    const router = useRouter();

    const loadPackages = () => {
        if (show && user?._id) {
            setLoading(true);
            getInvoicesPackagesByUsuario(user._id)
                .then(paquetes => setPackages(paquetes || []))
                .catch((error) => {
                    toast.error('Error al cargar los paquetes de facturas');
                    console.error(error);
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        loadPackages();
    }, [show, user]);

    const handleDelete = async () => {
        if (!selectedPackpageId) return;
        setDeletingId(selectedPackpageId);
        try {
            await deleteInvoicesPackage(selectedPackpageId);
            toast.success('Paquete eliminado correctamente');
            setShowDeleteModal(false);
            setSelectedPackpageId(null);
            loadPackages();
        } catch (error: any) {
            toast.error(error?.message || 'Error al eliminar el paquete');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (packpage: InvoicesPackage) => {
        setPaqueteExistenteSeleccionado(packpage);
        // Solo incluir facturas pagadas completamente
        const facturasPagadas = (packpage.facturas || []).filter((f: any) => f.importePagado >= f.importeAPagar);
        setFacturasProcesadas(facturasPagadas);
        setShowEnviarPagoModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Borrador':
                return <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold py-2 px-3">Borrador</span>;
            case 'Enviado':
                return <span className="badge bg-info bg-opacity-10 text-info fw-bold py-2 px-3">Enviado</span>;
            case 'Aprobado':
                return <span className="badge bg-success bg-opacity-10 text-success fw-bold py-2 px-3">Aprobado</span>;
            case 'Rechazado':
                return <span className="badge bg-danger bg-opacity-10 text-danger fw-bold py-2 px-3">Rechazado</span>;
            case 'Pagado':
                return <span className="badge bg-primary bg-opacity-10 text-primary fw-bold py-2 px-3">Pagada</span>;
            case 'Cancelado':
                return <span className="badge bg-danger bg-opacity-10 text-danger fw-bold py-2 px-3">Cancelado</span>;
            default:
                return <span className="badge bg-light text-dark fw-bold py-2 px-3">{status}</span>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredPackages = packages.filter(pkg => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            pkg.folio.toString().includes(searchLower) ||
            pkg.departamento.toLowerCase().includes(searchLower) ||
            (pkg.comentario && pkg.comentario.toLowerCase().includes(searchLower)) ||
            pkg.totalFacturas.toString().includes(searchLower)
        );
    });

    if (!show) return null;

    return (
        <Container fluid className="mt-4">
            {/* Filtro de búsqueda */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <Row className="align-items-end">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Buscar:</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Buscar por folio"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6} className="text-end">
                            <Button 
                                variant="primary" 
                                onClick={() => router.push('/modulos/paquetes-facturas')}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Nuevo Paquete
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Tabla de paquetes */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                    <Card.Title className="mb-0 fw-bold">
                        Paquetes de Facturas
                        {filteredPackages.length > 0 && (
                            <span className="text-muted ms-2">
                                ({filteredPackages.length} paquetes)
                            </span>
                        )}
                    </Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </Spinner>
                            <p className="mt-2 text-muted">Cargando paquetes de facturas...</p>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-file-earmark-zip display-4 text-muted"></i>
                            <p className="mt-2 text-muted">No se encontraron paquetes de facturas</p>
                            <small className="text-muted">
                                {searchTerm
                                    ? 'No hay paquetes que coincidan con el filtro de búsqueda'
                                    : 'No hay paquetes de facturas creados aún'
                                }
                            </small>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Folio</th>
                                    <th>Departamento</th>
                                    <th>Comentario</th>
                                    <th>Estatus</th>
                                    <th>Total Facturas</th>
                                    <th>Importe Total</th>
                                    <th>Pagado</th>
                                    <th>Saldo</th>
                                    <th>Fecha Pago</th>
                                    <th>Fecha Creación</th>
                                    <th className='text-center'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPackages.map((pkg) => {
                                    const saldo = pkg.totalImporteAPagar - pkg.totalPagado;
                                    const porcentajePagado = pkg.totalImporteAPagar > 0 
                                        ? Math.round((pkg.totalPagado / pkg.totalImporteAPagar) * 100) 
                                        : 0;
                                    return (
                                        <tr key={pkg._id}>
                                            <td>
                                                <strong className="text-primary">
                                                    #{pkg.folio}
                                                </strong>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong>{pkg.departamento}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                                    {pkg.comentario || (
                                                        <span className="text-muted">Sin comentario</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(pkg.estatus)}
                                            </td>
                                            <td>
                                                <div className="">
                                                    <Badge bg="primary" className="badge bg-primary bg-opacity-10 text-primary fw-bold py-2 px-2">
                                                        {pkg.totalFacturas} facturas
                                                    </Badge>
                                                    <br />
                                                    <small className="text-muted"></small>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-bold text-center">
                                                    {formatCurrency(pkg.totalImporteAPagar)}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <span className="fw-bold text-success">
                                                        {formatCurrency(pkg.totalPagado)}
                                                    </span>
                                                    <br />
                                                    <small className="text-muted">
                                                        {porcentajePagado}% pagado
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={saldo > 0 ? 'text-warning' : 'text-success'}>
                                                    {formatCurrency(saldo)}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="fw-bold mb-1">
                                                        {formatDate(pkg.fechaPago)}
                                                    </div>
                                                    {new Date(pkg.fechaPago) < new Date() && pkg.estatus !== 'Pagado' ? (
                                                        <Badge className="badge bg-danger bg-opacity-10 text-danger fw-bold py-1 px-2">
                                                            Vencido
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="badge bg-success bg-opacity-10 text-success fw-bold py-1 px-2">
                                                            Vigente
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {formatDateTime(pkg.fechaCreacion)}
                                                </small>
                                            </td>
                                            <td>
                                                <PackpageActions 
                                                    packpageId={pkg._id} 
                                                    onEdit={() => handleEdit(pkg)} 
                                                    onDelete={() => { setSelectedPackpageId(pkg._id); setShowDeleteModal(true); }} 
                                                    loadingDelete={deletingId === pkg._id}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Eliminar paquete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Estás seguro que deseas eliminar este paquete? Esta acción no se puede deshacer.<br/>
                    Si el paquete contiene facturas, sus campos de registro serán limpiados.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={!!deletingId}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={!!deletingId}>
                        {deletingId ? <Spinner animation="border" size="sm" /> : 'Eliminar'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <EnviarPagoModal
                show={showEnviarPagoModal}
                onClose={() => setShowEnviarPagoModal(false)}
                facturas={facturasProcesadas.map(f => ({
                    _id: f._id,
                    nombreEmisor: f.nombreEmisor,
                    uuid: f.uuid,
                    fechaEmision: f.fechaEmision,
                    tipoComprobante: f.tipoComprobante,
                    rfcEmisor: f.rfcEmisor,
                    estatus: String(f.estatus),
                    descripcionEstatus: f.estatus === 1 ? 'Vigente' : 'Cancelado',
                    fechaCancelacion: f.fechaCancelacion,
                    importeAPagar: f.importeAPagar,
                    saldo: f.importeAPagar - f.importePagado,
                    importePagado: f.importePagado,
                }))}
                paqueteExistente={paqueteExistenteSeleccionado}
                razonSocialName={paqueteExistenteSeleccionado?.departamento || ''}
                isNewPackage={false}
                onSuccess={() => {
                    setShowEnviarPagoModal(false);
                    setPaqueteExistenteSeleccionado(null);
                    setFacturasProcesadas([]);
                    loadPackages();
                }}
            />
        </Container>
    );
};

export default InvoicesPackagesList; 
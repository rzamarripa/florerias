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
    deleteInvoicesPackage,
    requestFunding
} from '../services/invoicesPackpage';
import { useUserSessionStore } from '@/stores/userSessionStore';
import PackpageActions from './PackpageActions';
import EnviarPagoModal from './EnviarPagoModal';
import FundingRequestModal from './FundingRequestModal';
import { formatDate } from 'date-fns';

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
    const [showFundingModal, setShowFundingModal] = useState(false);
    const { user } = useUserSessionStore();
    const router = useRouter();

    const loadPackages = () => {
        if (show && user?._id) {
            setLoading(true);

            // La lógica de filtrado se maneja en el backend:
            // - Si el departamento del usuario es "Tesorería": muestra paquetes según la visibilidad del usuario (RoleVisibility)
            // - Si el departamento es diferente a "Tesorería": muestra solo paquetes del departamento del usuario
            getInvoicesPackagesByUsuario(user._id)
                .then(paquetes => {
                    let paquetesFiltrados = [];

                    if (Array.isArray(paquetes?.data)) {
                        paquetesFiltrados = paquetes.data;
                    } else if (Array.isArray(paquetes)) {
                        paquetesFiltrados = paquetes;
                    } else {
                        paquetesFiltrados = [];
                    }

                    // Filtro adicional para usuarios de Tesorería: excluir paquetes con estatus "Borrador"
                    if (user?.department === 'Tesorería') {
                        paquetesFiltrados = paquetesFiltrados.filter((pkg: InvoicesPackage) => pkg.estatus !== 'Borrador');
                    }

                    setPackages(paquetesFiltrados);
                })
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
        // Incluir todas las facturas del paquete (autorizadas o no)
        const todasLasFacturas = (packpage.facturas || []);
        setFacturasProcesadas(todasLasFacturas);
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
            case 'Programado':
                return <span className="badge bg-warning bg-opacity-10 text-warning fw-bold py-2 px-3">Programado</span>;
            case 'PorFondear':
                return <span className="badge bg-dark bg-opacity-10 text-dark fw-bold py-2 px-3">Por Fondear</span>;
            case 'Fondeado':
                return <span className="badge bg-success bg-opacity-10 text-success fw-bold py-2 px-3">Fondeado</span>;
            default:
                return <span className="badge bg-light text-dark fw-bold py-2 px-3">{status}</span>;
        }
    };

    // Función para obtener el estado de autorización del paquete
    const getAutorizacionStatus = (packpage: InvoicesPackage) => {
        const facturasCompletamentePagadas = packpage.facturas.filter((f: any) => f.importePagado >= f.importeAPagar);
        const facturasAutorizadas = facturasCompletamentePagadas.filter((f: any) => f.autorizada);
        const facturasPendientes = facturasCompletamentePagadas.filter((f: any) => !f.autorizada && f.estaRegistrada);

        if (facturasCompletamentePagadas.length === 0) {
            return { tipo: 'sin_pagos_completos', texto: 'Sin pagos completos', variant: 'secondary' };
        }

        if (facturasAutorizadas.length === facturasCompletamentePagadas.length) {
            return { tipo: 'todas_autorizadas', texto: 'Todas autorizadas', variant: 'success' };
        }

        if (facturasPendientes.length > 0) {
            return { tipo: 'pendientes', texto: 'Hay facturas pendientes', variant: 'warning' };
        }

        return { tipo: 'parcial', texto: `${facturasAutorizadas.length}/${facturasCompletamentePagadas.length} autorizadas`, variant: 'info' };
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
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
                                variant="secondary"
                                className="me-2"
                                onClick={() => setShowFundingModal(true)}
                            >
                                <i className="bi bi-cash-coin me-2"></i>
                                Generar Reporte
                            </Button>
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
                                    <th>Autorización</th>
                                    <th>Total Facturas</th>
                                    <th>Pagado</th>
                                    <th>Total a pagar</th>
                                    <th>Fecha Pago</th>
                                    <th>Fecha Creación</th>
                                    <th className='text-center'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPackages.map((pkg) => {
                                    // Sumar importeAPagar de facturas y pagos en efectivo
                                    const totalFacturasAPagar = Array.isArray(pkg.facturas) ? pkg.facturas.reduce((sum, f) => sum + (f.importeAPagar || 0), 0) : 0;
                                    const totalPagosEfectivoAPagar = Array.isArray(pkg.pagosEfectivo) ? pkg.pagosEfectivo.reduce((sum, p) => sum + (p.importeAPagar || 0), 0) : 0;
                                    const totalAPagar = totalFacturasAPagar + totalPagosEfectivoAPagar;
                                    const porcentajePagado = totalAPagar > 0
                                        ? Math.round((pkg.totalPagado / totalAPagar) * 100)
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
                                                {(() => {
                                                    const authStatus = getAutorizacionStatus(pkg);
                                                    return (
                                                        <span className={`badge bg-${authStatus.variant} bg-opacity-10 text-${authStatus.variant} fw-bold py-2 px-3`}>
                                                            {authStatus.texto}
                                                        </span>
                                                    );
                                                })()}
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
                                                <span className={totalAPagar > 0 ? 'text-warning' : 'text-success'}>
                                                    {formatCurrency(totalAPagar)}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="fw-bold mb-1">
                                                        {formatDate(pkg.fechaPago.toString(), 'dd/MM/yyyy')}
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
                                                <small className=" ">
                                                    {formatDate(pkg.createdAt.toString(), 'dd/MM/yyyy')}
                                                </small>
                                            </td>
                                            <td>
                                                <PackpageActions
                                                    packpageId={pkg._id}
                                                    packageStatus={pkg.estatus}
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
                    ¿Estás seguro que deseas eliminar este paquete? Esta acción no se puede deshacer.<br />
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
                    completamentePagada: f.importePagado >= f.importeAPagar,
                    autorizada: f.autorizada,
                    estaRegistrada: f.estaRegistrada
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

            <FundingRequestModal
                show={showFundingModal}
                onClose={() => setShowFundingModal(false)}
                onSuccess={() => {
                    setShowFundingModal(false);
                    loadPackages(); // Recargar la lista después del fondeo
                }}
            />
        </Container>
    );
};

export default InvoicesPackagesList; 
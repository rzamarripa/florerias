"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { getInvoicesPackageById, InvoicesPackage, ImportedInvoice, toggleFacturaAutorizada, getInvoiceById, enviarPaqueteADireccion } from '../services/invoicesPackpage';
import { BsClipboard } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { useUserSessionStore } from '@/stores';

// Estilos para mostrar borde solo en hover
const actionButtonStyles = `
    .action-button-hover-border {
        border: none !important;
        background-color: transparent !important;
    }
    .action-button-hover-border:hover {
        border: 2px solid !important;
        background-color: transparent !important;
    }
    .action-button-hover-border.btn-outline-success:hover {
        border-color: #198754 !important;
        color: #198754 !important;
    }
    .action-button-hover-border.btn-outline-danger:hover {
        border-color: #dc3545 !important;
        color: #dc3545 !important;
    }
`;

const NewPackpageDetailsPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const packpageId = searchParams.get('packpageId');
    const invoiceId = searchParams.get('invoiceId');
    const [packpage, setPackpage] = useState<InvoicesPackage | null>(null);
    const [singleInvoice, setSingleInvoice] = useState<ImportedInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);

    const { user } = useUserSessionStore();

    useEffect(() => {
        if (packpageId) {
            loadPackpage();
        } else if (invoiceId) {
            loadSingleInvoice();
        }
    }, [packpageId, invoiceId]);

    const loadPackpage = async () => {
        try {
            setLoading(true);
            console.log('Cargando paquete con ID:', packpageId);
            const response = await getInvoicesPackageById(packpageId!);
            console.log('Respuesta completa:', response);
            console.log('response.data:', response.data);

            if (!response || !response.data) {
                console.error('No se encontró el paquete. Response:', response);
                setPackpage(null);
            } else {
                console.log('Paquete encontrado:', response.data);
                const packpageData = response.data as any;
                
                // Normalizar datos numéricos
                if (packpageData.facturas) {
                    packpageData.facturas = packpageData.facturas.map((f: any) => ({
                        ...f,
                        importeAPagar: parseFloat(f.importeAPagar || 0),
                        importePagado: parseFloat(f.importePagado || 0)
                    }));
                }
                
                packpageData.totalImporteAPagar = parseFloat(packpageData.totalImporteAPagar || 0);
                packpageData.totalPagado = parseFloat(packpageData.totalPagado || 0);
                
                console.log('Facturas del paquete:', packpageData.facturas);
                console.log('Número de facturas:', packpageData.facturas?.length);
                console.log('Totales:', { 
                    totalImporteAPagar: packpageData.totalImporteAPagar, 
                    totalPagado: packpageData.totalPagado 
                });
                
                // Verificar si hay duplicados por UUID
                const uuids = packpageData.facturas?.map((f: any) => f.uuid) || [];
                const uuidsUnicos = [...new Set(uuids)];
                if (uuids.length !== uuidsUnicos.length) {
                    console.warn('¡Facturas duplicadas detectadas!');
                    console.log('UUIDs:', uuids);
                    console.log('UUIDs únicos:', uuidsUnicos);
                }
                
                setPackpage(packpageData);
            }
        } catch (error) {
            console.error('Error al cargar el paquete:', error);
            toast.error('Error al cargar el paquete');
            setPackpage(null);
        } finally {
            setLoading(false);
        }
    };

    const loadSingleInvoice = async () => {
        try {
            setLoading(true);
            const response = await getInvoiceById(invoiceId!);
            console.log('response', response);
            setSingleInvoice(response.data);
        } catch (error) {
            console.error('Error loading invoice:', error);
            toast.error('Error al cargar la factura');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (uuid: string) => {
        navigator.clipboard.writeText(uuid);
        setCopied(uuid);
        setTimeout(() => setCopied(null), 1500);
    };

    const handleToggleAutorizada = async (facturaId: string, nuevoEstado: boolean) => {
        try {
            const factura = packpage?.facturas.find(f => f._id === facturaId);
            if (!factura) return;
            if (factura.autorizada === nuevoEstado) {
                return;
            }
            
            const result = await toggleFacturaAutorizada(facturaId, nuevoEstado);
            console.log('Resultado del toggle:', result);
            
            if (result && result.success && typeof (result.data as any).autorizada !== 'undefined') {
                console.log('Datos de respuesta:', result.data);
                
                // Actualizar el estado local con los datos de la respuesta
                setPackpage((prev) => {
                    if (!prev) return prev;
                    
                    const facturasActualizadas = prev.facturas.map(f =>
                        f._id === facturaId ? {
                            ...f,
                            autorizada: (result.data as any).autorizada,
                            pagoRechazado: (result.data as any).pagoRechazado,
                            importePagado: (result.data as any).importePagado,
                            estadoPago: (result.data as any).estadoPago,
                            esCompleta: (result.data as any).esCompleta
                        } : f
                    );
                    
                    // Recalcular totales
                    const totalPagado = facturasActualizadas.reduce((sum, f) => sum + (f.importePagado || 0), 0);
                    const totalImporteAPagar = facturasActualizadas.reduce((sum, f) => sum + (f.importeAPagar || 0), 0);
                    
                    console.log('Totales recalculados:', { totalPagado, totalImporteAPagar });
                    
                    return {
                        ...prev,
                        facturas: facturasActualizadas,
                        totalPagado,
                        totalImporteAPagar
                    };
                });
                
                if (!(result.data as any).autorizada) {
                    toast.info('Factura rechazada. El pago ha sido devuelto a cero.');
                } else {
                    toast.success('Estado de autorización actualizado correctamente.');
                }
            } else {
                toast.error('Error inesperado al cambiar el estado de autorización');
            }
        } catch (error) {
            console.error('Error en toggle:', error);
            toast.error('Error al cambiar el estado de autorización');
        }
    };

    const handleEnviarADireccion = async () => {
        if (!packpage?._id) {
            toast.error('No se puede enviar el paquete. ID no encontrado.');
            return;
        }
        try {
            const result = await enviarPaqueteADireccion(packpage._id);
            if (result && result.success && result.data && result.data.estatus === 'Enviado') {
                toast.success('Paquete enviado a dirección correctamente');
                setPackpage(prev => prev ? { ...prev, estatus: 'Enviado' } : null);
            } else {
                toast.error('Error al enviar el paquete a dirección');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Error al enviar el paquete a dirección');
        }
    };

    // Verificar si se puede enviar a dirección (todas las facturas procesadas)
    const puedeEnviarADireccion = packpage && packpage.facturas && 
        packpage.facturas.length > 0 && 
        packpage.facturas.every((factura: ImportedInvoice) => factura.autorizada !== null);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
                <div className="mt-2">
                    {packpageId ? 'Cargando paquete...' : 'Cargando factura...'}
                </div>
            </div>
        );
    }
    if (!packpage && !singleInvoice) {
        return <Alert variant="danger">No se encontró el elemento solicitado.</Alert>;
    }

    // Si es una factura individual
    if (singleInvoice) {
        return (
            <div className="container-fluid py-4">
                <Card className="mb-4 shadow-sm border-0">
                    <Card.Body>
                        <div className="d-flex align-items-center mb-2">
                            <h4 className="fw-bold mb-0 me-3">
                                Detalle de Factura: <span className="text-primary">{singleInvoice.uuid}</span>
                            </h4>
                            <Badge bg="secondary" className="ms-2">MongoDB</Badge>
                        </div>
                        <div className="mb-2 text-muted" style={{ fontSize: '1rem' }}>
                            <span className="me-2">Proveedor: {singleInvoice.nombreEmisor}</span>
                            <span className="me-2">RFC: {singleInvoice.rfcEmisor}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <div className="d-flex align-items-center mb-3">
                                <span className="me-2">Estatus:</span>
                                <Badge bg="info" className="me-2">
                                    {singleInvoice.estatus === 1 ? 'Vigente' : 'Cancelado'}
                                </Badge>
                                <Badge bg={singleInvoice.autorizada ? 'success' : 'warning'}>
                                    {singleInvoice.autorizada ? 'Autorizada' : 'Pendiente'}
                                </Badge>
                            </div>
                            <div className="d-flex gap-2 mb-3">
                                <Button variant="outline-success" size="sm">Descargar PDF</Button>
                                <Button variant="primary" size="sm">Ver XML</Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
                <Card className="shadow-sm border-0">
                    <Card.Body>
                        <div className="row">
                            <div className="col-md-6">
                                <h6 className="fw-bold mb-3">Información General</h6>
                                <div className="mb-2">
                                    <strong>UUID:</strong>
                                    <div className="d-flex align-items-center mt-1">
                                        <span className="font-monospace me-2">{singleInvoice.uuid}</span>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleCopy(singleInvoice.uuid)}
                                        >
                                            <BsClipboard className="me-1" />
                                            {copied === singleInvoice.uuid ? 'Copiado' : 'Copiar'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <strong>Fecha de Emisión:</strong>
                                    <span className="ms-2">
                                        {singleInvoice.fechaEmision ? new Date(singleInvoice.fechaEmision).toLocaleDateString('es-MX') : 'N/A'}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Tipo de Comprobante:</strong>
                                    <Badge bg="info" className="ms-2">{singleInvoice.tipoComprobante}</Badge>
                                </div>
                                <div className="mb-2">
                                    <strong>Estatus:</strong>
                                    <Badge bg={singleInvoice.estatus === 1 ? 'success' : 'danger'} className="ms-2">
                                        {singleInvoice.estatus === 1 ? 'Vigente' : 'Cancelado'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <h6 className="fw-bold mb-3">Información Financiera</h6>
                                <div className="mb-2">
                                    <strong>Total a Pagar:</strong>
                                    <span className="ms-2 text-primary fw-bold">
                                        ${singleInvoice.importeAPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Importe Pagado:</strong>
                                    <span className="ms-2 text-success fw-bold">
                                        ${singleInvoice.importePagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Saldo Pendiente:</strong>
                                    <span className="ms-2 text-warning fw-bold">
                                        ${(singleInvoice.importeAPagar - singleInvoice.importePagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Porcentaje Pagado:</strong>
                                    <span className="ms-2">
                                        {Math.round((singleInvoice.importePagado / singleInvoice.importeAPagar) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
                <div className="mt-4">
                    <Button variant="secondary" onClick={() => router.back()}>Volver</Button>
                </div>
            </div>
        );
    }

    // Si es un paquete (código existente)
    if (!packpage) {
        return <Alert variant="danger">No se encontró el paquete.</Alert>;
    }

    return (
        <div className="container-fluid py-4">
            <style jsx>{actionButtonStyles}</style>

            {/* HEADER MODERNO */}
            {packpage && (
                <div className="mb-1">
                                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-2">
                <div className="d-flex align-items-center mb-2 mb-md-0">
                    <h3 className="fw-bold mb-0 me-3" style={{ letterSpacing: '0.5px' }}>
                        Paquete Folio: <span className="text-primary">{packpage.folio}</span>
                    </h3>
                </div>
                <Button 
                    variant="primary" 
                    onClick={handleEnviarADireccion}
                    disabled={!puedeEnviarADireccion || packpage.estatus !== 'Borrador'}
                >
                    <i className="bi bi-send me-1"></i>
                    Enviar a Dirección
                </Button>
            </div>
                    
                        <div className=" text-md" style={{ fontSize: '0.8rem' }}>
                            {user?.username && (
                                <div>
                                    <p className='mb-0 fw-bold'>Usuario: <span className="fw-semibold text-uppercase">{user.username}</span></p>
                                    <p className='mb-2 fw-bold'>Departamento:{packpage.departamento && <span className="fw-semibold text-uppercase "> {packpage.departamento}</span>}</p>
                                </div>
                            )}
                            
                        </div>
                    {/* Comentario y estatus */}
                    <Card className="mb-2 border-0 shadow-sm bg-light">
                        <Card.Body className="py-3 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
                            <div className="d-flex align-items-center mb-2 mb-md-0">
                                <div className="me-3" style={{ fontSize: '1.7rem', color: '#0d6efd' }}>
                                    <i className="bi bi-chat-left-text"></i>
                                </div>
                                <div>
                                    <div className="fw-bold text-primary">Comentario: {packpage.comentario}</div>
                                    <div className="text-dark">
                                        Fecha Pago: {packpage.fechaPago ? new Date(packpage.fechaPago).toLocaleString('es-MX') : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold text-muted">Estatus actual:</span>
                                <Badge bg="info" className="me-2">{packpage.estatus}</Badge>
                                <Badge bg="primary">Borrador → Validar con Dirección</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            )}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Proveedor</th>
                                <th>Folio</th>
                                <th>F. Emisión</th>
                                <th>Info</th>
                                <th>Emisor RFC</th>
                                <th>Estatus</th>
                                <th>Estatus Aut.</th>
                                <th>Total</th>
                                <th>Saldo</th>
                                <th>A Pagar</th>
                                <th className=' text-center'>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(packpage.facturas || []).map((factura: ImportedInvoice, idx: number) => (
                                <tr key={factura._id} className={idx % 2 === 1 ? 'bg-pink bg-opacity-25' : ''}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <div className="fw-bold">{factura.nombreEmisor}</div>
                                        <div>
                                            <Badge bg="secondary" className="me-1">servicio {idx + 1}</Badge>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{factura.uuid}</div>
                                        <div className="mt-1">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="d-flex align-items-center"
                                                onClick={() => handleCopy(factura.uuid)}
                                            >
                                                <BsClipboard className="me-1" />
                                                {copied === factura.uuid ? 'Copiado' : 'Copiar UUID'}
                                            </Button>
                                        </div>
                                    </td>
                                    <td>{factura.fechaEmision ? new Date(factura.fechaEmision).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                                    <td>
                                        <Badge bg="info" className="me-1">{factura.tipoComprobante}</Badge>
                                        <Badge bg="warning" className="me-1 text-dark">PUE</Badge>
                                    </td>
                                    <td>{factura.rfcEmisor}</td>
                                    <td>
                                        <Badge className="bg-success bg-opacity-10 text-success">Vigente</Badge>
                                    </td>
                                    <td>
                                        <span className="text-primary">
                                            {factura.autorizada ? 'Autorizada' :
                                                factura.pagoRechazado ? 'Pago Rechazado' : 'Pendiente'}
                                        </span>
                                        {factura.pagoRechazado && (
                                            <div className="mt-1">
                                                <Badge bg="danger" className="text-white">
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    Requiere nuevo pago
                                                </Badge>
                                            </div>
                                        )}
                                    </td>
                                    <td>${(factura.importeAPagar || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td>${((factura.importeAPagar || 0) - (factura.importePagado || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td>${(factura.importePagado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center align-items-center">
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            className="fw-bold text-success me-1 action-button-hover-border"
                                            title="Autorizar factura"
                                            onClick={() => handleToggleAutorizada(factura._id, true)}
                                            disabled={packpage.estatus === 'Enviado'}
                                        >
                                            Sí <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>✓</span>
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="fw-bold text-danger me-1 action-button-hover-border"
                                            title="Rechazar factura"
                                            onClick={() => handleToggleAutorizada(factura._id, false)}
                                            disabled={packpage.estatus === 'Enviado'}
                                        >
                                            No <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>✗</span>
                                        </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            <tr className="fw-bold text-center">
                                <td colSpan={8}>Total a pagar</td>
                                <td colSpan={1}>${(packpage.totalImporteAPagar || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td colSpan={1}>${((packpage.totalImporteAPagar || 0) - (packpage.totalPagado || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td colSpan={1}>${((packpage.facturas || []).filter(f => f.autorizada).reduce((sum, f) => sum + (f.importeAPagar || 0), 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
            <div className="mt-4">
                <Button variant="secondary" onClick={() => router.back()}>Cerrar</Button>
                <Button variant="outline-secondary" className="ms-2">Mostrar Timeline</Button>
            </div>
        </div>
    );
};

export default NewPackpageDetailsPage; 
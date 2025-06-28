"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { getInvoicesPackageById, InvoicesPackage, ImportedInvoice, toggleFacturaAutorizada, getInvoiceById } from '../services/invoicesPackpage';
import { BsClipboard } from 'react-icons/bs';
import { FiTrash2 } from 'react-icons/fi';
import { BsCheck2 } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { useUserSessionStore } from '@/stores/userSessionStore';

const NewPackpageDetailsPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const packpageId = searchParams.get('packpageId');
    const invoiceId = searchParams.get('invoiceId');
    const [packpage, setPackpage] = useState<InvoicesPackage | null>(null);
    const [singleInvoice, setSingleInvoice] = useState<ImportedInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
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
            setError(null);
            console.log('Cargando paquete con ID:', packpageId);
            const response = await getInvoicesPackageById(packpageId!);
            console.log('Respuesta completa:', response);
            console.log('response.data:', response.data);

            if (!response || !response.data) {
                console.error('No se encontró el paquete. Response:', response);
                setError('No se encontró el paquete.');
                setPackpage(null);
            } else {
                console.log('Paquete encontrado:', response.data);
                setPackpage(response.data);
            }
        } catch (error) {
            console.error('Error al cargar el paquete:', error);
            setError('Error al cargar el paquete');
            setPackpage(null);
            toast.error('Error al cargar el paquete');
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

    const handleToggleAutorizada = async (facturaId: string) => {
        try {
            const result = await toggleFacturaAutorizada(facturaId);
            if (result && result.data && typeof result.data.autorizada !== 'undefined') {
                console.log('result', result.data.autorizada);
                setPackpage((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        facturas: prev.facturas.map(f =>
                            f._id === facturaId ? {
                                ...f,
                                autorizada: result.data.autorizada,
                                importePagado: result.data.importePagado || f.importePagado
                            } : f
                        ),
                    };
                });

                // Mostrar mensaje informativo si la factura fue rechazada
                if (!result.data.autorizada) {
                    toast.info('Factura rechazada. El pago ha sido devuelto a cero.');
                }
            } else {
                console.error('Respuesta inesperada de toggleFacturaAutorizada:', result);
                alert('Error inesperado al cambiar el estado de autorización');
            }
        } catch {
            alert('Error al cambiar el estado de autorización');
        }
    };

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
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
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
            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                        <h4 className="fw-bold mb-0 me-3">
                            Paquete Folio: <span className="text-primary">{packpage.folio}</span> {packpage.departamento && <span className="ms-2">{packpage.departamento}</span>}
                        </h4>
                        <Badge bg="secondary" className="ms-2">MongoDB</Badge>
                    </div>
                    <div className="mb-2 text-muted" style={{ fontSize: '1rem' }}>
                        {packpage._id && <span className="ms-2">Usuario: {packpage.usuario_id}</span>}
                    </div>
                    <div className="d-flex justify-content-between">
                        <div className="d-flex align-items-center mb-3">
                            <span className="me-2">Estatus actual:</span>
                            <Badge bg="info" className="me-2">{packpage.estatus}</Badge>
                            {/* Aquí podrías poner lógica para el siguiente estatus */}
                            <Badge bg="primary">Borrador → Validar con Dirección</Badge>
                        </div>
                        <div className="d-flex gap-2 mb-3">
                            <Button variant="outline-success" size="sm">Descargar Reporte</Button>
                            {packpage.facturas.every(f => f.autorizada) ? (
                                <Button variant="primary" size="sm">Enviar a Dirección</Button>
                            ) : (
                                <Button variant="warning" size="sm">Enviar petición de folio</Button>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>
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
                                        <span className="text-primary">{factura.autorizada ? 'Autorizada' : 'Pendiente'}</span>
                                    </td>
                                    <td>${factura.importeAPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td>${(factura.importeAPagar - factura.importePagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td>${factura.importePagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td className="text-center">
                                        {/* Ambos botones siempre visibles, uno deshabilitado según el estado */}
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            className="fw-bold border-2 border-success text-success me-1"
                                            title="Autorizar"
                                            disabled={factura.autorizada}
                                            onClick={() => handleToggleAutorizada(factura._id)}
                                        >
                                            Sí <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>✓</span>
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="fw-bold border-2 border-danger text-danger me-1"
                                            title="No autorizar"
                                            disabled={!factura.autorizada}
                                            onClick={() => handleToggleAutorizada(factura._id)}
                                        >
                                            No <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>✗</span>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="fw-bold text-center">
                                <td colSpan={8}>Total a pagar</td>
                                <td colSpan={1}>${packpage.totalImporteAPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td colSpan={1}>${(packpage.totalImporteAPagar - packpage.totalPagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td colSpan={1}>${packpage.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
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
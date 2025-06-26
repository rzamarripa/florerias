"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { getInvoicesPackpageById, InvoicesPackpage, ImportedInvoice, toggleFacturaAutorizada } from '../services/invoicesPackpage';
import { BsClipboard } from 'react-icons/bs';
import { FiTrash2 } from 'react-icons/fi';
import { BsCheck2 } from 'react-icons/bs';

const NewPackpageDetailsPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const packpageId = searchParams.get('packpageId');
    const [packpage, setPackpage] = useState<InvoicesPackpage | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!packpageId) return;
        const fetchPackpage = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getInvoicesPackpageById(packpageId);
                console.log('detalle-paquete', response.data)
                setPackpage(response.data);
            } catch {
                setError('Error al cargar el paquete.');
            } finally {
                setLoading(false);
            }
        };
        fetchPackpage();
    }, [packpageId]);

    const handleCopy = (uuid: string) => {
        navigator.clipboard.writeText(uuid);
        setCopied(uuid);
        setTimeout(() => setCopied(null), 1500);
    };

    const handleToggleAutorizada = async (facturaId: string) => {
        try {
            const result = await toggleFacturaAutorizada(facturaId);
            setPackpage((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    facturas: prev.facturas.map(f =>
                        f._id === facturaId ? { ...f, autorizada: result.data.autorizada } : f
                    ),
                };
            });
        } catch {
            alert('Error al cambiar el estado de autorización');
        }
    };

    if (!packpageId) {
        return <Alert variant="warning">No se proporcionó el ID del paquete.</Alert>;
    }
    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
                <div className="mt-2">Cargando paquete...</div>
            </div>
        );
    }
    if (error || !packpage) {
        return <Alert variant="danger">{error || 'No se encontró el paquete.'}</Alert>;
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
                        <Button variant="primary" size="sm">Enviar a Dirección</Button>
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
                            {packpage.facturas.map((factura: ImportedInvoice, idx: number) => (
                                <tr key={factura._id} className={idx % 2 === 1 ? 'bg-pink bg-opacity-25' : ''}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <div className="fw-bold">{factura.nombreEmisor}</div>
                                        <div>
                                            <Badge bg="secondary" className="me-1">servicio {idx + 1}</Badge>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{factura.folioFiscalId}</div>
                                        <div className="mt-1">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="d-flex align-items-center"
                                                onClick={() => handleCopy(factura.folioFiscalId)}
                                            >
                                                <BsClipboard className="me-1" />
                                                {copied === factura.folioFiscalId ? 'Copiado' : 'Copiar UUID'}
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
                                        <button
                                            className="btn btn-light btn-icon btn-sm rounded-circle"
                                            title={factura.autorizada ? 'Desactivar' : 'Activar'}
                                            onClick={() => handleToggleAutorizada(factura._id)}
                                        >
                                            {factura.autorizada ? (
                                                <FiTrash2 size={16} className='text-danger' />
                                            ) : (
                                                <BsCheck2  size={16} className='text-success' />
                                            )}
                                        </button>
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
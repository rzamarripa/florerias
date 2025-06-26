import React, { useState } from 'react';
import { Modal, Button, Form, Table, Alert, Row, Col } from 'react-bootstrap';
import { FiTrash2 } from 'react-icons/fi';
import { useUserSessionStore } from '@/stores/userSessionStore';
import { createInvoicesPackpage, updateInvoicesPackpage } from '../services/invoicesPackpage';
import { toast } from 'react-toastify';

interface FacturaProcesada {
    _id: string;
    nombreEmisor: string;
    folioFiscalId: string;
    fechaEmision: string;
    tipoComprobante: string;
    rfcEmisor: string;
    estatus: string;
    descripcionEstatus: string;
    fechaCancelacion?: string;
    importeAPagar: number;
    saldo: number;
    importePagado: number;
    razonSocial?: { name: string };
}

interface EnviarPagoModalProps {
    show: boolean;
    onClose: () => void;
    facturas: FacturaProcesada[];
    paqueteExistente?: any;
    razonSocialName?: string;
    isNewPackage?: boolean;
    onSuccess?: () => void;
}

const EnviarPagoModal: React.FC<EnviarPagoModalProps> = ({ show, onClose, facturas, paqueteExistente, razonSocialName, isNewPackage = true, onSuccess }) => {
    const [fechaPago, setFechaPago] = useState<string>(paqueteExistente?.fechaPago || '');
    const [comentario, setComentario] = useState<string>(paqueteExistente?.comentario || '');
    const [facturasLocal, setFacturasLocal] = useState<FacturaProcesada[]>(facturas);
    const { user } = useUserSessionStore();

    React.useEffect(() => {
        setFacturasLocal(facturas);
    }, [facturas]);

    const handleRemoveFactura = (id: string) => {
        setFacturasLocal(prev => prev.filter(f => f._id !== id));
    };

    const totalPagar = facturasLocal.reduce((sum, f) => sum + (f.importePagado || 0), 0);
    const totalSaldo = facturasLocal.reduce((sum, f) => sum + (f.saldo || 0), 0);
    const totalImporte = facturasLocal.reduce((sum, f) => sum + (f.importeAPagar || 0), 0);

    const tipoPaquete = paqueteExistente ? 'Paquete Existente' : 'Nuevo Paquete';

    const handleGuardar = async () => {
        try {
            if (!user) {
                toast.error('No hay usuario logueado');
                return;
            }
            if (!user._id || !user.departmentId || !user.department) {
                toast.error('Faltan datos del usuario o departamento.');
                return;
            }
            if (!fechaPago) {
                toast.error('La fecha de pago es obligatoria.');
                return;
            }
            const dataToSend = {
                facturas: facturasLocal.map(f => f._id),
                usuario_id: user._id,
                departamento_id: user.departmentId,
                departamento: user.department,
                comentario,
                fechaPago,
            };
            console.log('Datos enviados al backend:', dataToSend);
            if (isNewPackage) {
                await createInvoicesPackpage(dataToSend);
            } else if (paqueteExistente) {
                await updateInvoicesPackpage(paqueteExistente.folioId, {
                    facturas: facturasLocal.map(f => f._id),
                    comentario,
                    fechaPago,
                });
            }
            toast.success('Paquete guardado correctamente');
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Error al guardar el paquete');
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="xl" centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    Enviar facturas a Pago{razonSocialName ? ` de ${razonSocialName}` : ''} ({tipoPaquete})
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-3">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Fecha Pago:</Form.Label>
                            <Form.Control
                                type="date"
                                value={fechaPago}
                                onChange={e => setFechaPago(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Escriba su comentario</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={1}
                                value={comentario}
                                onChange={e => setComentario(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3} className="d-flex flex-column align-items-end">
                        <Form.Label>Total a Pagar:</Form.Label>
                        <Form.Control
                            type="text"
                            value={totalPagar.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                            readOnly
                            className="fw-bold text-end"
                        />
                    </Col>
                </Row>
                <Alert variant="info" className="mb-3">
                    <b>¡Aviso!</b> No hay presupuesto asignado. Se puede enviar a pago.
                </Alert>
                <div className="table-responsive">
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Proveedor</th>
                                <th>Folio</th>
                                <th>F. Emisión</th>
                                <th>Info</th>
                                <th>Emisor RFC</th>
                                <th>Estatus</th>
                                <th>Fecha Cancelación</th>
                                <th>Saldo</th>
                                <th>Importe Pagado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturasLocal.map((f, idx) => {
                                const saldo = f.importeAPagar - f.importePagado;
                                const estatus = f.estatus === '1' ? { text: 'Vigente', variant: 'success' } : { text: 'Cancelado', variant: 'danger' };
                                return (
                                    <tr key={f._id}>
                                        <td>{idx + 1}</td>
                                        {/* Proveedor */}
                                        <td>
                                            <div>
                                                <strong>{f.nombreEmisor}</strong>
                                                <br />
                                                <small className="text-muted">{f.rfcEmisor}</small>
                                            </div>
                                        </td>
                                        {/* Folio */}
                                        <td>
                                            <small className="font-monospace">{f.folioFiscalId}</small>
                                        </td>
                                        {/* Fecha Emisión */}
                                        <td>{f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString('es-MX') : ''}</td>
                                        {/* Info */}
                                        <td>
                                            <span className="badge fs-6 bg-warning bg-opacity-10 text-warning">PPD</span>
                                        </td>
                                        {/* Emisor RFC */}
                                        <td>{f.rfcEmisor}</td>
                                        {/* Estatus */}
                                        <td>
                                            <span className={`badge fs-6 ${estatus.text === 'Vigente' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>{estatus.text}</span>
                                        </td>
                                        {/* Fecha Cancelación */}
                                        <td>{f.fechaCancelacion ? new Date(f.fechaCancelacion).toLocaleDateString('es-MX') : ''}</td>
                                        {/* Saldo */}
                                        <td>
                                            <span className={saldo > 0 ? 'text-warning' : 'text-success'}>
                                                {f.saldo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </span>
                                        </td>
                                        {/* Importe Pagado */}
                                        <td>
                                            <span className={f.importePagado > 0 ? 'text-success' : 'text-muted'}>
                                                {f.importePagado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </span>
                                        </td>
                                        {/* Acciones */}
                                        <td className="text-center align-middle">
                                            <button
                                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                                onClick={() => handleRemoveFactura(f._id)}
                                                title="Eliminar"
                                                type="button"
                                                tabIndex={0}
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="fw-bold text-center">
                                <td colSpan={8}>Totales</td>
                                <td>{totalSaldo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                <td>{totalPagar.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                <Button variant="primary" onClick={handleGuardar} disabled={facturasLocal.length === 0}>Guardar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EnviarPagoModal; 
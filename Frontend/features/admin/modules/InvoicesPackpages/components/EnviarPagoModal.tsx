import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Row, Col } from 'react-bootstrap';
import { FiTrash2 } from 'react-icons/fi';
import { BsClipboard } from 'react-icons/bs';
import { useUserSessionStore } from '@/stores/userSessionStore';
import { createInvoicesPackage, updateInvoicesPackage, markInvoiceAsFullyPaid, markInvoiceAsPartiallyPaid } from '../services/invoicesPackpage';
import { getNextThursdayOfWeek } from '@/utils/dateUtils';
import { toast } from 'react-toastify';

interface FacturaProcesada {
    _id: string;
    nombreEmisor: string;
    uuid: string;
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
    guardada?: boolean;
    completamentePagada?: boolean;
    autorizada?: boolean;
    estaRegistrada?: boolean;
}

interface EnviarPagoModalProps {
    show: boolean;
    onClose: () => void;
    facturas: FacturaProcesada[];
    paqueteExistente?: any;
    razonSocialName?: string;
    isNewPackage?: boolean;
    onSuccess?: (packpageId?: string) => void;
    selectedCompanyId?: string;
    selectedBrandId?: string;
    selectedBranchId?: string;
    tempPayments?: {
        [invoiceId: string]: {
            tipoPago: 'completo' | 'parcial';
            descripcion: string;
            monto?: number;
            originalImportePagado: number;
            originalSaldo: number;
            conceptoGasto?: string;
        }
    };
    onRemoveTempPayment?: (invoiceId: string) => void;
    onCancel?: () => void;
}

const EnviarPagoModal: React.FC<EnviarPagoModalProps> = ({ show, onClose, facturas, paqueteExistente, razonSocialName, isNewPackage = true, onSuccess, selectedCompanyId, selectedBrandId, selectedBranchId, tempPayments, onRemoveTempPayment, onCancel }) => {
    const [fechaPago, setFechaPago] = useState<string>(paqueteExistente?.fechaPago || '');
    const [comentario, setComentario] = useState<string>(paqueteExistente?.comentario || '');
    const [facturasLocal, setFacturasLocal] = useState<FacturaProcesada[]>([]);
    const [fechaCalculada, setFechaCalculada] = useState<string>('');
    const [copied, setCopied] = useState<string | null>(null);
    const { user } = useUserSessionStore();

    useEffect(() => {
        // IDs de facturas completamente pagadas que ya están en el paquete existente
        const idsCompletamentePagadas = paqueteExistente
            ? paqueteExistente.facturas
                .filter((f: any) => f.importePagado >= f.importeAPagar)
                .map((f: any) => f._id)
            : [];

        // Filtrar facturas: solo excluir las que están completamente pagadas en el paquete existente
        // Las facturas con pago parcial pueden ser registradas nuevamente
        const facturasFiltradas = facturas.filter(f => !idsCompletamentePagadas.includes(f._id));

        // Agrega la propiedad guardada a cada factura
        const facturasConEstado = facturasFiltradas.map(f => {
            // Calcular el importe pagado considerando pagos temporales
            let importePagadoCalculado = f.importePagado;
            if (tempPayments && tempPayments[f._id]) {
                const tempPayment = tempPayments[f._id];
                if (tempPayment.tipoPago === 'completo') {
                    importePagadoCalculado = f.importeAPagar;
                } else if (tempPayment.tipoPago === 'parcial' && tempPayment.monto) {
                    importePagadoCalculado = tempPayment.originalImportePagado + tempPayment.monto;
                }
            }

            return {
                ...f,
                guardada: idsCompletamentePagadas.includes(f._id),
                completamentePagada: importePagadoCalculado >= f.importeAPagar,
                importePagado: importePagadoCalculado // Actualizar el importe pagado con los pagos temporales
            };
        });

        setFacturasLocal(facturasConEstado);
    }, [facturas, paqueteExistente, tempPayments]);

    useEffect(() => {
        if (paqueteExistente?.fechaPago) {
            // Si es un paquete existente, usar la fecha guardada
            const fechaOriginal = new Date(paqueteExistente.fechaPago);
            const fechaFormateada = fechaOriginal.toISOString().split('T')[0];
            setFechaPago(fechaFormateada);
            const fechaCalculada = getNextThursdayOfWeek(fechaFormateada);
            setFechaCalculada(fechaCalculada.toISOString().split('T')[0]);
            setComentario(paqueteExistente.comentario || '');
        } else if (show && isNewPackage) {
            // Si es un nuevo paquete, precargar con la fecha calculada (jueves de la semana siguiente)
            const today = new Date();
            const fechaCalculada = getNextThursdayOfWeek(today);
            const fechaCalculadaStr = fechaCalculada.toISOString().split('T')[0];
            setFechaPago(fechaCalculadaStr);
            setFechaCalculada(fechaCalculadaStr);
            setComentario('');
        } else if (show && !isNewPackage && !paqueteExistente) {
            // Si está en modo edición pero no hay paquete existente, resetear
            setFechaPago('');
            setFechaCalculada('');
            setComentario('');
        }
    }, [paqueteExistente, show, isNewPackage]);

    // Calcular la fecha del jueves de la semana siguiente cuando cambie la fecha de pago
    useEffect(() => {
        if (fechaPago) {
            // Recalcular siempre que cambie la fecha de pago (tanto para paquetes nuevos como existentes)
            const fechaCalculada = getNextThursdayOfWeek(fechaPago);
            setFechaCalculada(fechaCalculada.toISOString().split('T')[0]);
        } else {
            setFechaCalculada('');
        }
    }, [fechaPago]);

    const handleRemoveFactura = (id: string) => {
        setFacturasLocal(prev => prev.filter(f => f._id !== id));

        // Si la factura tiene un pago temporal, también eliminarlo del state principal
        if (tempPayments && tempPayments[id] && onRemoveTempPayment) {
            onRemoveTempPayment(id);
        }
    };

    const handleCopy = (uuid: string) => {
        navigator.clipboard.writeText(uuid);
        setCopied(uuid);
        setTimeout(() => setCopied(null), 1500);
    };

    // Calcular el total considerando pagos temporales y reales
    const totalPagar = facturasLocal.reduce((sum, f) => {
        let importePagadoCalculado = f.importePagado;

        // Si hay pagos temporales para esta factura, calcular el importe total
        if (tempPayments && tempPayments[f._id]) {
            const tempPayment = tempPayments[f._id];
            if (tempPayment.tipoPago === 'completo') {
                importePagadoCalculado = f.importeAPagar;
            } else if (tempPayment.tipoPago === 'parcial' && tempPayment.monto) {
                importePagadoCalculado = tempPayment.originalImportePagado + tempPayment.monto;
            }
        }

        return sum + importePagadoCalculado;
    }, 0);

    const totalSaldo = facturasLocal.reduce((sum, f) => {
        let importePagadoCalculado = f.importePagado;

        // Si hay pagos temporales para esta factura, calcular el importe total
        if (tempPayments && tempPayments[f._id]) {
            const tempPayment = tempPayments[f._id];
            if (tempPayment.tipoPago === 'completo') {
                importePagadoCalculado = f.importeAPagar;
            } else if (tempPayment.tipoPago === 'parcial' && tempPayment.monto) {
                importePagadoCalculado = tempPayment.originalImportePagado + tempPayment.monto;
            }
        }

        return sum + (f.importeAPagar - importePagadoCalculado);
    }, 0);

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

            // PASO 1: Procesar pagos temporales (PUT actualizar facturas)
            if (tempPayments && Object.keys(tempPayments).length > 0) {
                const paymentsToProcess = Object.entries(tempPayments).map(([invoiceId, payment]) => ({
                    invoiceId,
                    ...payment
                }));

                // Procesar cada pago temporal
                for (const payment of paymentsToProcess) {
                    if (payment.tipoPago === 'completo') {
                        await markInvoiceAsFullyPaid(payment.invoiceId, payment.descripcion);
                    } else if (payment.tipoPago === 'parcial' && payment.monto) {
                        await markInvoiceAsPartiallyPaid(payment.invoiceId, payment.descripcion, payment.monto);
                    }
                }

                toast.success('Pagos temporales procesados correctamente');
            }

            // PASO 2: Crear o actualizar paquete de facturas (POST)
            // Usar la fecha calculada (jueves de la semana siguiente) en lugar de la fecha seleccionada
            const fechaPagoParaGuardar = fechaCalculada || fechaPago;

            // Preparar conceptos de gasto para cada factura
            const conceptosGasto: { [invoiceId: string]: string } = {};
            facturasLocal.forEach(factura => {
                if (tempPayments && tempPayments[factura._id] && tempPayments[factura._id].conceptoGasto) {
                    conceptosGasto[factura._id] = tempPayments[factura._id].conceptoGasto!;
                }
            });

            const dataToSend = {
                facturas: facturasLocal.map(f => f._id),
                usuario_id: user._id,
                departamento_id: user.departmentId,
                departamento: user.department,
                comentario,
                fechaPago: fechaPagoParaGuardar,
                companyId: selectedCompanyId,
                brandId: selectedBrandId,
                branchId: selectedBranchId,
                conceptosGasto
            };

            let packpageId: string | undefined = undefined;
            if (isNewPackage) {
                const response = await createInvoicesPackage(dataToSend);
                packpageId = response?.data?._id;
            } else if (paqueteExistente) {
                const response = await updateInvoicesPackage(paqueteExistente._id, {
                    facturas: facturasLocal.map(f => f._id),
                    comentario,
                    fechaPago: fechaPagoParaGuardar,
                    companyId: selectedCompanyId,
                    brandId: selectedBrandId,
                    branchId: selectedBranchId,
                });
                packpageId = response?.data?._id;
            }

            // PASO 3: La relación InvoicesPackageCompany se crea automáticamente en el backend
            // cuando se proporcionan companyId, brandId, branchId en el paso 2

            toast.success('Paquete guardado correctamente');
            onClose();
            if (onSuccess) onSuccess(packpageId);
        } catch (error) {
            console.error('Error al guardar el paquete:', error);
            toast.error('Error al guardar el paquete');
        }
    };

    return (
        <Modal show={show} onHide={onCancel || onClose} size="xl" centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    {paqueteExistente ?
                        `Editar Paquete de Facturas - Folio: ${paqueteExistente.folio}` :
                        `Enviar facturas a Pago${razonSocialName ? ` de ${razonSocialName}` : ''} (Nuevo Paquete)`
                    }
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
                                onChange={e => {
                                    const selectedDate = e.target.value;
                                    const calculated = getNextThursdayOfWeek(selectedDate);
                                    const calculatedStr = calculated.toISOString().split('T')[0];
                                    setFechaPago(calculatedStr);
                                    setFechaCalculada(calculatedStr);
                                }}
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

                {paqueteExistente && facturasLocal.length === 0 && (
                    <Alert variant="warning" className="mb-3">
                        <b>No hay facturas nuevas para agregar:</b>
                        <p className="mb-0 mt-2">
                            Todas las facturas seleccionadas ya están incluidas en este paquete existente.
                            No se pueden agregar facturas duplicadas al mismo paquete.
                        </p>
                    </Alert>
                )}
                <div className="table-responsive">
                    <Table responsive className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Estado</th>
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
                                // Calcular importe pagado considerando pagos temporales
                                let importePagadoCalculado = f.importePagado;
                                let saldoCalculado = f.importeAPagar - f.importePagado;

                                // Si hay pagos temporales para esta factura, calcular el importe total
                                if (tempPayments && tempPayments[f._id]) {
                                    const tempPayment = tempPayments[f._id];
                                    if (tempPayment.tipoPago === 'completo') {
                                        importePagadoCalculado = f.importeAPagar;
                                        saldoCalculado = 0;
                                    } else if (tempPayment.tipoPago === 'parcial' && tempPayment.monto) {
                                        importePagadoCalculado = tempPayment.originalImportePagado + tempPayment.monto;
                                        saldoCalculado = f.importeAPagar - importePagadoCalculado;
                                    }
                                }

                                const estatus = f.estatus === '1' ? { text: 'Vigente', variant: 'success' } : { text: 'Cancelado', variant: 'danger' };
                                return (
                                    <tr key={f._id}>
                                        <td>{idx + 1}</td>
                                        {/* Estado de guardado */}
                                        <td>
                                            {f.completamentePagada ? (
                                                <div className="d-flex flex-column gap-1">
                                                    {f.estaRegistrada ? (
                                                        f.autorizada ? (
                                                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                                                <i className="bi bi-shield-check me-1"></i>
                                                                Autorizada
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                                                <i className="bi bi-clock me-1"></i>
                                                                Procesada
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            Completamente Pagada
                                                        </span>
                                                    )}
                                                </div>
                                            ) : f.importePagado > 0 ? (
                                                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                                    <i className="bi bi-clock me-1"></i>
                                                    Pago Parcial: {Math.round((f.importePagado / f.importeAPagar) * 100)}%
                                                </span>
                                            ) : (
                                                <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">
                                                    <i className="bi bi-plus-circle me-1"></i>
                                                    Nueva
                                                </span>
                                            )}
                                        </td>
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
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="d-flex align-items-center fw-bold text-white"
                                                onClick={() => handleCopy(f.uuid)}
                                            >
                                                <BsClipboard className="me-1" />
                                                {copied === f.uuid ? 'Copiado' : 'COPIAR'}
                                            </Button>
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
                                            <span className={saldoCalculado > 0 ? 'text-warning' : 'text-success'}>
                                                {saldoCalculado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </span>
                                        </td>
                                        {/* Importe Pagado */}
                                        <td>
                                            <span className={importePagadoCalculado > 0 ? 'text-success' : 'text-muted'}>
                                                {importePagadoCalculado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </span>
                                            {tempPayments && tempPayments[f._id] && (
                                                <small className="text-warning d-block">
                                                    <i className="bi bi-clock me-1"></i>
                                                    Temporal
                                                </small>
                                            )}
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
                                <td colSpan={9}>Totales</td>
                                <td>{totalSaldo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                <td>{totalPagar.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel || onClose}>Cerrar</Button>
                <Button
                    variant="primary"
                    onClick={handleGuardar}
                    disabled={facturasLocal.length === 0}
                    title={facturasLocal.length === 0 ? 'No hay facturas nuevas para agregar al paquete' : ''}
                >
                    Guardar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EnviarPagoModal; 
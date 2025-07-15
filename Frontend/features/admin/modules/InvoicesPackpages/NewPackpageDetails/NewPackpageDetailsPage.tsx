"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { getInvoicesPackageById, ImportedInvoice, InvoicesPackage, toggleFacturaAutorizada, getInvoiceById, enviarPaqueteADireccion, createAuthorizationFolio, CreateAuthorizationFolioRequest, getAuthorizationFoliosByPackage, getAuthorizationFolioByNumber, AuthorizationFolio, redeemAuthorizationFolio, getPackageCompanyInfo, PackageCompanyInfo } from '../services/invoicesPackpage';
import { getBudgetByCompanyBrandBranch, BudgetItem } from '../services/budget';
import { BsClipboard } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { useUserSessionStore } from '@/stores';
import { formatDate } from 'date-fns';
import CashPaymentsInPackageTable from "../../cashPayments/components/CashPaymentsInPackageTable";
import { authorizeCashPaymentInPackage, rejectCashPaymentInPackage } from "../../cashPayments/services/cashPayments";

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
    const [activeTab, setActiveTab] = useState<'facturas' | 'pagosEfectivo'>('facturas');
    const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);
    const [solicitandoFolio, setSolicitandoFolio] = useState(false);
    const [showFolioModal, setShowFolioModal] = useState(false);
    const [folioIngresado, setFolioIngresado] = useState('');
    const [validandoFolio, setValidandoFolio] = useState(false);
    const [foliosAutorizados, setFoliosAutorizados] = useState<AuthorizationFolio[]>([]);
    const [todosLosFolios, setTodosLosFolios] = useState<AuthorizationFolio[]>([]);
    const [folioValidado, setFolioValidado] = useState<AuthorizationFolio | null>(null);
    const [packageCompanyInfo, setPackageCompanyInfo] = useState<PackageCompanyInfo | null>(null);

    const { user } = useUserSessionStore();

    useEffect(() => {
        if (packpageId) {
            loadPackpage();
        } else if (invoiceId) {
            loadSingleInvoice();
        }
    }, [packpageId, invoiceId]);

    // Función para obtener el presupuesto del mes
    const loadBudgetData = async () => {
        if (!packpage?.companyInfo) {
            return;
        }

        const { companyId, brandId, branchId } = packpage.companyInfo;


        if (!companyId || !brandId || !branchId) {
            return;
        }

        try {
            // Función helper para convertir a string
            const toString = (value: any): string => {
                if (typeof value === 'string') return value;
                if (value && typeof value === 'object' && value.toString) return value.toString();
                return String(value || '');
            };

            // Convertir ObjectIds a strings si es necesario
            const companyIdStr = toString(companyId);
            const brandIdStr = toString(brandId);
            const branchIdStr = toString(branchId);

            // Usar marzo 2025 que es donde existe el presupuesto
            const monthFormatted = "2025-03";

            const response = await getBudgetByCompanyBrandBranch({
                companyId: companyIdStr,
                brandId: brandIdStr,
                branchId: branchIdStr,
                month: monthFormatted
            });

            setBudgetData(response || []);

        } catch (error) {
            console.error('❌ Error al consultar presupuesto del paquete:', error);
            setBudgetData([]);
        }
    };

    // Función para cargar la información de compañía/marca/sucursal
    const loadPackageCompanyInfo = async () => {
        if (!packpage?._id) {
            return;
        }

        try {
            const response = await getPackageCompanyInfo(packpage._id);
            setPackageCompanyInfo(response);
        } catch (error) {
            console.error('Error al cargar información de compañía del paquete:', error);
            setPackageCompanyInfo(null);
        }
    };

    // Cargar presupuesto cuando se cargue el paquete
    useEffect(() => {
        if (packpage) {
            loadBudgetData();
            loadFoliosAutorizados();
            loadPackageCompanyInfo();
        }
    }, [packpage]);

    // Función para cargar folios autorizados del paquete
    const loadFoliosAutorizados = async () => {
        if (!packpage?._id) return;

        try {
            const folios = await getAuthorizationFoliosByPackage(packpage._id);
            const foliosAutorizados = folios.filter(folio => folio.estatus === 'autorizado');
            setFoliosAutorizados(foliosAutorizados);
            setTodosLosFolios(folios); // Guardar todos los folios para la búsqueda
        } catch (error) {
            console.error('Error al cargar folios autorizados:', error);
            setFoliosAutorizados([]);
        }
    };

    // Función para validar folio ingresado
    const validarFolioIngresado = async (): Promise<boolean> => {
        if (!folioIngresado.trim()) {
            toast.error('Por favor ingrese un folio');
            return false;
        }

        if (!packpage?._id) {
            toast.error('Error: ID del paquete no encontrado');
            return false;
        }

        setValidandoFolio(true);
        try {
            const folio = await getAuthorizationFolioByNumber(folioIngresado.trim());

            if (!folio) {
                toast.error('El folio ingresado no existe');
                return false;
            }

            // Comparar los IDs como strings
            const folioPackageId = String(folio.paquete_id);
            const currentPackageId = String(packpage._id);

            if (folioPackageId !== currentPackageId) {
                toast.error('El folio no corresponde a este paquete');
                return false;
            }

            if (folio.estatus !== 'autorizado') {
                toast.error(`El folio tiene estatus "${folio.estatus}". Solo se aceptan folios autorizados`);
                return false;
            }

            toast.success('Folio validado correctamente');
            setFolioValidado(folio); // Guardar el folio validado para canjearlo después
            return true;
        } catch (error) {
            console.error('Error al validar folio:', error);
            toast.error('Error al validar el folio');
            return false;
        } finally {
            setValidandoFolio(false);
        }
    };

    const loadPackpage = async () => {
        try {
            setLoading(true);
            const response = await getInvoicesPackageById(packpageId!);

            if (!response || !response.data) {
                console.error('No se encontró el paquete. Response:', response);
                setPackpage(null);
            } else {
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

                // Verificar si hay duplicados por UUID
                const uuids = packpageData.facturas?.map((f: any) => f.uuid) || [];
                const uuidsUnicos = [...new Set(uuids)];
                if (uuids.length !== uuidsUnicos.length) {
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

            const result = await toggleFacturaAutorizada(facturaId, nuevoEstado, packpage?._id);

            if (result && result.success && typeof (result.data as any).autorizada !== 'undefined') {

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
                    const facturasAutorizadas = facturasActualizadas.filter(f => f.autorizada === true);

                    // Total pagado: solo facturas autorizadas
                    const totalPagado = facturasAutorizadas.reduce((sum, f) => sum + (f.importePagado || 0), 0);

                    // Total importe a pagar: solo facturas autorizadas (como se guarda en BD)
                    const totalImporteAPagar = facturasAutorizadas.reduce((sum, f) => sum + (f.importeAPagar || 0), 0);


                    return {
                        ...prev,
                        facturas: facturasActualizadas,
                        totalPagado,
                        totalImporteAPagar
                    };
                });

                if (!(result.data as any).autorizada) {
                    toast.info('Factura rechazada. Los datos de pago se han reiniciado y puede ser pagada nuevamente en otro paquete.');
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

        // Verificar si hay exceso de presupuesto
        const excesoInfo = verificarExcesoPresupuesto();
        if (excesoInfo.excede) {
            // Si hay exceso pero existen folios autorizados, abrir modal
            if (foliosAutorizados.length > 0) {
                setShowFolioModal(true);
                return;
            } else {
                toast.error('No se puede enviar el paquete. Presupuesto excedido y no hay folios autorizados.');
                return;
            }
        }

        // Si no hay exceso, enviar directamente
        await enviarPaqueteATesoreria();
    };

    const enviarPaqueteATesoreria = async (folioParaCanjear?: AuthorizationFolio) => {
        if (!packpage?._id) return;

        try {
            const result = await enviarPaqueteADireccion(packpage._id);
            if (result && result.success && result.data && result.data.estatus === 'Enviado') {
                toast.success('Paquete enviado a tesorería correctamente');
                setPackpage(prev => prev ? { ...prev, estatus: 'Enviado' } : null);
                setShowFolioModal(false);
                setFolioIngresado('');

                // Si se utilizó un folio de autorización, canjearlo
                const folioACanjear = folioParaCanjear || folioValidado;
                if (folioACanjear) {
                    try {
                        await redeemAuthorizationFolio(folioACanjear._id);
                        toast.success(`Folio ${folioACanjear.folio} canjeado correctamente`);
                        setFolioValidado(null); // Limpiar el folio validado
                        await loadFoliosAutorizados(); // Recargar folios para actualizar estado
                    } catch (error) {
                        console.error('Error al canjear folio:', error);
                        toast.warning('Paquete enviado pero hubo un error al canjear el folio');
                    }
                }
            } else {
                toast.error('Error al enviar el paquete a tesorería');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Error al enviar el paquete a tesorería');
        }
    };

    const handleValidarYEnviar = async () => {
        const folioValido = await validarFolioIngresado();
        if (folioValido) {
            // Obtener el folio validado para pasarlo directamente
            const folioValidadoActual = await getAuthorizationFolioByNumber(folioIngresado.trim());
            await enviarPaqueteATesoreria(folioValidadoActual || undefined);
        }
    };

    const handleSolicitarFolio = async () => {
        if (!packpage?._id || !user?._id) {
            toast.error('No se puede solicitar el folio. Datos faltantes.');
            return;
        }

        setSolicitandoFolio(true);
        try {
            const excesoInfo = verificarExcesoPresupuesto();
            const now = new Date();
            const folioNumber = `AUTH-${packpage.folio}-${now.getTime()}`;

            const folioData: CreateAuthorizationFolioRequest = {
                paquete_id: packpage._id,
                motivo: `Exceso de presupuesto por $${excesoInfo.diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                usuario_id: user._id,
                fecha: now.toISOString(),
                fechaFolioAutorizacion: now.toISOString(),
                folio: folioNumber
            };

            const response = await createAuthorizationFolio(folioData);

            if (response && response.success) {
                toast.success(`Folio de autorización ${folioNumber} creado exitosamente`);
                // Recargar folios autorizados
                await loadFoliosAutorizados();
            } else {
                toast.error('Error al crear el folio de autorización');
            }
        } catch (error: any) {
            console.error('Error al solicitar folio:', error);
            toast.error(error?.message || 'Error al solicitar el folio de autorización');
        } finally {
            setSolicitandoFolio(false);
        }
    };

    // Verificar si se puede enviar a dirección (todas las facturas procesadas)
    const puedeEnviarADireccion = packpage && packpage.facturas &&
        packpage.facturas.length > 0 &&
        packpage.facturas.every((factura: ImportedInvoice) => factura.autorizada !== null);

    // Función para calcular el total de visualización (autorizadas + pendientes)
    const calcularTotalVisualizacion = () => {
        if (!packpage?.facturas) return 0;
        const facturasNoRechazadas = packpage.facturas.filter(f => f.autorizada !== false); // autorizadas + pendientes
        return facturasNoRechazadas.reduce((sum, f) => sum + toNumber(f.importeAPagar), 0);
    };

    // Función para calcular el total pagado de visualización (autorizadas + pendientes)
    const calcularTotalPagadoVisualizacion = () => {
        if (!packpage?.facturas) return 0;
        const facturasNoRechazadas = packpage.facturas.filter(f => f.autorizada !== false); // autorizadas + pendientes
        return facturasNoRechazadas.reduce((sum, f) => sum + toNumber(f.importePagado), 0);
    };

    // Función helper para convertir valores a números
    const toNumber = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;

        // Manejar objetos con formato $numberDecimal de MongoDB
        if (typeof value === 'object' && value !== null) {
            if (value.$numberDecimal) {
                return parseFloat(value.$numberDecimal) || 0;
            }
            if (value._bsontype === 'Decimal128') {
                return parseFloat(value.toString()) || 0;
            }
        }

        return 0;
    };

    // Función para calcular totales de facturas
    const calcularTotalesFacturas = () => {
        if (!packpage?.facturas) return { total: 0, pagado: 0, pendiente: 0, cantidad: 0 };

        const facturasNoRechazadas = packpage.facturas.filter(f => f.autorizada !== false);
        const total = facturasNoRechazadas.reduce((sum, f) => sum + toNumber(f.importeAPagar), 0);
        const pagado = facturasNoRechazadas.reduce((sum, f) => sum + toNumber(f.importePagado), 0);
        const pendiente = total - pagado;

        return {
            total,
            pagado,
            pendiente,
            cantidad: facturasNoRechazadas.length
        };
    };

    // Función para calcular totales de pagos en efectivo
    const calcularTotalesPagosEfectivo = () => {
        if (!packpage?.pagosEfectivo) return { total: 0, pagado: 0, pendiente: 0, cantidad: 0 };

        const pagosNoRechazados = packpage.pagosEfectivo.filter(p => p.autorizada !== false);
        const total = pagosNoRechazados.reduce((sum, p) => sum + toNumber(p.importeAPagar), 0);
        const pagado = pagosNoRechazados.reduce((sum, p) => sum + toNumber(p.importePagado), 0);
        const pendiente = total - pagado;

        return {
            total,
            pagado,
            pendiente,
            cantidad: pagosNoRechazados.length
        };
    };

    // Función para calcular el presupuesto total del mes
    const calcularPresupuestoTotal = () => {
        if (!Array.isArray(budgetData)) return 0;

        return budgetData.reduce((acc, budget) => {
            return acc + (budget.assignedAmount || 0);
        }, 0);
    };

    // Función para verificar si el presupuesto se excede
    const verificarExcesoPresupuesto = () => {
        const presupuestoTotal = calcularPresupuestoTotal();
        const totalPagadoPaquete = calcularTotalesFacturas().pagado + calcularTotalesPagosEfectivo().pagado;

        return {
            presupuestoTotal,
            totalPagadoPaquete,
            excede: totalPagadoPaquete > presupuestoTotal,
            diferencia: totalPagadoPaquete - presupuestoTotal
        };
    };

    // Función para determinar qué mostrar según el estado de los folios
    const determinarMensajeFolio = () => {
        const excesoInfo = verificarExcesoPresupuesto();

        // Si no hay exceso, no mostrar nada
        if (!excesoInfo.excede) {
            return null;
        }

        // Si hay exceso pero no hay folios, mostrar alerta de exceso
        if (todosLosFolios.length === 0) {
            return {
                tipo: 'exceso',
                variant: 'warning',
                titulo: 'Presupuesto total del mes excedido',
                mensaje: 'Por favor solicite un folio de autorización.',
                diferencia: excesoInfo.diferencia
            };
        }

        // Si hay folios, mostrar el estado del folio más reciente
        const folioMasReciente = todosLosFolios.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        if (folioMasReciente.estatus === 'pendiente') {
            return {
                tipo: 'folio',
                variant: 'info',
                titulo: 'Folio de autorización generado',
                mensaje: 'Pendiente de autorización',
                folio: folioMasReciente.folio
            };
        }

        if (folioMasReciente.estatus === 'autorizado') {
            return {
                tipo: 'folio',
                variant: 'success',
                titulo: 'Folio de autorización generado',
                mensaje: 'Autorizado y listo para canjear',
                folio: folioMasReciente.folio
            };
        }

        if (folioMasReciente.estatus === 'rechazado') {
            return {
                tipo: 'folio',
                variant: 'danger',
                titulo: 'Folio de autorización generado',
                mensaje: 'Folio no autorizado, no es posible enviar a tesorería',
                folio: folioMasReciente.folio
            };
        }

        return null;
    };


    // Handler para recargar el paquete tras autorizar/rechazar
    const reloadPackpage = async () => {
        if (!packpage?._id) return;
        try {
            const response = await getInvoicesPackageById(packpage._id);
            if (response && response.data) {
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

                setPackpage(packpageData);
            }
        } catch (error) {
            console.error('Error al recargar el paquete:', error);
            toast.error('Error al recargar el paquete');
        }
    };

    // Handler para autorizar pago en efectivo
    const handleAuthorizeCashPayment = async (pagoId: string) => {
        setLoading(true);
        try {
            if (!packpage) return;
            await authorizeCashPaymentInPackage(packpage._id, pagoId);
            await reloadPackpage();
            toast.success("Pago autorizado correctamente");
        } catch {
            toast.error("Error al autorizar el pago");
        }
        setLoading(false);
    };

    // Handler para rechazar pago en efectivo
    const handleRejectCashPayment = async (pagoId: string) => {
        setLoading(true);
        try {
            if (!packpage) return;
            await rejectCashPaymentInPackage(packpage._id, pagoId);
            await reloadPackpage();
            toast.success("Pago rechazado correctamente");
        } catch {
            toast.error("Error al rechazar el pago");
        }
        setLoading(false);
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
                                        ${toNumber(singleInvoice.importeAPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Importe Pagado:</strong>
                                    <span className="ms-2 text-success fw-bold">
                                        ${toNumber(singleInvoice.importePagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Saldo Pendiente:</strong>
                                    <span className="ms-2 text-warning fw-bold">
                                        ${(toNumber(singleInvoice.importeAPagar) - toNumber(singleInvoice.importePagado)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Porcentaje Pagado:</strong>
                                    <span className="ms-2">
                                        {Math.round((toNumber(singleInvoice.importePagado) / toNumber(singleInvoice.importeAPagar)) * 100)}%
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
                            disabled={!puedeEnviarADireccion || packpage.estatus !== 'Borrador' || (verificarExcesoPresupuesto().excede && foliosAutorizados.length === 0)}
                        >
                            <i className="bi bi-send me-1"></i>
                            Enviar a Tesorería
                        </Button>
                    </div>

                    <div className=" text-md" style={{ fontSize: '0.8rem' }}>
                        {user?.username && (
                            <div>
                                <p className='mb-0 fw-bold'>Usuario: <span className="fw-semibold text-uppercase">{user.profile.fullName}</span></p>
                                <p className='mb-2 fw-bold'>Departamento:{packpage.departamento && <span className="fw-semibold text-uppercase "> {packpage.departamento}</span>}</p>
                            </div>
                        )}

                    </div>
                    {/* Comentario, estatus y empresa */}
                    <Card className="mb-2 border-0 shadow-sm bg-light">
                        <Card.Body className="py-3 px-4 d-flex flex-column flex-md-row align-items-md-start justify-content-between">
                            <div className="flex-grow-1 me-md-4">
                                {/* Comentario y fecha de pago */}
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3" style={{ fontSize: '1.7rem', color: '#0d6efd' }}>
                                        <i className="bi bi-chat-left-text"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-primary">Comentario: {packpage.comentario}</div>
                                        <div className="text-dark">
                                            Fecha Pago: {formatDate(packpage.fechaPago.toString(), 'dd/MM/yyyy')}
                                        </div>
                                    </div>
                                </div>

                                {/* Estatus */}
                                <div className="d-flex align-items-center">
                                    <span className="fw-semibold text-muted me-2">Estatus actual:</span>
                                    <Badge bg="info" className="me-2">{packpage.estatus}</Badge>
                                    <Badge bg="primary">Borrador → Tesorería</Badge>
                                </div>
                            </div>

                            {/* Información de la empresa - a la derecha */}
                            {packageCompanyInfo && (
                                <div className="d-flex align-items-center mt-3 mt-md-0">
                                    <div className="me-3" style={{ fontSize: '1.5rem', color: '#0d6efd' }}>
                                        <i className="bi bi-building"></i>
                                    </div>
                                    <div className="text-end text-md-end">
                                        <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                                            {packageCompanyInfo.companyId.name}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '1rem' }}>
                                            {packageCompanyInfo.brandId && (

                                                <span className="me-3">
                                                    Marca:
                                                    <i className="bi bi-tag me-1"></i>
                                                    {packageCompanyInfo.brandId.name}
                                                </span>
                                            )}
                                            {packageCompanyInfo.branchId && (
                                                <span>
                                                    Sucursal:
                                                    <i className="bi bi-geo-alt me-1"></i>
                                                    {packageCompanyInfo.branchId.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Resumen financiero del paquete */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Body className="py-3 px-4">
                            <div className="row g-3">
                                <div className="col-md-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3" style={{ fontSize: '1.5rem', color: '#dc3545' }}>
                                            <i className="bi bi-wallet2"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-danger">Presupuesto</div>
                                            <div className="text-muted small">
                                                Mes de marzo
                                            </div>
                                            <div className="fw-bold text-danger">
                                                ${calcularPresupuestoTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3" style={{ fontSize: '1.5rem', color: '#17a2b8' }}>
                                            <i className="bi bi-file-earmark-text"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-info">Facturas</div>
                                            <div className="text-muted small">
                                                {calcularTotalesFacturas().cantidad} facturas
                                            </div>
                                            <div className="fw-bold text-primary">
                                                ${calcularTotalesFacturas().total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3" style={{ fontSize: '1.5rem', color: '#28a745' }}>
                                            <i className="bi bi-cash-coin"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-success">Pagos en efectivo</div>
                                            <div className="text-muted small">
                                                {calcularTotalesPagosEfectivo().cantidad} pagos
                                            </div>
                                            <div className="fw-bold text-primary">
                                                ${calcularTotalesPagosEfectivo().total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3" style={{ fontSize: '1.5rem', color: '#fd7e14' }}>
                                            <i className="bi bi-credit-card"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-warning">Total a pagar</div>
                                            <div className="text-muted small">
                                                Suma de importes pagados
                                            </div>
                                            <div className="fw-bold text-success">
                                                ${(calcularTotalesFacturas().pagado + calcularTotalesPagosEfectivo().pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Alerta de exceso de presupuesto o estado del folio */}
                    {(() => {
                        const mensajeFolio = determinarMensajeFolio();
                        if (!mensajeFolio) return null;

                        return (
                            <Alert variant={mensajeFolio.variant} className="mb-3 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className="me-3" style={{ fontSize: '1.5rem', color: mensajeFolio.variant === 'warning' ? '#856404' : mensajeFolio.variant === 'info' ? '#0c5460' : mensajeFolio.variant === 'success' ? '#0a3622' : '#721c24' }}>
                                        <i className={`bi ${mensajeFolio.variant === 'warning' ? 'bi-exclamation-triangle-fill' : mensajeFolio.variant === 'info' ? 'bi-info-circle-fill' : mensajeFolio.variant === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold">{mensajeFolio.titulo}</div>
                                        <div className="text-muted">
                                            {mensajeFolio.mensaje}
                                            {mensajeFolio.diferencia && (
                                                <>
                                                    <br />
                                                    Exceso: ${mensajeFolio.diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    {mensajeFolio.tipo === 'exceso' && (
                                        <Button variant="outline-warning" size="sm" className="fw-bold" onClick={handleSolicitarFolio} disabled={solicitandoFolio}>
                                            <i className="bi bi-clipboard-check me-2"></i>
                                            {solicitandoFolio ? 'Solicitando...' : 'Solicitar Folio'}
                                        </Button>
                                    )}
                                </div>
                            </Alert>
                        );
                    })()}
                </div>
            )}

            {/* Tabs de facturas y pagos en efectivo */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <a href="#facturas" className={`nav-link${activeTab === 'facturas' ? ' active' : ''}`} onClick={() => setActiveTab('facturas')}>Facturas</a>
                </li>
                <li className="nav-item">
                    <a href="#pagosEfectivo" className={`nav-link${activeTab === 'pagosEfectivo' ? ' active' : ''}`} onClick={() => setActiveTab('pagosEfectivo')}>Pagos en efectivo</a>
                </li>
            </ul>
            <div className="tab-content">
                <div className={`tab-pane${activeTab === 'facturas' ? ' show active' : ''}`} id="facturas">
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
                                        <th className='text-center'>Total</th>
                                        <th className='text-center'>Saldo</th>
                                        <th className='text-center'>A Pagar</th>
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
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="d-flex align-items-center fw-bold text-white"
                                                    onClick={() => handleCopy(factura.uuid)}
                                                >
                                                    <BsClipboard className="me-1" />
                                                    {copied === factura.uuid ? 'Copiado' : 'COPIAR'}
                                                </Button>
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
                                            </td>
                                            <td className='text-end'>${toNumber(factura.importeAPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td className='text-end'>${(toNumber(factura.importeAPagar) - toNumber(factura.importePagado)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td className='text-end'>${toNumber(factura.importePagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
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
                                    <tr className="fw-bold text-left">
                                        <td className='text-end' colSpan={8}>Total a pagar</td>
                                        <td className='text-end' colSpan={1}>${calcularTotalVisualizacion().toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td className='text-end' colSpan={1}>${((calcularTotalVisualizacion()) - (calcularTotalPagadoVisualizacion())).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td className='text-end' colSpan={1}>${calcularTotalPagadoVisualizacion().toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </div>
                <div className={`tab-pane${activeTab === 'pagosEfectivo' ? ' show active' : ''}`} id="pagosEfectivo">
                    <CashPaymentsInPackageTable
                        pagos={packpage?.pagosEfectivo || []}
                        onAuthorize={handleAuthorizeCashPayment}
                        onReject={handleRejectCashPayment}
                        loading={loading}
                        packageStatus={packpage?.estatus}
                    />
                </div>
            </div>
            <div className="mt-4">
                <Button variant="secondary" onClick={() => router.back()}>Cerrar</Button>
                <Button variant="outline-secondary" className="ms-2">Mostrar Timeline</Button>
            </div>

            {/* Modal para ingreso de folio de autorización */}
            <Modal show={showFolioModal} onHide={() => {
                setShowFolioModal(false);
                setFolioValidado(null);
                setFolioIngresado('');
            }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Ingrese folio de autorización</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <Alert variant="warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            El presupuesto mensual ha sido excedido. Para enviar este paquete a tesorería,
                            debe ingresar un folio de autorización válido.
                        </Alert>
                    </div>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Folio de autorización</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ingrese el folio de autorización"
                                value={folioIngresado}
                                onChange={(e) => setFolioIngresado(e.target.value)}
                                disabled={validandoFolio}
                            />
                            <Form.Text className="text-muted">
                                El folio debe estar autorizado y corresponder a este paquete.
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShowFolioModal(false);
                        setFolioValidado(null);
                        setFolioIngresado('');
                    }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleValidarYEnviar}
                        disabled={validandoFolio || !folioIngresado.trim()}
                    >
                        {validandoFolio ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Validando...
                            </>
                        ) : (
                            'Validar y Enviar'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default NewPackpageDetailsPage; 
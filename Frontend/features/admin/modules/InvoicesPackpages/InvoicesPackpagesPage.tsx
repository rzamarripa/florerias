"use client"
import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Card,
    Table,
    ButtonGroup,
    Spinner,
    Modal,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { BsClipboard } from 'react-icons/bs';
import BudgetSummaryCards from './components/BudgetSummaryCards';
import {
    userProvidersService,
    getInvoicesByProviderAndCompany,
    getInvoicesSummaryByProviderAndCompany,
    ImportedInvoice,
    InvoicesSummaryResponse,
    getInvoicesPackagesCreatedByUsuario,
    getUserVisibilityForSelects,
    getBudgetByCompanyBrandBranch,
    BudgetItem
} from './services';
import { UserProvider, UserVisibilityStructure, VisibilityCompany, VisibilityBrand, VisibilityBranch } from './types';
import PagoFacturaModal from './components/PagoFacturaModal';
import EnviarPagoModal from './components/EnviarPagoModal';
import { useUserSessionStore } from '@/stores/userSessionStore';
import CreatedPackpageModal from './components/CreatedPackpageModal';
import { useRouter } from 'next/navigation';
import DescuentoFacturaModal from './components/DescuentoFacturaModal';
import MultiSelect from '@/components/forms/Multiselect';
import { CashPaymentModal } from '../cashPayments/components/CashPaymentModal';

const InvoicesPackagePage: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [isNewPackage, setIsNewPackage] = useState(true);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [userProviders, setUserProviders] = useState<UserProvider[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

    // Estados para los selects en cascada
    const [companies, setCompanies] = useState<VisibilityCompany[]>([]);
    const [brands, setBrands] = useState<VisibilityBrand[]>([]);
    const [branches, setBranches] = useState<VisibilityBranch[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // Estados para la estructura de visibilidad
    const [visibilityStructure, setVisibilityStructure] = useState<UserVisibilityStructure | null>(null);

    // Estado para el presupuesto
    const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);

    // Estados para las facturas
    const [invoices, setInvoices] = useState<ImportedInvoice[]>([]);
    const [invoicesSummary, setInvoicesSummary] = useState<InvoicesSummaryResponse['data'] | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pages: 0,
        limit: 15
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Estados para los modales
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [tipoPagoModal, setTipoPagoModal] = useState<'completo' | 'parcial'>('completo');
    const [saldoModal, setSaldoModal] = useState(0);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [showEnviarPagoModal, setShowEnviarPagoModal] = useState(false);
    const [facturasProcesadas, setFacturasProcesadas] = useState<ImportedInvoice[]>([]);
    const [paqueteExistenteSeleccionado, setPaqueteExistenteSeleccionado] = useState<any>(null);
    const [existingPackages, setExistingPackages] = useState<any[]>([]);
    const [showCreatedPackpageModal, setShowCreatedPackpageModal] = useState(false);
    const [createdPackpageId, setCreatedPackpageId] = useState<string | null>(null);

    // Estado para el modal de descuento
    const [showDescuentoModal, setShowDescuentoModal] = useState(false);
    const [descuentoSaldo, setDescuentoSaldo] = useState(0);
    const [descuentoInvoiceId, setDescuentoInvoiceId] = useState<string | null>(null);

    // Estados para el modal de pago en efectivo
    const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
    const [showCashPaymentConfirmModal, setShowCashPaymentConfirmModal] = useState(false);

    // Estado local para pagos temporales
    const [tempPayments, setTempPayments] = useState<{
        [invoiceId: string]: {
            tipoPago: 'completo' | 'parcial';
            descripcion: string;
            monto?: number;
            originalImportePagado: number;
            originalSaldo: number;
            conceptoGasto?: string;
        }
    }>({});

    const { user } = useUserSessionStore();
    const router = useRouter();

    // Declaración de los meses del año (requerido por el linter)
    const months: string[] = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Cargar proveedores del usuario al montar el componente
    useEffect(() => {
        loadUserProviders();
    }, []);

    // Cargar visibilidad cuando el usuario esté disponible
    useEffect(() => {
        if (user?._id) {
            loadUserVisibilityStructure();
        }
    }, [user?._id]);

    // Cargar facturas automáticamente cuando cambie el año o mes
    useEffect(() => {
        if ((selectedProviders.length > 0 || selectedCompany) && !loadingInvoices) {
            handleSearch();
        }
    }, [selectedYear, selectedMonth]);

    const loadUserProviders = async () => {
        try {
            const response = await userProvidersService.getCurrentUserProviders({
                limit: 100 // Obtener todos los proveedores sin paginación
            });
            setUserProviders(response.data || []);
        } catch (err) {
            console.error('Error cargando proveedores del usuario:', err);
            toast.error('Error al cargar los proveedores');
        }
    };

    const loadUserVisibilityStructure = async () => {
        if (!user?._id) return;

        try {
            const response = await getUserVisibilityForSelects(user._id);
            setVisibilityStructure(response);
            setCompanies(response?.companies || []);
        } catch (err) {
            console.error('Error cargando estructura de visibilidad:', err);
            toast.error('Error al cargar la estructura de visibilidad');
        }
    };

    const handleCompanyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const companyId = event.target.value;

        setSelectedCompany(companyId);
        setSelectedBrand('');
        setSelectedBranch('');

        // Filtrar marcas por compañía seleccionada
        if (companyId && visibilityStructure) {
            const companyBrands = visibilityStructure.brands.filter(brand => brand.companyId === companyId);
            setBrands(companyBrands);
        } else {
            setBrands([]);
        }
    };

    const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const brandId = event.target.value;

        setSelectedBrand(brandId);
        setSelectedBranch('');

        // Filtrar sucursales por marca seleccionada
        if (brandId && visibilityStructure) {
            const brandBranches = visibilityStructure.branches.filter(branch => branch.brandId === brandId);
            setBranches(brandBranches);
        } else {
            setBranches([]);
        }
    };

    const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBranch(event.target.value);
    };

    // Función para consultar el presupuesto cuando se seleccionen los 3 valores
    const consultarPresupuesto = async () => {
        if (!selectedCompany || !selectedBrand || !selectedBranch) {
            setBudgetData([]);
            return;
        }

        try {
            // Construir el mes en formato YYYY-MM
            const monthFormatted = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;

            const response = await getBudgetByCompanyBrandBranch({
                companyId: selectedCompany,
                brandId: selectedBrand,
                branchId: selectedBranch,
                month: monthFormatted
            });

            // Guardar el presupuesto en el estado - response ya es el array directamente
            setBudgetData(response || []);

        } catch (error) {
            console.error('Error al consultar presupuesto:', error);
            setBudgetData([]);
        }
    };

    // Efecto para consultar presupuesto SOLO cuando se seleccione la sucursal o cambien mes/año
    useEffect(() => {
        if (selectedBranch) {
            consultarPresupuesto();
        } else {
            setBudgetData([]);
        }
    }, [selectedBranch, selectedYear, selectedMonth]);



    // Funciones para manejar pagos temporales
    const handleTempPayment = (invoiceId: string, tipoPago: 'completo' | 'parcial', descripcion: string, monto?: number, conceptoGasto?: string) => {
        const invoice = invoices.find(inv => inv._id === invoiceId);
        if (!invoice) return;

        const originalSaldo = invoice.importeAPagar - invoice.importePagado;

        setTempPayments(prev => ({
            ...prev,
            [invoiceId]: {
                tipoPago,
                descripcion,
                monto,
                originalImportePagado: invoice.importePagado,
                originalSaldo,
                conceptoGasto
            }
        }));

        toast.success(tipoPago === 'completo' ? 'Pago completo registrado temporalmente' : 'Pago parcial registrado temporalmente');
    };

    // Función para eliminar un pago temporal
    const handleRemoveTempPayment = (invoiceId: string) => {
        setTempPayments(prev => {
            const newTempPayments = { ...prev };
            delete newTempPayments[invoiceId];
            return newTempPayments;
        });
        toast.info('Pago temporal eliminado');
    };

    // Función para calcular el resumen combinado (backend + pagos temporales)
    const combinedSummary = React.useMemo(() => {
        if (!invoicesSummary) return null;

        // Calcular total de pagos temporales
        let totalTempPagado = 0;
        let facturasTempPagadas = 0;

        Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
            if (payment.tipoPago === 'completo') {
                // Buscar la factura original para obtener el importe a pagar
                const invoice = invoices.find(inv => inv._id === invoiceId);
                if (invoice) {
                    totalTempPagado += invoice.importeAPagar;
                    facturasTempPagadas += 1;
                }
            } else if (payment.tipoPago === 'parcial' && payment.monto) {
                totalTempPagado += payment.monto;
                // Solo contar como pagada si el pago parcial + original completa la factura
                const invoice = invoices.find(inv => inv._id === invoiceId);
                if (invoice && (invoice.importePagado + payment.monto) >= invoice.importeAPagar) {
                    facturasTempPagadas += 1;
                }
            }
        });

        return {
            ...invoicesSummary,
            totalPagado: invoicesSummary.totalPagado + totalTempPagado,
            totalSaldo: invoicesSummary.totalSaldo - totalTempPagado,
            facturasPagadas: (invoicesSummary.facturasPagadas || 0) + facturasTempPagadas
        };
    }, [invoicesSummary, tempPayments, invoices]);

    const getInvoiceWithTempPayments = (invoice: ImportedInvoice) => {
        const tempPayment = tempPayments[invoice._id];
        if (!tempPayment) return invoice;

        let newImportePagado = invoice.importePagado;
        if (tempPayment.tipoPago === 'completo') {
            newImportePagado = invoice.importeAPagar;
        } else if (tempPayment.tipoPago === 'parcial' && tempPayment.monto) {
            newImportePagado = invoice.importePagado + tempPayment.monto;
        }

        return {
            ...invoice,
            importePagado: newImportePagado
        };
    };

    const handleSearch = async () => {
        if (selectedProviders.length === 0 && !selectedCompany) {
            toast.warn('Selecciona al menos un proveedor o una razón social para buscar');
            return;
        }
        try {
            setLoadingInvoices(true);
            // Obtener los IDs de los proveedores seleccionados
            const providerIdsParam = selectedProviders.join(',');
            
            console.log('🔍 PACKAGES: Ejecutando handleSearch con companyId:', selectedCompany);

            // Calcular fechas de inicio y fin del mes seleccionado
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

            // Buscar facturas y paquetes existentes al mismo tiempo
            console.log('🚀 PACKAGES: Llamando a getInvoicesByProviderAndCompany');
            const [invoicesResponse, summaryResponse, packagesResponse] = await Promise.all([
                getInvoicesByProviderAndCompany({
                    providerIds: providerIdsParam,
                    companyId: selectedCompany,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    page: currentPage,
                    limit: 15,
                    sortBy: 'fechaEmision',
                    order: 'desc'
                }),
                getInvoicesSummaryByProviderAndCompany({
                    companyId: selectedCompany,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
                user?._id ? getInvoicesPackagesCreatedByUsuario(user._id) : Promise.resolve([])
            ]);



            if (invoicesResponse && invoicesResponse.data) {
                setInvoices(invoicesResponse.data);
                setPagination(invoicesResponse.pagination || pagination);
            } else {
                toast.error('Error al cargar las facturas');
            }

            if (summaryResponse && summaryResponse.data) {
                setInvoicesSummary(summaryResponse.data);
            } else {
                toast.error('Error al cargar el resumen');
            }

            // Actualizar paquetes existentes
            setExistingPackages(
                Array.isArray(packagesResponse?.data)
                    ? packagesResponse.data
                    : Array.isArray(packagesResponse)
                        ? packagesResponse
                        : []
            );

        } catch (error) {
            console.error('Error en la búsqueda:', error);
            toast.error('Error al realizar la búsqueda');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);

        if (selectedProviders.length === 0 && !selectedCompany) return;

        try {
            setLoadingInvoices(true);

            // Obtener los IDs de los proveedores seleccionados
            const providerIdsParam = selectedProviders.join(',');

            // Calcular fechas de inicio y fin del mes seleccionado
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

            const response = await getInvoicesByProviderAndCompany({
                providerIds: providerIdsParam,
                companyId: selectedCompany,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                page,
                limit: 15,
                sortBy: 'fechaEmision',
                order: 'desc'
            });

            if (response) {
                setInvoices(response);
                setPagination(pagination);
                // Los paquetes ya están cargados, no necesitamos recargarlos
            }
        } catch (error) {
            console.error('Error al cambiar página:', error);
            toast.error('Error al cambiar de página');
        } finally {
            setLoadingInvoices(false);
        }
    };


    const getEstatusText = (estatus: number) => {
        return estatus === 1
            ? { text: 'Vigente', variant: 'success' }
            : { text: 'Cancelado', variant: 'danger' };
    };

    // Efecto para limpiar pagos temporales de facturas ya guardadas en paquetes
    useEffect(() => {
        if (existingPackages.length > 0) {
            // Obtener IDs de facturas que ya están guardadas en paquetes (cualquier pago, completo o parcial)
            const facturasEnPaquetes = existingPackages.flatMap(pkg =>
                pkg.facturas.map((f: any) => f._id)
            );

            // Limpiar pagos temporales de facturas que ya están en paquetes
            setTempPayments(prev => {
                const newTempPayments = { ...prev };
                let cambios = false;

                Object.keys(newTempPayments).forEach(invoiceId => {
                    if (facturasEnPaquetes.includes(invoiceId)) {
                        delete newTempPayments[invoiceId];
                        cambios = true;
                    }
                });

                if (cambios) {
                    console.log('Pagos temporales limpiados para facturas ya guardadas en paquetes');
                }

                return newTempPayments;
            });
        }
    }, [existingPackages]);

    // Función para determinar el estado de pago y autorización de una factura
    const getFacturaEstado = (invoice: ImportedInvoice) => {
        const invoiceWithTempPayments = getInvoiceWithTempPayments(invoice);
        const isCompletamentePagada = invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar;

        // NUEVO: Verificar si la factura tiene un pago temporal pendiente
        const hasTempPayment = tempPayments[invoice._id];
        if (hasTempPayment) {
            return {
                tipo: 'seleccionada',
                etiqueta: 'Seleccionada',
                mostrarBotones: false,
                descripcion: 'Pago temporal registrado - Pendiente de envío',
                color: 'info'
            };
        }

        // Si tiene pago parcial (sin importar si es temporal o real)
        if (invoiceWithTempPayments.importePagado > 0 && invoiceWithTempPayments.importePagado < invoiceWithTempPayments.importeAPagar) {
            return {
                tipo: 'parcial',
                etiqueta: null,
                mostrarBotones: true,
                descripcion: 'Pago parcial - Puede continuar pagando'
            };
        }

        // Si está completamente pagada
        if (isCompletamentePagada) {
            // Si está en un paquete y pendiente de autorización
            if (invoice.estaRegistrada && invoice.autorizada === null) {
                return {
                    tipo: 'completa_pendiente',
                    etiqueta: 'Procesada',
                    mostrarBotones: false,
                    descripcion: 'Pago completo pendiente de autorización',
                    color: 'primary'
                };
            }

            // Si está en un paquete y autorizada
            if (invoice.estaRegistrada && invoice.autorizada === true) {
                return {
                    tipo: 'completa_autorizada',
                    etiqueta: 'Autorizada',
                    mostrarBotones: false,
                    descripcion: 'Pago completo autorizado',
                    color: 'success'
                };
            }

            // Si no está autorizada (rechazada)
            return {
                tipo: 'completa_rechazada',
                etiqueta: null,
                mostrarBotones: true,
                descripcion: 'Pago rechazado - Puede pagar nuevamente'
            };
        }

        // Si no tiene pagos
        return {
            tipo: 'sin_pago',
            etiqueta: null,
            mostrarBotones: true,
            descripcion: 'Sin pagos - Puede realizar pagos'
        };
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX');
    };

    const loadExistingPackages = async () => {
        if (!user?._id) return [];
        try {
            // Usar el nuevo servicio que solo obtiene paquetes creados por el usuario
            const paquetes = await getInvoicesPackagesCreatedByUsuario(user._id);
            setExistingPackages(Array.isArray(paquetes?.data) ? paquetes.data : Array.isArray(paquetes) ? paquetes : []);
            return Array.isArray(paquetes?.data) ? paquetes.data : Array.isArray(paquetes) ? paquetes : [];
        } catch {
            setExistingPackages([]);
            return [];
        }
    };

    // IDs de facturas ya guardadas en paquetes del usuario
    const facturasGuardadas = React.useMemo(() => {
        // Considerar como "guardadas" las facturas que están completamente pagadas
        // Las facturas con pago parcial pueden ser registradas nuevamente
        // IMPORTANTE: Excluir facturas rechazadas usando el estado actual de la factura principal
        return Array.isArray(existingPackages)
            ? existingPackages.flatMap(pkg =>
                pkg.facturas
                    .filter((f: any) => {
                        // Buscar la factura actual en la lista principal para verificar su estado real
                        const facturaActual = invoices.find(inv => inv._id === f._id);

                        // Si la factura actual está rechazada, no considerarla como guardada
                        if (facturaActual && (facturaActual.autorizada === false || facturaActual.pagoRechazado === true)) {
                            return false;
                        }

                        // Solo considerar guardadas las facturas completamente pagadas
                        return f.importePagado >= f.importeAPagar;
                    })
                    .map((f: any) => f._id)
            )
            : [];
    }, [existingPackages, invoices]);

    // Facturas pagadas disponibles para guardar en paquetes
    const facturasDisponibles = React.useMemo(() => {
        return invoices.filter(f => {
            const hasTempPayment = tempPayments[f._id];
            const invoiceWithTempPayments = getInvoiceWithTempPayments(f);

            // Permitir facturas rechazadas aunque tengan estaRegistrada: true
            const esRechazada = f.autorizada === false || f.pagoRechazado === true;

            // Una factura registrada con pago completo NO está disponible
            if (f.estaRegistrada && invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar && !esRechazada) {
                return false; // Factura completamente pagada y registrada = NO disponible
            }

            // Una factura está disponible si:
            // 1. Es rechazada (puede seleccionarse de nuevo)
            // 2. O tiene pagos temporales (seleccionada explícitamente por el usuario)
            // 3. Para paquetes existentes: O tiene pagos reales pero NO está completamente pagada
            // 4. Y NO está en la lista de facturas completamente pagadas en paquetes existentes
            const noEstaGuardada = !facturasGuardadas.includes(f._id);

            // Para facturas rechazadas, siempre disponibles
            if (esRechazada && noEstaGuardada) {
                return true;
            }

            // Para facturas con pagos temporales, siempre disponibles (seleccionadas por el usuario)
            if (hasTempPayment && noEstaGuardada) {
                return true;
            }

            // Para facturas con pagos reales de otros paquetes, solo disponibles si:
            // - Están parcialmente pagadas Y no están completamente pagadas
            // - Y no están guardadas en paquetes existentes
            const tienePagosReales = invoiceWithTempPayments.importePagado > 0 && !hasTempPayment;
            const noEstaCompletamentePagada = invoiceWithTempPayments.importePagado < invoiceWithTempPayments.importeAPagar;

            if (tienePagosReales && noEstaCompletamentePagada && noEstaGuardada) {
                // Esta factura tiene pagos parciales de otros paquetes
                // Solo estará disponible para paquetes existentes, no para nuevos
                return true;
            }

            return false;
        });
    }, [invoices, facturasGuardadas, tempPayments]);

    // Facturas con pagos disponibles para nuevos paquetes
    const facturasConPagosNoGuardadas = React.useMemo(() => {
        return invoices.filter(f => {
            const hasTempPayment = tempPayments[f._id];
            const invoiceWithTempPayments = getInvoiceWithTempPayments(f);

            // Permitir facturas rechazadas aunque tengan estaRegistrada: true
            const esRechazada = f.autorizada === false || f.pagoRechazado === true;

            // Una factura registrada con pago completo NO está disponible
            if (f.estaRegistrada && invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar && !esRechazada) {
                return false; // Factura completamente pagada y registrada = NO disponible
            }

            const noEstaGuardada = !facturasGuardadas.includes(f._id);

            // Para conteo de nuevos paquetes, solo considerar:
            // 1. Facturas rechazadas (pueden volver a ser pagadas)
            // 2. Facturas con pagos temporales (seleccionadas por el usuario)
            if (isNewPackage) {
                return (esRechazada || hasTempPayment) && noEstaGuardada;
            } else {
                // Para paquetes existentes, usar la misma lógica que facturasDisponibles
                if (esRechazada && noEstaGuardada) return true;
                if (hasTempPayment && noEstaGuardada) return true;

                const tienePagosReales = invoiceWithTempPayments.importePagado > 0 && !hasTempPayment;
                const noEstaCompletamentePagada = invoiceWithTempPayments.importePagado < invoiceWithTempPayments.importeAPagar;

                return tienePagosReales && noEstaCompletamentePagada && noEstaGuardada;
            }
        });
    }, [invoices, facturasGuardadas, tempPayments, isNewPackage]);

    // Facturas guardadas en el paquete seleccionado (solo si hay paquete existente)
    let facturasGuardadasEnPaquete: any[] = [];
    if (!isNewPackage && selectedPackageId) {
        const paquete = existingPackages.find(p => p._id === selectedPackageId);
        if (paquete) {
            facturasGuardadasEnPaquete = paquete.facturas.filter(
                (f: any) => f.importePagado > 0
            );
        }
    }

    const contadorFacturas = isNewPackage
        ? facturasConPagosNoGuardadas.length
        : facturasConPagosNoGuardadas.length + facturasGuardadasEnPaquete.length;

    function marcarFacturasGuardadas(facturasDisponibles: any[], paqueteExistente: any) {
        const idsCompletamentePagadas = paqueteExistente
            ? paqueteExistente.facturas
                .filter((f: any) => f.importePagado >= f.importeAPagar)
                .map((f: any) => f._id)
            : [];

        const idsConPagosParciales = paqueteExistente
            ? paqueteExistente.facturas
                .filter((f: any) => f.importePagado > 0 && f.importePagado < f.importeAPagar)
                .map((f: any) => f._id)
            : [];

        const todas = [...facturasDisponibles, ...(paqueteExistente ? paqueteExistente.facturas : [])];
        const unicas = Array.from(new Map(todas.map(f => [f._id, f])).values());
        return unicas.map(f => ({
            ...f,
            yaGuardada: idsCompletamentePagadas.includes(f._id),
            tienePagoParcial: idsConPagosParciales.includes(f._id)
        }));
    }

    return (
        <Container fluid className="mt-4">
            <BudgetSummaryCards
                tempPayments={tempPayments}
                invoices={invoices}
                budgetData={budgetData}
                existingPackages={existingPackages}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
            />

            {/* Filtros de año, mes y proveedor */}
            <Card className="mt-4 border-0 shadow-sm">
                <Card.Body>
                    {/* Fila de año y mes */}
                    <Row className="mb-3">
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Año:</Form.Label>
                                <Form.Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={10}>
                            <Form.Group>
                                <Form.Label>Mes:</Form.Label>
                                <div className="d-flex gap-1 flex-wrap">
                                    {months.map((mes: string, idx: number) => (
                                        <Button
                                            key={mes}
                                            size="sm"
                                            variant={selectedMonth === idx ? 'primary' : 'outline-secondary'}
                                            className="mb-1"
                                            onClick={() => setSelectedMonth(idx)}
                                        >
                                            {mes}
                                        </Button>
                                    ))}
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Fila de selects en cascada: Razón Social, Marca, Sucursal */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Razón Social:</Form.Label>
                                <Form.Select
                                    value={selectedCompany}
                                    onChange={handleCompanyChange}
                                >
                                    <option value="">Selecciona una razón social...</option>
                                    {companies.map((company) => (
                                        <option
                                            key={company._id}
                                            value={company._id}
                                        >
                                            {company.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Marca:</Form.Label>
                                <Form.Select
                                    value={selectedBrand}
                                    onChange={handleBrandChange}
                                    disabled={!selectedCompany}
                                >
                                    <option value="">
                                        Selecciona una marca...
                                    </option>
                                    {brands.map((brand) => (
                                        <option
                                            key={brand._id}
                                            value={brand._id}
                                        >
                                            {brand.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Sucursal:</Form.Label>
                                <Form.Select
                                    value={selectedBranch}
                                    onChange={handleBranchChange}
                                    disabled={!selectedBrand}
                                >
                                    <option value="">
                                        Selecciona una sucursal...
                                    </option>
                                    {branches.map((branch) => (
                                        <option
                                            key={branch._id}
                                            value={branch._id}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Fila de proveedores y buscar */}
                    <Row className="align-items-end">
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Proveedores</Form.Label>
                                <MultiSelect
                                    value={selectedProviders}
                                    options={userProviders.map((userProvider) => ({
                                        value: userProvider.providerId._id,
                                        label: `${userProvider.providerId.commercialName} - ${userProvider.providerId.businessName}`,
                                    }))}
                                    onChange={setSelectedProviders}
                                    placeholder="Selecciona uno o más proveedores..."
                                    isSearchable
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="primary"
                                    onClick={handleSearch}
                                >
                                    <i className="bi bi-search me-2"></i>Buscar
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={() => setShowCashPaymentModal(true)}
                                >
                                    <i className="bi bi-cash me-2"></i>Pagar en efectivo
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Sección de configuración del paquete de facturas */}
            <Card className="mt-4 border-0 shadow-sm">
                <Card.Header className="bg-primary text-white border-0">
                    <Card.Title className="mb-0 fw-bold">Configuración del Paquete de Facturas</Card.Title>
                </Card.Header>
                <Card.Body>
                    {/* Indicador de filtros activos */}
                    <div className="mb-3 p-3 bg-light rounded">
                        <h6 className="mb-2 fw-bold text-primary">
                            <i className="bi bi-funnel me-2"></i>Filtros Activos:
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                            <span className="badge bg-info">
                                <i className="bi bi-calendar me-1"></i>
                                {months[selectedMonth]} {selectedYear}
                            </span>
                            {selectedCompany && (
                                <span className="badge bg-success">
                                    <i className="bi bi-building me-1"></i>
                                    {companies.find(c => c._id === selectedCompany)?.name}
                                </span>
                            )}
                            {selectedProviders.length > 0 && (
                                <span className="badge bg-warning">
                                    <i className="bi bi-people me-1"></i>
                                    {selectedProviders.length} proveedor{selectedProviders.length > 1 ? 'es' : ''} seleccionado{selectedProviders.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {Object.keys(tempPayments).length === 0 ? (
                        <div className="text-center py-4">
                            <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
                            <h6 className="text-muted mb-2">No hay pagos registrados</h6>
                            <p className="text-muted small mb-0">
                                Registra al menos un pago de factura para poder crear o actualizar paquetes
                            </p>
                        </div>
                    ) : (
                        <>
                            <h6 className="mb-3 fw-bold text-primary">
                                Selecciona el tipo de operación:
                            </h6>

                            <Row className="mb-4">
                                <Col md={3}>
                                    <Card
                                        className={`h-100 ${isNewPackage ? 'border-success bg-light' : 'border-secondary'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setIsNewPackage(true)}
                                    >
                                        <Card.Body className="text-center py-2">
                                            <div className="mb-2">
                                                <i className="bi bi-plus-circle display-6 text-success"></i>
                                            </div>
                                            <Card.Title className="h6 text-success">Nuevo Paquete</Card.Title>
                                            <Card.Text className="text-muted small">
                                                Crear un paquete desde cero
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card
                                        className={`h-100 ${!isNewPackage ? 'border-secondary bg-light' : 'border-light'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setIsNewPackage(false)}
                                    >
                                        <Card.Body className="text-center py-2">
                                            <div className="mb-2">
                                                <i className="bi bi-layers display-6 text-secondary"></i>
                                            </div>
                                            <Card.Title className="h6 text-secondary">Paquete Existente</Card.Title>
                                            <Card.Text className="text-muted small">
                                                Agregar a un paquete existente en borrador
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {!isNewPackage && (
                                    <Col md={3} className="d-flex align-items-end gap-2">
                                        <Form.Group className="flex-grow-1">
                                            <Form.Label>Selecciona un paquete:</Form.Label>
                                            <Form.Select
                                                value={selectedPackageId}
                                                onChange={e => setSelectedPackageId(e.target.value)}
                                            >
                                                <option value="">Selecciona un paquete...</option>
                                                {existingPackages.map(pkg => (
                                                    <option key={pkg._id} value={pkg._id}>
                                                        {pkg.comentario || `Folio ${pkg.folio}`} (Folio: {pkg.folio})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        {/* Botón para ver detalle del paquete seleccionado */}
                                        <Button
                                            variant="outline-primary"
                                            className="mb-2"
                                            disabled={!selectedPackageId}
                                            onClick={() => {
                                                if (selectedPackageId) {
                                                    router.push(`/modulos/paquetes-facturas/detalle-paquete?packpageId=${selectedPackageId}`);
                                                }
                                            }}
                                            title="Ver detalle del paquete"
                                        >
                                            <i className="bi bi-eye me-2"></i>
                                            Ver detalle
                                        </Button>
                                    </Col>
                                )}
                            </Row>

                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="outline-secondary" size="sm">
                                    <i className="bi bi-eye me-2"></i>Mostrar UUID
                                </Button>
                                {Object.keys(tempPayments).length > 0 && (
                                    <Button variant="warning" size="sm">
                                        <i className="bi bi-clock me-2"></i>
                                        Pagos Temporales: {Object.keys(tempPayments).length}
                                    </Button>
                                )}
                                {Object.keys(tempPayments).length > 0 && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => {
                                            setTempPayments({});
                                            toast.info('Pagos temporales eliminados');
                                        }}
                                    >
                                        <i className="bi bi-trash me-2"></i>
                                        Limpiar
                                    </Button>
                                )}
                                <Button
                                    variant="primary"
                                    disabled={facturasConPagosNoGuardadas.length === 0 && !(selectedPackageId && !isNewPackage)}
                                    onClick={() => {
                                        if (facturasConPagosNoGuardadas.length === 0 && !(selectedPackageId && !isNewPackage)) {
                                            if (isNewPackage) {
                                                toast.warn('No hay facturas seleccionadas para el nuevo paquete. Registra pagos temporales o selecciona facturas rechazadas.');
                                            } else {
                                                toast.warn('No hay facturas con pagos disponibles para guardar en paquete.');
                                            }
                                            return;
                                        }

                                        let paqueteExistenteSeleccionado = null;
                                        let facturasParaEnviar = facturasDisponibles;

                                        if (!isNewPackage && selectedPackageId) {
                                            paqueteExistenteSeleccionado = existingPackages.find(p => p._id === selectedPackageId);

                                            // Obtener IDs de facturas completamente pagadas que ya están en el paquete existente
                                            const idsCompletamentePagadasEnPaquete = paqueteExistenteSeleccionado
                                                ? paqueteExistenteSeleccionado.facturas
                                                    .filter((f: any) => f.importePagado >= f.importeAPagar)
                                                    .map((f: any) => f._id)
                                                : [];

                                            // Filtrar facturas: solo excluir las completamente pagadas en el paquete existente
                                            // Las facturas con pago parcial pueden ser registradas nuevamente
                                            const facturasDisponiblesParaPaquete = facturasDisponibles.filter(f => !idsCompletamentePagadasEnPaquete.includes(f._id));

                                            // Incluir facturas con pagos (completos o parciales) que no están completamente pagadas en el paquete
                                            const facturasConPagos = facturasDisponiblesParaPaquete.filter(f => {
                                                const invoiceWithTempPayments = getInvoiceWithTempPayments(f);
                                                return invoiceWithTempPayments.importePagado > 0;
                                            });

                                            if (facturasConPagos.length === 0) {
                                                toast.warn('No hay facturas disponibles para agregar al paquete existente. Selecciona facturas con pagos temporales o parciales.');
                                                return;
                                            }

                                            facturasParaEnviar = marcarFacturasGuardadas(facturasConPagos, paqueteExistenteSeleccionado);
                                        } else {
                                            // Para nuevo paquete: SOLO incluir facturas con pagos temporales o rechazadas
                                            // NO incluir facturas con pagos parciales de otros paquetes sin seleccionar
                                            facturasParaEnviar = facturasDisponibles.filter(f => {
                                                const hasTempPayment = tempPayments[f._id];
                                                const esRechazada = f.autorizada === false || f.pagoRechazado === true;

                                                // Para nuevo paquete, solo permitir:
                                                // 1. Facturas con pagos temporales (seleccionadas por el usuario)
                                                // 2. Facturas rechazadas (pueden volver a ser pagadas)
                                                return hasTempPayment || esRechazada;
                                            });
                                        }
                                        setFacturasProcesadas(facturasParaEnviar);
                                        setPaqueteExistenteSeleccionado(paqueteExistenteSeleccionado);
                                        setShowEnviarPagoModal(true);
                                    }}
                                >
                                    <i className="bi bi-send me-2"></i>
                                    {(!isNewPackage && selectedPackageId) ? 'Actualizar Paquete' : 'Enviar a Pago'}
                                    {facturasConPagosNoGuardadas.length > 0 && (
                                        <span className="badge bg-light text-primary ms-2">
                                            {contadorFacturas}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Lista de Facturas */}
            <Card className="mt-4 border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                    <Card.Title className="mb-0 fw-bold">Lista de Facturas</Card.Title>
                    {combinedSummary && (
                        <div className="mt-2">
                            <small className="text-muted">
                                Total: {combinedSummary.totalFacturas} facturas |
                                Importe: {formatCurrency(combinedSummary.totalImporteAPagar)} |
                                Pagado: {formatCurrency(combinedSummary.totalPagado)} |
                                Saldo: {formatCurrency(combinedSummary.totalSaldo)}
                                {Object.keys(tempPayments).length > 0 && (
                                    <span className="text-warning ms-2">
                                        <i className="bi bi-clock me-1"></i>
                                        Incluye {Object.keys(tempPayments).length} pago{Object.keys(tempPayments).length > 1 ? 's' : ''} temporal{Object.keys(tempPayments).length > 1 ? 'es' : ''}
                                    </span>
                                )}
                            </small>
                        </div>
                    )}
                </Card.Header>
                <Card.Body className="p-0">
                    {loadingInvoices ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </Spinner>
                            <p className="mt-2 text-muted">Cargando facturas...</p>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-file-earmark-text display-4 text-muted"></i>
                            <p className="mt-2 text-muted">No se encontraron facturas</p>
                            <small className="text-muted">
                                {!selectedProviders.length && !selectedCompany
                                    ? 'Selecciona al menos un proveedor o una razón social para buscar facturas'
                                    : `No hay facturas que coincidan con los filtros seleccionados para ${months[selectedMonth]} ${selectedYear}`
                                }
                            </small>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>#</th>
                                    <th>Seleccionar para pago</th>
                                    <th>UUID</th>
                                    <th>Proveedor</th>
                                    <th>F. Emisión</th>
                                    <th>Info</th>
                                    <th>Emisor RFC</th>
                                    <th>Estatus</th>
                                    <th>Fecha Cancelación</th>
                                    <th>Total</th>
                                    <th>Importe Pagado</th>
                                    <th>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => {
                                    const invoiceWithTempPayments = getInvoiceWithTempPayments(invoice);
                                    const estatus = getEstatusText(invoice.estatus);
                                    const saldo = invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar ? 0 : (invoiceWithTempPayments.importeAPagar - invoiceWithTempPayments.importePagado);
                                    const facturaEstado = getFacturaEstado(invoice);
                                    const hasTempPayment = tempPayments[invoice._id];

                                    return (
                                        <tr key={invoice._id}>
                                            <td>{(currentPage - 1) * 15 + index + 1}</td>
                                            {/* Seleccionar para pago */}
                                            <td className="text-center">
                                                {facturaEstado.etiqueta ? (
                                                    <span className={`badge ${facturaEstado.color === 'primary'
                                                        ? 'bg-primary bg-opacity-10 text-primary'
                                                        : facturaEstado.color === 'success'
                                                            ? 'bg-success bg-opacity-10 text-success'
                                                            : facturaEstado.color === 'info'
                                                                ? 'bg-info bg-opacity-10 text-info'
                                                                : 'bg-warning bg-opacity-10 text-warning'
                                                        } fw-bold py-2 px-3`}>
                                                        <i className={`bi ${facturaEstado.tipo === 'completa_autorizada'
                                                            ? 'bi-check-circle'
                                                            : facturaEstado.tipo === 'seleccionada'
                                                                ? 'bi-hand-index'
                                                                : 'bi-clock'
                                                            } me-1`}></i>
                                                        {facturaEstado.etiqueta}
                                                    </span>
                                                ) : (
                                                    <div className="d-flex flex-column gap-1 w-100">
                                                        {facturaEstado.tipo === 'parcial' && (
                                                            <div className="mb-1">
                                                                <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">
                                                                    <i className="bi bi-clock me-1"></i>
                                                                    Pago Parcial: {Math.round((invoiceWithTempPayments.importePagado / invoiceWithTempPayments.importeAPagar) * 100)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                        {facturaEstado.mostrarBotones && (
                                                            <>
                                                                <div className="d-flex gap-1 w-100">
                                                                    <Button
                                                                        variant="light"
                                                                        className="d-flex align-items-center justify-content-center w-100 py-1 border-2 border-success text-success"
                                                                        onClick={() => { setTipoPagoModal('completo'); setSaldoModal(saldo); setSelectedInvoiceId(invoice._id); setShowPagoModal(true); }}
                                                                    >
                                                                        <i className="bi bi-check2 text-success me-1"></i>
                                                                        <span className="text-success fw-bold">Completa</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="light"
                                                                        className="d-flex align-items-center justify-content-center w-100 py-1 border-2 border-warning text-warning"
                                                                        onClick={() => { setTipoPagoModal('parcial'); setSaldoModal(saldo); setSelectedInvoiceId(invoice._id); setShowPagoModal(true); }}
                                                                    >
                                                                        <i className="bi bi-dash text-warning me-1"></i>
                                                                        <span className="text-warning fw-bold">Parcial</span>
                                                                    </Button>
                                                                </div>
                                                                <Button
                                                                    variant="light"
                                                                    className="d-flex align-items-center justify-content-center w-100 py-1 border-2 border-info text-info"
                                                                    onClick={() => {
                                                                        setDescuentoSaldo(saldo);
                                                                        setDescuentoInvoiceId(invoice._id);
                                                                        setShowDescuentoModal(true);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-gem text-info me-1"></i>
                                                                    <span className="text-info fw-bold">Descuento</span>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            {/* UUID */}
                                            <td>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="d-flex align-items-center fw-bold text-white"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(invoice.uuid);
                                                        toast.success('UUID copiado al portapapeles');
                                                    }}
                                                >
                                                    <BsClipboard className="me-1" />
                                                    COPIAR
                                                </Button>
                                            </td>
                                            {/* Proveedor */}
                                            <td>
                                                <div>
                                                    <strong>{invoice.nombreEmisor}</strong>
                                                    <br />
                                                    <small className="text-muted">
                                                        {invoice.rfcEmisor}
                                                    </small>
                                                </div>
                                            </td>
                                            {/* Fecha Emisión */}
                                            <td>{formatDate(invoice.fechaEmision)}</td>
                                            {/* Info */}
                                            <td>
                                                <span className="badge fs-6 bg-warning bg-opacity-10 text-warning">PPD</span>
                                            </td>
                                            {/* Emisor RFC */}
                                            <td>{invoice.rfcEmisor}</td>
                                            {/* Estatus */}
                                            <td>
                                                <span className={`badge fs-6 ${estatus.text === 'Vigente' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>{estatus.text}</span>
                                            </td>
                                            {/* Fecha Cancelación */}
                                            <td>
                                                {invoice.fechaCancelacion ? formatDate(invoice.fechaCancelacion) : ''}
                                            </td>
                                            {/* Total a Pagar */}
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className={`fw-bold ${invoiceWithTempPayments.importeAPagar > 0 ? 'text-success' : 'text-muted'}`}>
                                                        {formatCurrency(invoiceWithTempPayments.importeAPagar)}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Importe Pagado */}
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className={`fw-bold ${invoiceWithTempPayments.importePagado > 0 ? 'text-success' : 'text-muted'}`}>
                                                        {formatCurrency(invoiceWithTempPayments.importePagado)}
                                                    </span>
                                                    {invoiceWithTempPayments.importePagado > 0 && (
                                                        <small className="text-muted">
                                                            {Math.round((invoiceWithTempPayments.importePagado / invoiceWithTempPayments.importeAPagar) * 100)}% pagado
                                                        </small>
                                                    )}
                                                    {hasTempPayment && (
                                                        <small className="text-warning">
                                                            <i className="bi bi-clock me-1"></i>
                                                            Temporal
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Saldo */}
                                            <td>
                                                <span className={saldo > 0 ? 'text-warning' : 'text-success'}>
                                                    {formatCurrency(saldo)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>

                {/* Paginación */}
                {pagination.total > 0 && (
                    <Card.Footer className="bg-white border-top">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">
                                Mostrando {((currentPage - 1) * pagination.limit) + 1} a {Math.min(currentPage * pagination.limit, pagination.total)} de {pagination.total} registros
                            </span>
                            <ButtonGroup size="sm">
                                <Button
                                    variant="outline-secondary"
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    <i className="bi bi-chevron-left"></i> Anterior
                                </Button>

                                {/* Mostrar páginas */}
                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(pagination.pages - 4, currentPage - 2)) + i;
                                    if (pageNum > pagination.pages) return null;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === currentPage ? 'primary' : 'outline-secondary'}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}

                                <Button
                                    variant="outline-secondary"
                                    disabled={currentPage === pagination.pages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    Siguiente <i className="bi bi-chevron-right"></i>
                                </Button>
                            </ButtonGroup>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            <PagoFacturaModal
                show={showPagoModal}
                onClose={() => setShowPagoModal(false)}
                tipoPago={tipoPagoModal}
                saldo={saldoModal}
                invoiceId={selectedInvoiceId}
                onSuccess={handleTempPayment}
            />

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
                    completamentePagada: f.importePagado >= f.importeAPagar
                }))}
                paqueteExistente={paqueteExistenteSeleccionado}
                razonSocialName={companies.find(c => c._id === selectedCompany)?.name || ''}
                isNewPackage={isNewPackage}
                selectedCompanyId={selectedCompany}
                selectedBrandId={selectedBrand}
                selectedBranchId={selectedBranch}
                tempPayments={tempPayments}
                onRemoveTempPayment={handleRemoveTempPayment}
                onSuccess={async () => {
                    setShowEnviarPagoModal(false);
                    // Limpiar pagos temporales después del envío exitoso
                    setTempPayments({});
                    const paquetes = await loadExistingPackages();
                    if (paquetes && paquetes.length > 0) {
                        // Ordena por fecha de creación descendente
                        const sorted = paquetes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const newest = sorted[0];
                        setCreatedPackpageId(newest._id);
                        setShowCreatedPackpageModal(true);
                    }
                }}
                onCancel={() => {
                    // Cuando se cancela el modal, los pagos temporales deben permanecer
                    // para que el usuario pueda volver a intentar enviar el paquete
                    setShowEnviarPagoModal(false);
                }}
            />

            <DescuentoFacturaModal
                show={showDescuentoModal}
                onClose={() => setShowDescuentoModal(false)}
                saldo={descuentoSaldo}
                invoiceId={descuentoInvoiceId}
                onSuccess={() => {
                    setShowDescuentoModal(false);
                    handleSearch();
                }}
            />

            <CreatedPackpageModal
                show={showCreatedPackpageModal}
                onClose={() => setShowCreatedPackpageModal(false)}
                onViewCreated={() => {
                    if (createdPackpageId) {
                        setShowCreatedPackpageModal(false);
                        router.push(`/modulos/paquetes-facturas/detalle-paquete?packpageId=${createdPackpageId}`);
                    }
                }}
                onViewList={() => {
                    setShowCreatedPackpageModal(false);
                    router.push('/modulos/paquetes-facturas/listado-paquetes');
                }}
            />

            <CashPaymentModal
                show={showCashPaymentModal}
                onHide={() => setShowCashPaymentModal(false)}
                onSuccess={() => {
                    setShowCashPaymentModal(false);
                    setShowCashPaymentConfirmModal(true);
                }}
                departmentId={user?.departmentId || undefined}
            />

            {/* Modal de confirmación de pago en efectivo */}
            <Modal show={showCashPaymentConfirmModal} onHide={() => setShowCashPaymentConfirmModal(false)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Pago creado exitosamente
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <i className="bi bi-cash-coin display-4 text-success mb-3"></i>
                    <h6>Nuevo pago en efectivo creado</h6>
                    <p className="text-muted mb-4">¿Qué deseas hacer ahora?</p>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button
                        variant="primary"
                        onClick={() => {
                            setShowCashPaymentConfirmModal(false);
                            router.push('/modulos/paquetes-facturas/listado-paquetes');
                        }}
                    >
                        <i className="bi bi-list-ul me-2"></i>
                        Ir al listado de paquetes
                    </Button>
                    <Button
                        variant="outline-primary"
                        onClick={() => {
                            setShowCashPaymentConfirmModal(false);
                            router.push('/modulos/pagos-efectivo');
                        }}
                    >
                        <i className="bi bi-cash me-2"></i>
                        Ver pagos en efectivo
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default InvoicesPackagePage;

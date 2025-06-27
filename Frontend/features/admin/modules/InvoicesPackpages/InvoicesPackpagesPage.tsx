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
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import BudgetSummaryCards from './components/BudgetSummaryCards';
import {
    userProvidersService,
    companiesService,
    brandsService,
    branchesService,
    getInvoicesByProviderAndCompany,
    getInvoicesSummaryByProviderAndCompany,
    ImportedInvoice,
    InvoicesSummaryResponse,
    getInvoicesPackagesByUsuario
} from './services';
import { UserProvider, Company, Brand, Branch } from './types';
import PagoFacturaModal from './components/PagoFacturaModal';
import EnviarPagoModal from './components/EnviarPagoModal';
import { useUserSessionStore } from '@/stores/userSessionStore';
import CreatedPackpageModal from './components/CreatedPackpageModal';
import { useRouter } from 'next/navigation';
import DescuentoFacturaModal from './components/DescuentoFacturaModal';

const InvoicesPackagePage: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [isNewPackage, setIsNewPackage] = useState(true);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [userProviders, setUserProviders] = useState<UserProvider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('');

    // Estados para los selects en cascada
    const [companies, setCompanies] = useState<Company[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    // Estados de carga
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

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

    // Estado local para pagos temporales
    const [tempPayments, setTempPayments] = useState<{
        [invoiceId: string]: {
            tipoPago: 'completo' | 'parcial';
            descripcion: string;
            monto?: number;
            originalImportePagado: number;
            originalSaldo: number;
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
        loadCompanies();
    }, []);

    // Cargar marcas cuando se selecciona una compañía
    useEffect(() => {
        if (selectedCompany) {
            loadBrandsByCompany(selectedCompany);
        } else {
            setBrands([]);
            setSelectedBrand('');
        }
    }, [selectedCompany]);

    // Cargar sucursales cuando se selecciona una marca
    useEffect(() => {
        if (selectedBrand) {
            loadBranchesByBrand(selectedBrand);
        } else {
            setBranches([]);
            setSelectedBranch('');
        }
    }, [selectedBrand]);

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

    const loadCompanies = async () => {
        try {
            const response = await companiesService.getAllCompanies();
            setCompanies(response.data || []);
        } catch (err) {
            console.error('Error cargando razones sociales:', err);
            toast.error('Error al cargar las razones sociales');
        }
    };

    const loadBrandsByCompany = async (companyId: string) => {
        try {
            setLoadingBrands(true);
            const response = await brandsService.getBrandsByCompany(companyId);
            setBrands(response.data || []);
        } catch (err) {
            console.error('Error cargando marcas:', err);
            setBrands([]);
            toast.error('Error al cargar las marcas');
        } finally {
            setLoadingBrands(false);
        }
    };

    const loadBranchesByBrand = async (brandId: string) => {
        try {
            setLoadingBranches(true);
            const response = await branchesService.getBranchesByBrand(brandId);
            setBranches(response.data || []);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
            setBranches([]);
            toast.error('Error al cargar las sucursales');
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleProviderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvider(event.target.value);
    };

    const handleCompanyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCompany(event.target.value);
        setSelectedBrand('');
        setSelectedBranch('');
    };

    const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBrand(event.target.value);
        setSelectedBranch('');
    };

    const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBranch(event.target.value);
    };

    // Funciones para manejar pagos temporales
    const handleTempPayment = (invoiceId: string, tipoPago: 'completo' | 'parcial', descripcion: string, monto?: number) => {
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
                originalSaldo
            }
        }));

        toast.success(tipoPago === 'completo' ? 'Pago completo registrado temporalmente' : 'Pago parcial registrado temporalmente');
    };

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
        if (!selectedProvider && !selectedCompany) {
            toast.warn('Selecciona al menos un proveedor o una razón social para buscar');
            return;
        }

        try {
            setLoadingInvoices(true);

            // Obtener RFC del proveedor seleccionado
            const selectedUserProvider = userProviders.find(up => up.providerId._id === selectedProvider);
            const rfcProvider = selectedUserProvider?.providerId.rfc;

            // Obtener RFC de la empresa seleccionada
            const selectedCompanyData = companies.find(c => c._id === selectedCompany);
            const rfcCompany = selectedCompanyData?.rfc;

            // Buscar facturas y paquetes existentes al mismo tiempo
            const [invoicesResponse, summaryResponse, packagesResponse] = await Promise.all([
                getInvoicesByProviderAndCompany({
                    rfcProvider,
                    rfcCompany,
                    page: currentPage,
                    limit: 15,
                    sortBy: 'fechaEmision',
                    order: 'desc'
                }),
                getInvoicesSummaryByProviderAndCompany({
                    rfcProvider,
                    rfcCompany
                }),
                user?._id ? getInvoicesPackagesByUsuario(user._id) : Promise.resolve([])
            ]);

            console.log('invoicesResponse:', invoicesResponse);
            console.log('summaryResponse:', summaryResponse);
            console.log('packagesResponse:', packagesResponse);


            if (invoicesResponse) {
                setInvoices(invoicesResponse);
                setPagination(pagination);
            } else {
                toast.error('Error al cargar las facturas');
            }

            if (summaryResponse) {
                setInvoicesSummary(summaryResponse);
            } else {
                toast.error('Error al cargar el resumen');
            }

            // Actualizar paquetes existentes
            if (packagesResponse) {
                setExistingPackages(packagesResponse);
            }

        } catch (error) {
            console.error('Error en la búsqueda:', error);
            toast.error('Error al realizar la búsqueda');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);

        if (!selectedProvider && !selectedCompany) return;

        try {
            setLoadingInvoices(true);

            const selectedUserProvider = userProviders.find(up => up.providerId._id === selectedProvider);
            const rfcProvider = selectedUserProvider?.providerId.rfc;

            const selectedCompanyData = companies.find(c => c._id === selectedCompany);
            const rfcCompany = selectedCompanyData?.rfc;

            const response = await getInvoicesByProviderAndCompany({
                rfcProvider,
                rfcCompany,
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
            const paquetes = await getInvoicesPackagesByUsuario(user._id);
            setExistingPackages(paquetes || []);
            return paquetes || [];
        } catch {
            setExistingPackages([]);
            return [];
        }
    };

    // IDs de facturas ya guardadas en paquetes del usuario
    const facturasGuardadas = React.useMemo(() => {
        return existingPackages.flatMap(pkg => pkg.facturas.map((f: any) => f._id));
    }, [existingPackages]);

    // Facturas pagadas disponibles para guardar en paquetes
    const facturasDisponibles = React.useMemo(() => {
        return invoices.filter(f => {
            const invoiceWithTempPayments = getInvoiceWithTempPayments(f);
            return invoiceWithTempPayments.importePagado > 0 && !facturasGuardadas.includes(f._id);
        });
    }, [invoices, facturasGuardadas, tempPayments]);

    // Facturas pagadas completamente y no guardadas
    const facturasPagadasNoGuardadas = React.useMemo(() => {
        return invoices.filter(f => {
            const invoiceWithTempPayments = getInvoiceWithTempPayments(f);
            return invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar && !facturasGuardadas.includes(f._id);
        });
    }, [invoices, facturasGuardadas, tempPayments]);

    // Facturas guardadas en el paquete seleccionado (solo si hay paquete existente)
    let facturasGuardadasEnPaquete: any[] = [];
    if (!isNewPackage && selectedPackageId) {
        const paquete = existingPackages.find(p => p._id === selectedPackageId);
        if (paquete) {
            facturasGuardadasEnPaquete = paquete.facturas.filter(
                (f: any) => f.importePagado >= f.importeAPagar
            );
        }
    }

    const contadorFacturas = isNewPackage
        ? facturasPagadasNoGuardadas.length
        : facturasPagadasNoGuardadas.length + facturasGuardadasEnPaquete.length;

    function marcarFacturasGuardadas(facturasDisponibles: any[], paqueteExistente: any) {
        const idsGuardadas = paqueteExistente
            ? paqueteExistente.facturas.map((f: any) => f._id)
            : [];
        const todas = [...facturasDisponibles, ...(paqueteExistente ? paqueteExistente.facturas : [])];
        const unicas = Array.from(new Map(todas.map(f => [f._id, f])).values());
        return unicas.map(f => ({
            ...f,
            yaGuardada: idsGuardadas.includes(f._id)
        }));
    }

    return (
        <Container fluid className="mt-4">
            <BudgetSummaryCards summary={invoicesSummary ?? undefined} />

            {/* Filtros de año, mes y proveedor */}
            <Card className="mt-4 border-0 shadow-sm">
                <Card.Body>
                    {/* Fila de año y mes */}
                    <Row className="mb-3">
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Año:</Form.Label>
                                <Form.Select>
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
                                    disabled={!selectedCompany || loadingBrands}
                                >
                                    <option value="">
                                        {loadingBrands ? 'Cargando marcas...' : 'Selecciona una marca...'}
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
                                    disabled={!selectedBrand || loadingBranches}
                                >
                                    <option value="">
                                        {loadingBranches ? 'Cargando sucursales...' : 'Selecciona una sucursal...'}
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
                                <Form.Select
                                    value={selectedProvider}
                                    onChange={handleProviderChange}
                                >
                                    <option value="">Selecciona un proveedor...</option>
                                    {userProviders.map((userProvider) => (
                                        <option
                                            key={userProvider.providerId._id}
                                            value={userProvider.providerId._id}
                                        >
                                            {userProvider.providerId.commercialName} - {userProvider.providerId.businessName}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Button
                                variant="primary"
                                onClick={handleSearch}
                            >
                                <i className="bi bi-search me-2"></i>Buscar
                            </Button>
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
                            <Col md={3}>
                                <Form.Group>
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
                            disabled={facturasDisponibles.length === 0 && !(selectedPackageId && !isNewPackage)}
                            onClick={() => {
                                if (facturasDisponibles.length === 0 && !(selectedPackageId && !isNewPackage)) {
                                    toast.warn('No hay facturas pagadas disponibles para guardar en paquete. Todas las facturas pagadas ya están guardadas o no hay facturas con pagos.');
                                    return;
                                }

                                let paqueteExistenteSeleccionado = null;
                                let facturasParaEnviar = facturasDisponibles;

                                if (!isNewPackage && selectedPackageId) {
                                    paqueteExistenteSeleccionado = existingPackages.find(p => p._id === selectedPackageId);
                                    // Solo incluir facturas pagadas completamente (considerando pagos temporales)
                                    const facturasPagadas = facturasDisponibles.filter(f => {
                                        const invoiceWithTempPayments = getInvoiceWithTempPayments(f);
                                        return invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar;
                                    });
                                    facturasParaEnviar = marcarFacturasGuardadas(facturasPagadas, paqueteExistenteSeleccionado);
                                } else {
                                    // Solo incluir facturas pagadas completamente (considerando pagos temporales)
                                    facturasParaEnviar = facturasDisponibles.filter(f => {
                                        const invoiceWithTempPayments = getInvoiceWithTempPayments(f);
                                        return invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar;
                                    });
                                }
                                setFacturasProcesadas(facturasParaEnviar);
                                setPaqueteExistenteSeleccionado(paqueteExistenteSeleccionado);
                                setShowEnviarPagoModal(true);
                            }}
                        >
                            <i className="bi bi-send me-2"></i>
                            {(!isNewPackage && selectedPackageId) ? 'Actualizar Paquete' : 'Enviar a Pago'}
                            {facturasDisponibles.length > 0 && (
                                <span className="badge bg-light text-primary ms-2">
                                    {contadorFacturas}
                                </span>
                            )}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Lista de Facturas */}
            <Card className="mt-4 border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                    <Card.Title className="mb-0 fw-bold">Lista de Facturas</Card.Title>
                    {invoicesSummary && (
                        <div className="mt-2">
                            <small className="text-muted">
                                Total: {invoicesSummary.totalFacturas} facturas |
                                Importe: {formatCurrency(invoicesSummary.totalImporteAPagar)} |
                                Pagado: {formatCurrency(invoicesSummary.totalPagado)} |
                                Saldo: {formatCurrency(invoicesSummary.totalSaldo)}
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
                                {!selectedProvider && !selectedCompany
                                    ? 'Selecciona un proveedor o razón social para buscar facturas'
                                    : 'No hay facturas que coincidan con los filtros seleccionados'
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
                                    <th>Importe Pagado</th>
                                    <th>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => {
                                    const invoiceWithTempPayments = getInvoiceWithTempPayments(invoice);
                                    const estatus = getEstatusText(invoice.estatus);
                                    const saldo = invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar ? 0 : (invoiceWithTempPayments.importeAPagar - invoiceWithTempPayments.importePagado);
                                    const isPagada = invoiceWithTempPayments.importePagado >= invoiceWithTempPayments.importeAPagar;
                                    const isGuardada = facturasGuardadas.includes(invoice._id);
                                    const hasTempPayment = tempPayments[invoice._id];
                                    
                                    return (
                                        <tr key={invoice._id}>
                                            <td>{(currentPage - 1) * 15 + index + 1}</td>
                                            {/* Seleccionar para pago */}
                                            <td className="text-center">
                                                {isGuardada ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success fw-bold py-2 px-3">Registrada</span>
                                                ) : isPagada ? (
                                                    <div className="d-flex flex-column gap-1">
                                                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold py-2 px-3">Pagada</span>
                                                        {hasTempPayment && (
                                                            <span className="badge bg-warning bg-opacity-10 text-warning fw-bold py-1 px-2">
                                                                <i className="bi bi-clock me-1"></i>
                                                                Temporal
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-1 w-100">
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
                                                    </div>
                                                )}
                                            </td>
                                            {/* UUID */}
                                            <td>
                                                <small className="font-monospace">
                                                    {invoice.uuid}
                                                </small>
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
                }))}
                paqueteExistente={paqueteExistenteSeleccionado}
                razonSocialName={companies.find(c => c._id === selectedCompany)?.name || ''}
                isNewPackage={isNewPackage}
                selectedCompanyId={selectedCompany}
                selectedBrandId={selectedBrand}
                selectedBranchId={selectedBranch}
                tempPayments={tempPayments}
                onSuccess={async () => {
                    setShowEnviarPagoModal(false);
                    // Limpiar pagos temporales después del envío exitoso
                    setTempPayments({});
                    const paquetes = await loadExistingPackages();
                    if (paquetes && paquetes.length > 0) {
                        // Ordena por fecha de creación descendente
                        const sorted = paquetes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const newest = sorted[0];
                        setCreatedPackpageId(newest._id);
                        setShowCreatedPackpageModal(true);
                    }
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
        </Container>
    );
};

export default InvoicesPackagePage;

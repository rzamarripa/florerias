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
  ButtonGroup
} from 'react-bootstrap';
import BudgetSummaryCards from './components/BudgetSummaryCards';
import { userProvidersService, companiesService, brandsService, branchesService } from './services';
import { UserProvider, Company, Brand, Branch } from './types';

const InvoicesPackpagePage: React.FC = () => {
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

    // Example existing packages
    const existingPackages = [
        { folioId: 'PKT-001', name: 'Paquete Enero' },
        { folioId: 'PKT-002', name: 'Paquete Febrero' },
        { folioId: 'PKT-003', name: 'Paquete Marzo' },
    ];

    const months = [
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
        }
    };

    const loadCompanies = async () => {
        try {
            const response = await companiesService.getAllCompanies();
            setCompanies(response.data || []);
        } catch (err) {
            console.error('Error cargando razones sociales:', err);
        }
    };

    const loadBrandsByCompany = async (companyId: string) => {
        try {
            setLoadingBrands(true);
            console.log('Cargando marcas para compañía:', companyId);
            const response = await brandsService.getBrandsByCompany(companyId);
            console.log('Marcas cargadas:', response.data);
            setBrands(response.data || []);
            console.log(`✅ Se cargaron ${response.data?.length || 0} marcas para la compañía`);
        } catch (err) {
            console.error('Error cargando marcas:', err);
            setBrands([]);
        } finally {
            setLoadingBrands(false);
        }
    };

    const loadBranchesByBrand = async (brandId: string) => {
        try {
            setLoadingBranches(true);
            console.log('Cargando sucursales para marca:', brandId);
            const response = await branchesService.getBranchesByBrand(brandId);
            console.log('Sucursales cargadas:', response.data);
            setBranches(response.data || []);
            console.log(`✅ Se cargaron ${response.data?.length || 0} sucursales para la marca`);
        } catch (err) {
            console.error('Error cargando sucursales:', err);
            setBranches([]);
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

    const handleSearch = () => {
        // Aquí implementarías la lógica de búsqueda con los filtros seleccionados
        console.log('Buscando con filtros:', {
            month: selectedMonth,
            provider: selectedProvider,
            company: selectedCompany,
            brand: selectedBrand,
            branch: selectedBranch,
            year: new Date().getFullYear() // Por ahora hardcodeado
        });
    };

    return (
        <Container fluid className="mt-4">
            <BudgetSummaryCards />
            
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
                                    {months.map((mes, idx) => (
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
                                            <option key={pkg.folioId} value={pkg.folioId}>
                                                {pkg.name} ({pkg.folioId})
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
                        <Button variant="primary" size="sm">
                            <i className="bi bi-send me-2"></i>Enviar a Pago
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Lista de Facturas */}
            <Card className="mt-4 border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                    <Card.Title className="mb-0 fw-bold">Lista de Facturas</Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Folio</th>
                                <th>Proveedor</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-muted">
                                    Sin datos
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
                
                {/* Paginación */}
                <Card.Footer className="bg-white border-top">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Mostrando 0 de 0 registros</span>
                        <ButtonGroup size="sm">
                            <Button variant="outline-secondary" disabled>
                                <i className="bi bi-chevron-left"></i> Anterior
                            </Button>
                            <Button variant="primary">1</Button>
                            <Button variant="outline-secondary" disabled>2</Button>
                            <Button variant="outline-secondary" disabled>
                                Siguiente <i className="bi bi-chevron-right"></i>
                            </Button>
                        </ButtonGroup>
                    </div>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default InvoicesPackpagePage;
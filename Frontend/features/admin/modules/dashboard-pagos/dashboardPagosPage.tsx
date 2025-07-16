import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Container, Row, Col, Form, Card, CardBody } from 'react-bootstrap'
import { toast } from 'react-toastify'
import EcomStats from './components/paymentsCard'
import OrdersStatics from './components/paymentsTable'
import { 
  getBudgetByCompanyForDashboard, 
  getUserVisibilityForSelects,
  getPaquetesEnviados,
  getBudgetByBranchesForDashboard,
  BudgetItem,
  PaquetesEnviadosResponse,
  UserVisibilityStructure,
  VisibilityCompany,
  VisibilityBrand
} from './services/dashboardPagosService'
import { useUserSessionStore } from '@/stores/userSessionStore'

const Page = () => {
  const { user } = useUserSessionStore();
  
  const [companies, setCompanies] = useState<VisibilityCompany[]>([]);
  const [brands, setBrands] = useState<VisibilityBrand[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);
  const [branchBudgetData, setBranchBudgetData] = useState<BudgetItem[]>([]);

  const [paquetesEnviadosData, setPaquetesEnviadosData] = useState<PaquetesEnviadosResponse>({
    totalPaquetes: 0,
    totalPagado: 0,
    paquetes: []
  });

  const [visibilityStructure, setVisibilityStructure] = useState<UserVisibilityStructure | null>(null);



  const months: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Cargar estructura de visibilidad solo una vez cuando el usuario esté disponible
  useEffect(() => {
    if (user?._id) {
      loadUserVisibilityStructure();
    }
  }, [user?._id]);

  // Función para cargar estructura de visibilidad
  const loadUserVisibilityStructure = useCallback(async () => {
    if (!user?._id) return;

    try {
      const response = await getUserVisibilityForSelects(user._id);
      setVisibilityStructure(response);
      setCompanies(response?.companies || []);
      setBrands(response?.brands || []);
    } catch (err) {
      console.error('Error cargando estructura de visibilidad:', err);
      toast.error('Error al cargar la estructura de visibilidad');
    }
  }, [user?._id]);

  // Función para consultar presupuesto principal
  const consultarPresupuesto = useCallback(async () => {
    if (!selectedCompany) {
      setBudgetData([]);
      return;
    }

    try {
      const monthFormatted = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;

      const response = await getBudgetByCompanyForDashboard({
        companyId: selectedCompany,
        month: monthFormatted
      });

      setBudgetData(response || []);

      // Calcular suma total de todos los presupuestos de la compañía
      const totalPresupuesto = response.reduce((sum, item) => sum + item.assignedAmount, 0);

      // Mostrar toast con el total
      toast.success(`Presupuesto total de la compañía: $${totalPresupuesto.toLocaleString()}`);

    } catch (error) {
      console.error('Error al consultar presupuesto:', error);
      setBudgetData([]);
    }
  }, [selectedCompany, selectedYear, selectedMonth]);

  // Función para consultar paquetes enviados
  const consultarPaquetesEnviados = useCallback(async () => {
    if (!user?._id || !selectedCompany) return;

    try {
      const response = await getPaquetesEnviados({
        usuario_id: user._id,
        companyId: selectedCompany || undefined,
        year: selectedYear,
        month: selectedMonth
      });


      setPaquetesEnviadosData(response);
    } catch (error) {
      console.error('Error al consultar paquetes enviados:', error);
      setPaquetesEnviadosData({
        totalPaquetes: 0,
        totalPagado: 0,
        paquetes: []
      });
    }
  }, [user?._id, selectedCompany, selectedYear, selectedMonth]);

  // Función para consultar presupuestos por sucursal
  const consultarPresupuestosPorSucursal = useCallback(async () => {
    if (!selectedCompany || !user?._id || !selectedMonth || !selectedYear) {
      setBranchBudgetData([]);
      return;
    }
    try {
      const monthFormatted = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
      
      // Obtener todas las marcas de la compañía seleccionada
      const companyBrands = brands.filter(brand => brand.companyId === selectedCompany);
      
      const response = await getBudgetByBranchesForDashboard({
        companyId: selectedCompany,
        brandIds: companyBrands.map(brand => brand._id),
        month: monthFormatted,
        userId: user._id
      });
      setBranchBudgetData(response || []);
    } catch (error) {
      console.error('Error al consultar presupuestos por sucursal:', error);
      setBranchBudgetData([]);
    }
  }, [selectedCompany, brands, selectedYear, selectedMonth, user?._id]);



  // Efecto para consultar presupuesto principal cuando cambien los filtros principales
  useEffect(() => {
    if (selectedCompany) {
      consultarPresupuesto();
    }
  }, [selectedCompany, selectedYear, selectedMonth]);

  // Efecto para consultar paquetes enviados cuando cambien los filtros principales
  useEffect(() => {
    if (user?._id && selectedCompany) {
      consultarPaquetesEnviados();
    }
  }, [user?._id, selectedCompany, selectedYear, selectedMonth]);

  // Efecto para consultar presupuestos por sucursal cuando cambien los filtros principales
  useEffect(() => {
    if (selectedCompany && visibilityStructure) {
      consultarPresupuestosPorSucursal();
    } else if (selectedCompany && !visibilityStructure) {
      // Si no hay estructura de visibilidad pero sí hay compañía seleccionada, limpiar datos
      setBranchBudgetData([]);
    }
  }, [selectedCompany, selectedYear, selectedMonth, visibilityStructure, consultarPresupuestosPorSucursal]);

  const handleCompanyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = event.target.value;
    setSelectedCompany(companyId);
    
    // Limpiar datos anteriores inmediatamente al cambiar de razón social
    if (companyId !== selectedCompany) {
      setBranchBudgetData([]);
      setBudgetData([]);
      setPaquetesEnviadosData({
        totalPaquetes: 0,
        totalPagado: 0,
        paquetes: []
      });
    }
  };

  // Memoizar las props de los cards para evitar re-renders innecesarios
  const cardsProps = useMemo(() => ({
    budgetData,
    paquetesEnviadosData,
    selectedCompany
  }), [budgetData, paquetesEnviadosData, selectedCompany]);

  return (
    <Container fluid>
      <Card className="mb-3 border-0 shadow-sm">
        <CardBody className="p-3">
          <h4 className="mb-3 text-primary fw-bold">Seleccione los filtros para calcular presupuesto</h4>
          
          <Row className="mb-3">
            <Col md={2}>
              <Form.Group>
                <Form.Label className="mb-1">Año:</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="form-select-sm"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="mb-1">Mes:</Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="form-select-sm"
                >
                  {months.map((mes: string, idx: number) => (
                    <option key={mes} value={idx}>
                      {mes}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="mb-1">Razón Social:</Form.Label>
                <Form.Select
                  value={selectedCompany}
                  onChange={handleCompanyChange}
                  className="form-select-sm"
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
          </Row>

          <Row>
            
          </Row>
        </CardBody>
      </Card>

      <EcomStats {...cardsProps} />
      
      <OrdersStatics 
        visibilityStructure={visibilityStructure}
        selectedCompany={selectedCompany}
        totalCompanyBudget={budgetData.reduce((sum, item) => sum + item.assignedAmount, 0)}
        paquetes={paquetesEnviadosData.paquetes}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        branchBudgetData={branchBudgetData}
      />
    </Container>
  )
}

export default Page
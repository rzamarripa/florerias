import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Card, CardBody } from 'react-bootstrap'
import { toast } from 'react-toastify'
import EcomStats from './components/paymentsCard'
import OrdersStatics from './components/paymentsTable'
import { 
  getBudgetByCompanyForDashboard, 
  getUserVisibilityForSelects,
  getPaquetesEnviados,
  BudgetItem,
  PaquetesEnviadosResponse,
  UserVisibilityStructure,
  VisibilityCompany
} from './services/dashboardPagosService'
import { useUserSessionStore } from '@/stores/userSessionStore'

const Page = () => {
  const { user } = useUserSessionStore();
  
  // Estados para los selects
  const [companies, setCompanies] = useState<VisibilityCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  // Estados para el período
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Estado para el presupuesto
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);

  // Estado para los paquetes enviados
  const [paquetesEnviadosData, setPaquetesEnviadosData] = useState<PaquetesEnviadosResponse>({
    totalPaquetes: 0,
    totalPagado: 0,
    paquetes: []
  });

  // Estado para la estructura de visibilidad (solo para obtener compañías)
  const [, setVisibilityStructure] = useState<UserVisibilityStructure | null>(null);

  // Declaración de los meses del año
  const months: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Cargar visibilidad cuando el usuario esté disponible
  useEffect(() => {
    if (user?._id) {
      loadUserVisibilityStructure();
    }
  }, [user?._id]);

  // Efecto para consultar presupuesto cuando se seleccione la compañía o cambien mes/año
  useEffect(() => {
    if (selectedCompany) {
      consultarPresupuesto();
    } else {
      setBudgetData([]);
    }
  }, [selectedCompany, selectedYear, selectedMonth]);

  // Efecto para consultar paquetes enviados cuando cambien los filtros
  useEffect(() => {
    if (user?._id && selectedCompany) {
      consultarPaquetesEnviados();
    }
  }, [user?._id, selectedCompany, selectedYear, selectedMonth]);

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
  };

  // Función para consultar el presupuesto cuando se seleccione la compañía
  const consultarPresupuesto = async () => {
    if (!selectedCompany) {
      setBudgetData([]);
      return;
    }

    try {
      // Construir el mes en formato YYYY-MM
      const monthFormatted = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;

      const response = await getBudgetByCompanyForDashboard({
        companyId: selectedCompany,
        month: monthFormatted
      });

      // Guardar el presupuesto en el estado - response ya es el array directamente
      setBudgetData(response || []);

    } catch (error) {
      console.error('Error al consultar presupuesto:', error);
      setBudgetData([]);
    }
  };

  // Función para consultar los paquetes enviados
  const consultarPaquetesEnviados = async () => {
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
  };

  return (
    <Container fluid>
      {/* Filtros */}
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
          </Row>

          <Row>
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
        </CardBody>
      </Card>

      {/* Cards de estadísticas */}
      <EcomStats 
        budgetData={budgetData}
        paquetesEnviadosData={paquetesEnviadosData}
        selectedCompany={selectedCompany}
      />
      
      {/* Tabla de gráficos */}
      <OrdersStatics />
    </Container>
  )
}

export default Page
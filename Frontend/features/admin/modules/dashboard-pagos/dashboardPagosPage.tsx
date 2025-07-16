import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Container, Row, Col, Form, Card, CardBody } from "react-bootstrap";
import { toast } from "react-toastify";
import EcomStats from "./components/paymentsCard";
import OrdersStatics from "./components/paymentsTable";
import {
  getBudgetByCompanyForDashboard,
  getUserVisibilityForSelects,
  getPaquetesEnviados,
  getBudgetByBranchBrand,
  BudgetItem,
  PaquetesEnviadosResponse,
  UserVisibilityStructure,
  VisibilityCompany,
} from "./services/dashboardPagosService";
import { useUserSessionStore } from "@/stores/userSessionStore";

const Page = () => {
  const { user } = useUserSessionStore();

  const [companies, setCompanies] = useState<VisibilityCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);
  const [branchBudget, setBranchBudget] = useState<number | undefined>(
    undefined
  );

  const [paquetesEnviadosData, setPaquetesEnviadosData] =
    useState<PaquetesEnviadosResponse>({
      totalPaquetes: 0,
      totalPagado: 0,
      paquetes: [],
    });

  const [visibilityStructure, setVisibilityStructure] =
    useState<UserVisibilityStructure | null>(null);

  // Usar useRef para evitar re-renders innecesarios en la consulta de sucursal
  const lastSucursalQuery = useRef<string>("");

  const months: string[] = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
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
    } catch (err) {
      console.error("Error cargando estructura de visibilidad:", err);
      toast.error("Error al cargar la estructura de visibilidad");
    }
  }, [user?._id]);

  // Función para consultar presupuesto principal
  const consultarPresupuesto = useCallback(async () => {
    if (!selectedCompany) {
      setBudgetData([]);
      return;
    }

    try {
      const monthFormatted = `${selectedYear}-${(selectedMonth + 1)
        .toString()
        .padStart(2, "0")}`;

      const response = await getBudgetByCompanyForDashboard({
        companyId: selectedCompany,
        month: monthFormatted,
      });

      setBudgetData(response || []);

      // Calcular suma total de todos los presupuestos de la compañía
      const totalPresupuesto = response.reduce(
        (sum, item) => sum + item.assignedAmount,
        0
      );

      // Mostrar toast con el total
      toast.success(
        `Presupuesto total de la compañía: $${totalPresupuesto.toLocaleString()}`
      );
    } catch (error) {
      console.error("Error al consultar presupuesto:", error);
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
        month: selectedMonth,
      });

      setPaquetesEnviadosData(response);
    } catch (error) {
      console.error("Error al consultar paquetes enviados:", error);
      setPaquetesEnviadosData({
        totalPaquetes: 0,
        totalPagado: 0,
        paquetes: [],
      });
    }
  }, [user?._id, selectedCompany, selectedYear, selectedMonth]);

  // Función para consultar presupuesto de sucursal específica (completamente independiente)
  const consultarPresupuestoSucursal = useCallback(
    async (branchId: string, companyId: string) => {
      if (!branchId || !companyId) {
        setBranchBudget(undefined);
        return;
      }

      // Evitar consultas duplicadas usando solo branchId y companyId
      const queryKey = `${branchId}-${companyId}`;
      if (lastSucursalQuery.current === queryKey) {
        return;
      }
      lastSucursalQuery.current = queryKey;

      try {
        const monthFormatted = `${selectedYear}-${(selectedMonth + 1)
          .toString()
          .padStart(2, "0")}`;

        const branchBrandIds = getBranchBrandIds(branchId, companyId);
        if (!branchBrandIds) {
          toast.error(
            "No se pudo obtener la información de la sucursal seleccionada"
          );
          setBranchBudget(undefined);
          return;
        }

        const response = await getBudgetByBranchBrand({
          companyId: companyId,
          brandId: branchBrandIds.brandId,
          branchId: branchBrandIds.branchId,
          month: monthFormatted,
        });

        // Calcular sumatoria total
        const totalPresupuesto = response.reduce(
          (sum, item) => sum + item.assignedAmount,
          0
        );

        // Actualizar el estado del presupuesto de la sucursal
        setBranchBudget(totalPresupuesto);

        // Console.log con desglose
        console.log(`Presupuesto para ${branchBrandIds.branchName}:`);
        response.forEach((item) => {
          const routeInfo = item.routeId ? ` → ${item.routeId.name}` : "";
          console.log(
            `  ${
              branchBrandIds.branchName
            }${routeInfo}: $${item.assignedAmount.toLocaleString()}`
          );
        });

        // Mostrar toast con total
        toast.success(
          `Presupuesto total para ${
            branchBrandIds.branchName
          }: $${totalPresupuesto.toLocaleString()}`
        );
      } catch (error) {
        console.error("Error al consultar presupuesto de sucursal:", error);
        toast.error("Error al consultar el presupuesto de la sucursal");
        setBranchBudget(undefined);
      }
    },
    [selectedYear, selectedMonth]
  ); // Solo depende de año/mes, no de selectedBranch/selectedCompany

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

  // Efecto para consultar presupuesto de sucursal solo cuando cambie la selección de sucursal
  useEffect(() => {
    if (selectedBranch && selectedCompany) {
      // Usar setTimeout para evitar bloqueos en el render y hacer la consulta independiente
      const timeoutId = setTimeout(() => {
        consultarPresupuestoSucursal(selectedBranch, selectedCompany);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedBranch, selectedCompany, consultarPresupuestoSucursal]); // Incluir consultarPresupuestoSucursal como dependencia

  const handleCompanyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = event.target.value;
    setSelectedCompany(companyId);
    setSelectedBranch("");
    setBranchBudget(undefined); // Limpiar presupuesto de sucursal
    lastSucursalQuery.current = ""; // Reset query cache
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);

    // Limpiar el presupuesto de sucursal si se deselecciona
    if (!branchId) {
      setBranchBudget(undefined);
      lastSucursalQuery.current = "";
    }
  };

  // Función para obtener brandId y branchId de la selección
  const getBranchBrandIds = (selectedBrandId: string, companyId: string) => {
    if (!visibilityStructure || !selectedBrandId || !companyId) {
      return null;
    }

    const branch = visibilityStructure.branches.find(
      (b) => b.brandId === selectedBrandId && b.companyId === companyId
    );

    if (!branch) {
      return null;
    }

    return {
      brandId: selectedBrandId,
      branchId: branch._id,
      branchName: branch.name,
    };
  };

  // Memoizar las props de los cards para evitar re-renders innecesarios
  const cardsProps = useMemo(
    () => ({
      budgetData,
      paquetesEnviadosData,
      selectedCompany,
    }),
    [budgetData, paquetesEnviadosData, selectedCompany]
  );

  return (
    <Container fluid>
      <Card className="mb-3 border-0 shadow-sm">
        <CardBody className="p-3">
          <h4 className="mb-3 text-primary fw-bold">
            Seleccione los filtros para calcular presupuesto
          </h4>

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
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <EcomStats {...cardsProps} />

      <OrdersStatics
        visibilityStructure={visibilityStructure}
        selectedCompany={selectedCompany}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        branchBudget={branchBudget}
      />
    </Container>
  );
};

export default Page;

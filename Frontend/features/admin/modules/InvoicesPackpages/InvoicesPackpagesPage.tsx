"use client";
import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { toast } from "react-toastify";
import { BsCash, BsClipboard, BsSearch } from "react-icons/bs";
import BudgetSummaryCards from "./components/BudgetSummaryCards";
import {
  userProvidersService,
  getInvoicesByProviderAndCompany,
  getInvoicesSummaryByProviderAndCompany,
  ImportedInvoice,
  InvoicesSummaryResponse,
  getInvoicesPackagesCreatedByUsuario,
  getUserVisibilityForSelects,
  getBudgetByCompanyBrandBranch,
  BudgetItem,
} from "./services";
import {
  UserProvider,
  UserVisibilityStructure,
  VisibilityCompany,
  VisibilityBrand,
  VisibilityBranch,
} from "./types";
import PagoFacturaModal from "./components/PagoFacturaModal";
import EnviarPagoModal from "./components/EnviarPagoModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import CreatedPackpageModal from "./components/CreatedPackpageModal";
import { useRouter } from "next/navigation";
import DescuentoFacturaModal from "./components/DescuentoFacturaModal";
import MultiSelect from "@/components/forms/Multiselect";
import { CashPaymentModalSimple } from "../cashPayments/components/CashPaymentModalSimple";
import { Eye, LucideSearch } from "lucide-react";
import { formatCurrency } from "@/utils";
import { formatDate } from "@/utils/dateUtils";

const InvoicesPackagePage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isNewPackage, setIsNewPackage] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [userProviders, setUserProviders] = useState<UserProvider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const [companies, setCompanies] = useState<VisibilityCompany[]>([]);
  const [brands, setBrands] = useState<VisibilityBrand[]>([]);
  const [branches, setBranches] = useState<VisibilityBranch[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [visibilityStructure, setVisibilityStructure] =
    useState<UserVisibilityStructure | null>(null);

  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);

  const [invoices, setInvoices] = useState<ImportedInvoice[]>([]);
  const [invoicesSummary, setInvoicesSummary] = useState<
    InvoicesSummaryResponse["data"] | null
  >(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 15,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const [showPagoModal, setShowPagoModal] = useState(false);
  const [tipoPagoModal, setTipoPagoModal] = useState<"completo" | "parcial">(
    "completo"
  );
  const [saldoModal, setSaldoModal] = useState(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [showEnviarPagoModal, setShowEnviarPagoModal] = useState(false);
  const [facturasProcesadas, setFacturasProcesadas] = useState<
    ImportedInvoice[]
  >([]);
  const [paqueteExistenteSeleccionado, setPaqueteExistenteSeleccionado] =
    useState<any>(null);
  const [existingPackages, setExistingPackages] = useState<any[]>([]);
  const [showCreatedPackpageModal, setShowCreatedPackpageModal] =
    useState(false);
  const [createdPackpageId, setCreatedPackpageId] = useState<string | null>(
    null
  );

  const [showDescuentoModal, setShowDescuentoModal] = useState(false);
  const [descuentoSaldo, setDescuentoSaldo] = useState(0);
  const [descuentoInvoiceId, setDescuentoInvoiceId] = useState<string | null>(
    null
  );

  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);

  const [tempPayments, setTempPayments] = useState<{
    [invoiceId: string]: {
      tipoPago: "completo" | "parcial";
      descripcion: string;
      monto?: number;
      originalImportePagado: number;
      originalSaldo: number;
      conceptoGasto?: string;
    };
  }>({});

  const [tempCashPayments, setTempCashPayments] = useState<
    {
      _id: string;
      importeAPagar: number;
      expenseConcept: {
        _id: string;
        name: string;
        categoryId?: {
          _id: string;
          name: string;
        };
      };
      description?: string;
      createdAt: string;
    }[]
  >([]);

  const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);

  const { user } = useUserSessionStore();
  const router = useRouter();

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

  useEffect(() => {
    loadUserProviders();
  }, []);

  useEffect(() => {
    if (user?._id) {
      loadUserVisibilityStructure();
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?.departmentId) {
      loadExpenseConcepts();
    }
  }, [user?.departmentId]);

  useEffect(() => {
    if (
      selectedCompany &&
      selectedBrand &&
      selectedBranch &&
      !loadingInvoices
    ) {
      handleSearch();
    }
  }, [selectedYear, selectedMonth]);

  const loadUserProviders = async () => {
    try {
      const response = await userProvidersService.getCurrentUserProviders({
        limit: 100,
      });
      setUserProviders(response.data || []);
    } catch (err) {
      console.error("Error cargando proveedores del usuario:", err);
      toast.error("Error al cargar los proveedores");
    }
  };

  const loadUserVisibilityStructure = async () => {
    if (!user?._id) return;

    try {
      const response = await getUserVisibilityForSelects(user._id);
      setVisibilityStructure(response);
      setCompanies(response?.companies || []);
    } catch (err) {
      console.error("Error cargando estructura de visibilidad:", err);
      toast.error("Error al cargar la estructura de visibilidad");
    }
  };

  const loadExpenseConcepts = async () => {
    if (!user?.departmentId) return;

    try {
      const { expenseConceptService } = await import(
        "../expenseConcepts/services/expenseConcepts"
      );
      const response = await expenseConceptService.getByDepartment(
        user.departmentId
      );
      setExpenseConcepts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error cargando conceptos de gasto:", err);
      setExpenseConcepts([]);
    }
  };

  const handleCompanyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = event.target.value;

    setSelectedCompany(companyId);
    setSelectedBrand("");
    setSelectedBranch("");

    if (companyId && visibilityStructure) {
      const companyBrands = visibilityStructure.brands.filter(
        (brand) => brand.companyId === companyId
      );
      setBrands(companyBrands);
    } else {
      setBrands([]);
    }
  };

  const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = event.target.value;

    setSelectedBrand(brandId);
    setSelectedBranch("");

    if (brandId && visibilityStructure) {
      const brandBranches = visibilityStructure.branches.filter(
        (branch) => branch.brandId === brandId
      );
      setBranches(brandBranches);
    } else {
      setBranches([]);
    }
  };

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(event.target.value);
  };

  const consultarPresupuesto = async () => {
    if (!selectedCompany || !selectedBrand || !selectedBranch) {
      setBudgetData([]);
      return;
    }

    try {
      const monthFormatted = `${selectedYear}-${(selectedMonth + 1)
        .toString()
        .padStart(2, "0")}`;

      const response = await getBudgetByCompanyBrandBranch({
        companyId: selectedCompany,
        brandId: selectedBrand,
        branchId: selectedBranch,
        month: monthFormatted,
      });

      setBudgetData(response || []);
    } catch (error) {
      console.error("Error al consultar presupuesto:", error);
      setBudgetData([]);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      consultarPresupuesto();
    } else {
      setBudgetData([]);
    }
  }, [selectedBranch, selectedYear, selectedMonth]);

  const handleTempPayment = (
    invoiceId: string,
    tipoPago: "completo" | "parcial",
    descripcion: string,
    monto?: number,
    conceptoGasto?: string
  ) => {
    const invoice = invoices.find((inv) => inv._id === invoiceId);
    if (!invoice) return;

    const originalSaldo = invoice.importeAPagar - invoice.importePagado;

    setTempPayments((prev) => ({
      ...prev,
      [invoiceId]: {
        tipoPago,
        descripcion,
        monto,
        originalImportePagado: invoice.importePagado,
        originalSaldo,
        conceptoGasto,
      },
    }));

    toast.success(
      tipoPago === "completo"
        ? "Pago completo registrado temporalmente"
        : "Pago parcial registrado temporalmente"
    );
  };

  const handleRemoveTempPayment = (invoiceId: string) => {
    setTempPayments((prev) => {
      const newTempPayments = { ...prev };
      delete newTempPayments[invoiceId];
      return newTempPayments;
    });
    toast.info("Pago temporal eliminado");
  };

  const handleAddTempCashPayment = (cashPayment: {
    _id: string;
    importeAPagar: number;
    expenseConcept: {
      _id: string;
      name: string;
      categoryId?: {
        _id: string;
        name: string;
      };
    };
    description?: string;
    createdAt: string;
  }) => {
    setTempCashPayments((prev) => [...prev, cashPayment]);
    toast.success("Pago en efectivo agregado temporalmente");
  };

  const handleRemoveTempCashPayment = (cashPaymentId: string) => {
    setTempCashPayments((prev) =>
      prev.filter((payment) => payment._id !== cashPaymentId)
    );
    toast.info("Pago en efectivo temporal eliminado");
  };

  const combinedSummary = React.useMemo(() => {
    if (!invoicesSummary) return null;

    let totalTempPagado = 0;
    let facturasTempPagadas = 0;

    Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
      if (payment.tipoPago === "completo") {
        const invoice = invoices.find((inv) => inv._id === invoiceId);
        if (invoice) {
          totalTempPagado += invoice.importeAPagar;
          facturasTempPagadas += 1;
        }
      } else if (payment.tipoPago === "parcial" && payment.monto) {
        totalTempPagado += payment.monto;
        const invoice = invoices.find((inv) => inv._id === invoiceId);
        if (
          invoice &&
          invoice.importePagado + payment.monto >= invoice.importeAPagar
        ) {
          facturasTempPagadas += 1;
        }
      }
    });

    const totalCashPayments = tempCashPayments.reduce(
      (sum, payment) => sum + payment.importeAPagar,
      0
    );

    return {
      ...invoicesSummary,
      totalPagado:
        invoicesSummary.totalPagado + totalTempPagado + totalCashPayments,
      totalSaldo:
        invoicesSummary.totalSaldo - totalTempPagado - totalCashPayments,
      facturasPagadas:
        (invoicesSummary.facturasPagadas || 0) + facturasTempPagadas,
    };
  }, [invoicesSummary, tempPayments, tempCashPayments, invoices]);

  const getInvoiceWithTempPayments = (invoice: ImportedInvoice) => {
    const tempPayment = tempPayments[invoice._id];
    if (!tempPayment) return invoice;

    let newImportePagado = invoice.importePagado;
    if (tempPayment.tipoPago === "completo") {
      newImportePagado = invoice.importeAPagar;
    } else if (tempPayment.tipoPago === "parcial" && tempPayment.monto) {
      newImportePagado = invoice.importePagado + tempPayment.monto;
    }

    return {
      ...invoice,
      importePagado: newImportePagado,
    };
  };

  const handleSearch = async () => {
    if (!selectedCompany || !selectedBrand || !selectedBranch) {
      toast.warn("Selecciona razón social, marca y sucursal para buscar");
      return;
    }
    try {
      setLoadingInvoices(true);

      let providerIdsParam = "";
      if (selectedProviders.length > 0) {
        providerIdsParam = selectedProviders.join(",");
      } else {
        providerIdsParam = userProviders
          .map((up) => up.providerId._id)
          .join(",");
      }

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
        23,
        59,
        59,
        999
      );

      const [invoicesResponse, summaryResponse, packagesResponse] =
        await Promise.all([
          getInvoicesByProviderAndCompany({
            providerIds: providerIdsParam,
            companyId: selectedCompany,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            page: currentPage,
            limit: 15,
            sortBy: "fechaEmision",
            order: "desc",
          }),
          getInvoicesSummaryByProviderAndCompany({
            providerIds: providerIdsParam,
            companyId: selectedCompany,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
          user?._id
            ? getInvoicesPackagesCreatedByUsuario(user._id)
            : Promise.resolve([]),
        ]);

      if (invoicesResponse && invoicesResponse.data) {
        setInvoices(invoicesResponse.data);
        setPagination(invoicesResponse.pagination || pagination);
      } else {
        toast.error("Error al cargar las facturas");
      }

      if (summaryResponse && summaryResponse.data) {
        setInvoicesSummary(summaryResponse.data);
      } else {
        toast.error("Error al cargar el resumen");
      }

      setExistingPackages(
        Array.isArray(packagesResponse?.data)
          ? packagesResponse.data
          : Array.isArray(packagesResponse)
          ? packagesResponse
          : []
      );
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      toast.error("Error al realizar la búsqueda");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);

    if (!selectedCompany || !selectedBrand || !selectedBranch) return;

    try {
      setLoadingInvoices(true);

      let providerIdsParam = "";
      if (selectedProviders.length > 0) {
        providerIdsParam = selectedProviders.join(",");
      } else {
        providerIdsParam = userProviders
          .map((up) => up.providerId._id)
          .join(",");
      }

      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
        23,
        59,
        59,
        999
      );

      const response = await getInvoicesByProviderAndCompany({
        providerIds: providerIdsParam,
        companyId: selectedCompany,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page,
        limit: 15,
        sortBy: "fechaEmision",
        order: "desc",
      });

      if (response) {
        setInvoices(response);
        setPagination(pagination);
      }
    } catch (error) {
      console.error("Error al cambiar página:", error);
      toast.error("Error al cambiar de página");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const getEstatusText = (estatus: number) => {
    return estatus === 1
      ? { text: "Vigente", variant: "success" }
      : { text: "Cancelado", variant: "danger" };
  };

  useEffect(() => {
    if (existingPackages.length > 0) {
      const facturasEnPaquetes = existingPackages.flatMap((pkg) =>
        pkg.facturas.map((f: any) => f._id)
      );

      setTempPayments((prev) => {
        const newTempPayments = { ...prev };
        let cambios = false;

        Object.keys(newTempPayments).forEach((invoiceId) => {
          if (facturasEnPaquetes.includes(invoiceId)) {
            delete newTempPayments[invoiceId];
            cambios = true;
          }
        });

        if (cambios) {
        }

        return newTempPayments;
      });
    }
  }, [existingPackages]);

  const getFacturaEstado = (invoice: ImportedInvoice) => {
    const invoiceWithTempPayments = getInvoiceWithTempPayments(invoice);
    const isCompletamentePagada =
      invoiceWithTempPayments.importePagado >=
      invoiceWithTempPayments.importeAPagar;

    const hasTempPayment = tempPayments[invoice._id];
    if (hasTempPayment) {
      return {
        tipo: "seleccionada",
        etiqueta: "Seleccionada",
        mostrarBotones: false,
        descripcion: "Pago temporal registrado - Pendiente de envío",
        color: "info",
      };
    }

    if (
      invoiceWithTempPayments.importePagado > 0 &&
      invoiceWithTempPayments.importePagado <
        invoiceWithTempPayments.importeAPagar
    ) {
      return {
        tipo: "parcial",
        etiqueta: null,
        mostrarBotones: true,
        descripcion: "Pago parcial - Puede continuar pagando",
      };
    }

    if (isCompletamentePagada) {
      if (invoice.estaRegistrada && invoice.autorizada === null) {
        return {
          tipo: "completa_pendiente",
          etiqueta: "Procesada",
          mostrarBotones: false,
          descripcion: "Pago completo pendiente de autorización",
          color: "primary",
        };
      }

      if (invoice.estaRegistrada && invoice.autorizada === true) {
        return {
          tipo: "completa_autorizada",
          etiqueta: "Autorizada",
          mostrarBotones: false,
          descripcion: "Pago completo autorizado",
          color: "success",
        };
      }

      return {
        tipo: "completa_rechazada",
        etiqueta: null,
        mostrarBotones: true,
        descripcion: "Pago rechazado - Puede pagar nuevamente",
      };
    }

    // Si no tiene pagos
    return {
      tipo: "sin_pago",
      etiqueta: null,
      mostrarBotones: true,
      descripcion: "Sin pagos - Puede realizar pagos",
    };
  };

  const loadExistingPackages = async () => {
    if (!user?._id) return [];
    try {
      const paquetes = await getInvoicesPackagesCreatedByUsuario(user._id);
      setExistingPackages(
        Array.isArray(paquetes?.data)
          ? paquetes.data
          : Array.isArray(paquetes)
          ? paquetes
          : []
      );
      return Array.isArray(paquetes?.data)
        ? paquetes.data
        : Array.isArray(paquetes)
        ? paquetes
        : [];
    } catch {
      setExistingPackages([]);
      return [];
    }
  };

  const facturasGuardadas = React.useMemo(() => {
    return Array.isArray(existingPackages)
      ? existingPackages.flatMap((pkg) =>
          pkg.facturas
            .filter((f: any) => {
              const facturaActual = invoices.find((inv) => inv._id === f._id);

              if (
                facturaActual &&
                (facturaActual.autorizada === false ||
                  facturaActual.pagoRechazado === true)
              ) {
                return false;
              }

              return f.importePagado >= f.importeAPagar;
            })
            .map((f: any) => f._id)
        )
      : [];
  }, [existingPackages, invoices]);

  const facturasDisponibles = React.useMemo(() => {
    return invoices.filter((f) => {
      const hasTempPayment = tempPayments[f._id];
      const invoiceWithTempPayments = getInvoiceWithTempPayments(f);

      const esRechazada = f.autorizada === false || f.pagoRechazado === true;

      if (
        f.estaRegistrada &&
        invoiceWithTempPayments.importePagado >=
          invoiceWithTempPayments.importeAPagar &&
        !esRechazada
      ) {
        return false;
      }
      const noEstaGuardada = !facturasGuardadas.includes(f._id);

      if (esRechazada && noEstaGuardada) {
        return true;
      }

      if (hasTempPayment && noEstaGuardada) {
        return true;
      }

      return false;
    });
  }, [invoices, facturasGuardadas, tempPayments]);

  const facturasConPagosNoGuardadas = React.useMemo(() => {
    return invoices.filter((f) => {
      const hasTempPayment = tempPayments[f._id];
      const invoiceWithTempPayments = getInvoiceWithTempPayments(f);

      const esRechazada = f.autorizada === false || f.pagoRechazado === true;

      if (
        f.estaRegistrada &&
        invoiceWithTempPayments.importePagado >=
          invoiceWithTempPayments.importeAPagar &&
        !esRechazada
      ) {
        return false;
      }

      const noEstaGuardada = !facturasGuardadas.includes(f._id);

      if (isNewPackage) {
        return (esRechazada || hasTempPayment) && noEstaGuardada;
      } else {
        return (esRechazada || hasTempPayment) && noEstaGuardada;
      }
    });
  }, [invoices, facturasGuardadas, tempPayments, isNewPackage]);

  const contadorTotalElementos = React.useMemo(() => {
    const facturasCount = facturasConPagosNoGuardadas.length;
    const cashPaymentsCount = tempCashPayments.length;
    return facturasCount + cashPaymentsCount;
  }, [facturasConPagosNoGuardadas, tempCashPayments]);

  let facturasGuardadasEnPaquete: any[] = [];
  if (!isNewPackage && selectedPackageId) {
    const paquete = existingPackages.find((p) => p._id === selectedPackageId);
    if (paquete) {
      facturasGuardadasEnPaquete = paquete.facturas.filter(
        (f: any) => f.importePagado > 0
      );
    }
  }

  const contadorFacturas = isNewPackage
    ? contadorTotalElementos
    : contadorTotalElementos + facturasGuardadasEnPaquete.length;

  return (
    <Container fluid className=" p-0">
      <div className="row gx-1 gy-1 mb-1">
        <BudgetSummaryCards
          tempPayments={tempPayments}
          tempCashPayments={tempCashPayments}
          invoices={invoices}
          budgetData={budgetData}
          existingPackages={existingPackages}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </div>

      <Card className="mb-1 border-0 shadow-sm p-0">
        <Card.Body className="p-2 pb-1">
          <Row className="mb-1 align-items-end">
            <Col md={2} className="mb-0">
              <Form.Group className="mb-0">
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
            <Col md={10} className="mb-0">
              <Form.Group className="mb-0">
                <Form.Label className="mb-1">Mes:</Form.Label>
                <div className="d-flex gap-1 flex-wrap">
                  {months.map((mes: string, idx: number) => (
                    <Button
                      key={mes}
                      size="sm"
                      variant={
                        selectedMonth === idx ? "primary" : "outline-secondary"
                      }
                      className="mb-0 py-1 px-2"
                      onClick={() => setSelectedMonth(idx)}
                    >
                      {mes}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-1">
            <Col md={4} className="mb-0">
              <Form.Group className="mb-0">
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
            <Col md={4} className="mb-0">
              <Form.Group className="mb-0">
                <Form.Label className="mb-1">Marca:</Form.Label>
                <Form.Select
                  value={selectedBrand}
                  onChange={handleBrandChange}
                  disabled={!selectedCompany}
                  className="form-select-sm"
                >
                  <option value="">Selecciona una marca...</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="mb-0">
              <Form.Group className="mb-0">
                <Form.Label className="mb-1">Sucursal:</Form.Label>
                <Form.Select
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  disabled={!selectedBrand}
                  className="form-select-sm"
                >
                  <option value="">Selecciona una sucursal...</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="align-items-end mb-0">
            <Col md={8} className="mb-0">
              <Form.Group className="mb-0">
                <Form.Label className="mb-1">Proveedores</Form.Label>
                <MultiSelect
                  value={selectedProviders}
                  options={userProviders.map((userProvider) => ({
                    value: userProvider.providerId._id,
                    label: `${userProvider.providerId.commercialName} - ${userProvider.providerId.businessName}`,
                  }))}
                  onChange={setSelectedProviders}
                  placeholder="Selecciona uno o más proveedores (o deja vacío para usar todos)..."
                  isSearchable
                />
                {selectedProviders.length === 0 &&
                  selectedCompany &&
                  selectedBrand &&
                  selectedBranch && (
                    <small className="text-info">
                      <i className="bi bi-info-circle me-1"></i>
                      Se usarán todos los proveedores de tu visibilidad
                    </small>
                  )}
              </Form.Group>
            </Col>
            <Col md={4} className="mb-0 d-flex align-items-end">
              <div className="d-flex gap-2 w-100">
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  size="sm"
                  className="py-1 px-2 flex-fill"
                  disabled={
                    !selectedCompany || !selectedBrand || !selectedBranch
                  }
                >
                  <LucideSearch className="me-2" size={16} />
                  Buscar
                </Button>
                <Button
                  variant="success"
                  onClick={() => setShowCashPaymentModal(true)}
                  size="sm"
                  className="py-1 px-2 flex-fill"
                  disabled={
                    !selectedCompany || !selectedBrand || !selectedBranch
                  }
                >
                  <BsCash className="me-2" size={16} />
                  Pagar en efectivo
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-1 border-0 shadow-sm p-0">
        <Card.Header className="bg-primary text-white border-0 py-2 px-3">
          <Card.Title className="mb-0 fw-bold fs-6">
            Configuración del Paquete de Facturas
          </Card.Title>
        </Card.Header>
        <Card.Body className="p-2 pb-1">
          {Object.keys(tempPayments).length === 0 &&
          tempCashPayments.length === 0 ? (
            <div className="text-center py-3">
              <i className="bi bi-info-circle display-6 text-muted mb-2"></i>
              <h6 className="text-muted mb-1 fs-7">No hay pagos registrados</h6>
              <p className="text-muted small mb-0">
                Registra al menos un pago de factura o pago en efectivo para
                poder crear o actualizar paquetes
              </p>
            </div>
          ) : (
            <>
              <h6 className="mb-2 fw-bold text-primary fs-7">
                Selecciona el tipo de operación:
              </h6>

              <Row className="">
                <Col md={3}>
                  <Card
                    className={`h-80 ${
                      isNewPackage
                        ? "border-success bg-light"
                        : "border-secondary"
                    } p-0`}
                    style={{ cursor: "pointer", minHeight: "70px" }}
                    onClick={() => setIsNewPackage(true)}
                  >
                    <Card.Body className="text-center  d-flex flex-column justify-content-center align-items-center">
                      <Card.Title className="h6 text-success mb-0 fs-7">
                        Nuevo Paquete
                      </Card.Title>
                      <Card.Text className="text-muted small mb-0">
                        Crear un paquete desde cero
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card
                    className={`h-80 ${
                      !isNewPackage
                        ? "border-secondary bg-light"
                        : "border-light"
                    } p-0`}
                    style={{ cursor: "pointer", minHeight: "70px" }}
                    onClick={() => setIsNewPackage(false)}
                  >
                    <Card.Body className="text-center  d-flex flex-column justify-content-center align-items-center">
                      <Card.Title className="h6 text-secondary mb-0 fs-7">
                        Paquete Existente
                      </Card.Title>
                      <Card.Text className="text-muted small mb-0">
                        Agregar a un paquete existente en borrador
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                {!isNewPackage && (
                  <Col md={3} className="d-flex align-items-end gap-2 mb-4">
                    <Form.Group className="flex-grow-1 mb-0">
                      <Form.Label className="mb-1">
                        Selecciona un paquete:
                      </Form.Label>
                      <Form.Select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="form-select-sm"
                      >
                        <option value="">Selecciona un paquete...</option>
                        {existingPackages.map((pkg) => (
                          <option key={pkg._id} value={pkg._id}>
                            {pkg.comentario || `Folio ${pkg.folio}`} (Folio:{" "}
                            {pkg.folio})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={!selectedPackageId}
                      onClick={() => {
                        if (selectedPackageId) {
                          window.open(
                            `/modulos/paquetes-facturas/detalle-paquete?packpageId=${selectedPackageId}`,
                            "_blank"
                          );
                        }
                      }}
                      title="Ver detalle del paquete"
                    >
                      <Eye size={16} />
                      Ver
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
                {tempCashPayments.length > 0 && (
                  <Button variant="info" size="sm">
                    <i className="bi bi-cash me-2"></i>
                    Pagos Efectivo: {tempCashPayments.length}
                  </Button>
                )}
                {Object.keys(tempPayments).length > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setTempPayments({});
                      toast.info("Pagos temporales eliminados");
                    }}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Limpiar
                  </Button>
                )}
                {tempCashPayments.length > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setTempCashPayments([]);
                      toast.info("Pagos en efectivo temporales eliminados");
                    }}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Limpiar Efectivo
                  </Button>
                )}
                <Button
                  variant="primary"
                  disabled={
                    contadorTotalElementos === 0 &&
                    !(selectedPackageId && !isNewPackage)
                  }
                  onClick={() => {
                    if (
                      contadorTotalElementos === 0 &&
                      !(selectedPackageId && !isNewPackage)
                    ) {
                      if (isNewPackage) {
                        toast.warn(
                          "No hay facturas o pagos en efectivo seleccionados para el nuevo paquete. Registra pagos temporales, pagos en efectivo o selecciona facturas rechazadas."
                        );
                      } else {
                        toast.warn(
                          "No hay facturas con pagos disponibles para guardar en paquete."
                        );
                      }
                      return;
                    }

                    let paqueteExistenteSeleccionado = null;
                    let facturasParaEnviar = facturasDisponibles;

                    if (!isNewPackage && selectedPackageId) {
                      paqueteExistenteSeleccionado = existingPackages.find(
                        (p) => p._id === selectedPackageId
                      );

                      // Solo incluir facturas con pagos temporales seleccionados (completos o parciales)
                      const facturasConPagosTemporales =
                        facturasDisponibles.filter((f) => {
                          const temp = tempPayments[f._id];
                          return !!temp;
                        });

                      if (
                        facturasConPagosTemporales.length === 0 &&
                        tempCashPayments.length === 0
                      ) {
                        toast.warn(
                          "No hay pagos temporales seleccionados para agregar al paquete existente."
                        );
                      }

                      facturasParaEnviar = facturasConPagosTemporales;
                    } else {
                      // Para nuevo paquete: SOLO incluir facturas con pagos temporales o rechazadas
                      // NO incluir facturas con pagos parciales de otros paquetes sin seleccionar
                      facturasParaEnviar = facturasDisponibles.filter((f) => {
                        const hasTempPayment = tempPayments[f._id];
                        const esRechazada =
                          f.autorizada === false || f.pagoRechazado === true;

                        // Para nuevo paquete, solo permitir:
                        // 1. Facturas con pagos temporales (seleccionadas por el usuario)
                        // 2. Facturas rechazadas (pueden volver a ser pagadas)
                        // 2. Facturas rechazadas (pueden volver a ser pagadas)
                        return hasTempPayment || esRechazada;
                      });
                    }
                    setFacturasProcesadas(facturasParaEnviar);
                    setPaqueteExistenteSeleccionado(
                      paqueteExistenteSeleccionado
                    );
                    setShowEnviarPagoModal(true);
                  }}
                >
                  <i className="bi bi-send me-2"></i>
                  {!isNewPackage && selectedPackageId
                    ? "Actualizar Paquete"
                    : "Enviar a Pago"}
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

      <Card className="mt-4 border-0 shadow-sm">
        <Card.Header className="bg-light border-bottom">
          <Card.Title className="mb-0 fw-bold">Lista de Facturas</Card.Title>
          {combinedSummary && (
            <div className="mt-2">
              <small className="text-muted">
                Total: {combinedSummary.totalFacturas} facturas | Importe:{" "}
                {formatCurrency(combinedSummary.totalImporteAPagar)} | Pagado:{" "}
                {formatCurrency(combinedSummary.totalPagado)} | Saldo:{" "}
                {formatCurrency(combinedSummary.totalSaldo)}
                {Object.keys(tempPayments).length > 0 && (
                  <span className="text-warning ms-2">
                    <i className="bi bi-clock me-1"></i>
                    Incluye {Object.keys(tempPayments).length} pago
                    {Object.keys(tempPayments).length > 1 ? "s" : ""} temporal
                    {Object.keys(tempPayments).length > 1 ? "es" : ""}
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
                  ? "Selecciona al menos un proveedor o una razón social para buscar facturas"
                  : `No hay facturas que coincidan con los filtros seleccionados para ${months[selectedMonth]} ${selectedYear}`}
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
                  const invoiceWithTempPayments =
                    getInvoiceWithTempPayments(invoice);
                  const estatus = getEstatusText(invoice.estatus);
                  const saldo =
                    invoiceWithTempPayments.importePagado >=
                    invoiceWithTempPayments.importeAPagar
                      ? 0
                      : invoiceWithTempPayments.importeAPagar -
                        invoiceWithTempPayments.importePagado;
                  const facturaEstado = getFacturaEstado(invoice);
                  const hasTempPayment = tempPayments[invoice._id];

                  return (
                    <tr key={invoice._id}>
                      <td>{(currentPage - 1) * 15 + index + 1}</td>
                      {/* Seleccionar para pago */}
                      <td className="text-center">
                        {facturaEstado.etiqueta ? (
                          <span
                            className={`badge ${
                              facturaEstado.color === "primary"
                                ? "bg-primary bg-opacity-10 text-primary"
                                : facturaEstado.color === "success"
                                ? "bg-success bg-opacity-10 text-success"
                                : facturaEstado.color === "info"
                                ? "bg-info bg-opacity-10 text-info"
                                : "bg-warning bg-opacity-10 text-warning"
                            } fw-bold py-2 px-3`}
                          >
                            <i
                              className={`bi ${
                                facturaEstado.tipo === "completa_autorizada"
                                  ? "bi-check-circle"
                                  : facturaEstado.tipo === "seleccionada"
                                  ? "bi-hand-index"
                                  : "bi-clock"
                              } me-1`}
                            ></i>
                            {facturaEstado.etiqueta}
                          </span>
                        ) : (
                          <div className="d-flex flex-column gap-1 w-100">
                            {facturaEstado.tipo === "parcial" && (
                              <div className="mb-1">
                                <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">
                                  <i className="bi bi-clock me-1"></i>
                                  Pago Parcial:{" "}
                                  {Math.round(
                                    (invoiceWithTempPayments.importePagado /
                                      invoiceWithTempPayments.importeAPagar) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                            )}
                            {facturaEstado.mostrarBotones && (
                              <>
                                <div className="d-flex gap-1 w-100">
                                  <Button
                                    variant="outline-success"
                                    className="d-flex align-items-center justify-content-center w-100 py-1"
                                    onClick={() => {
                                      setTipoPagoModal("completo");
                                      setSaldoModal(saldo);
                                      setSelectedInvoiceId(invoice._id);
                                      setShowPagoModal(true);
                                    }}
                                  >
                                    <i className="bi bi-check2 me-1"></i>
                                    <span className="fw-bold">Completa</span>
                                  </Button>
                                  <Button
                                    variant="outline-warning"
                                    className="d-flex align-items-center justify-content-center w-100 py-1"
                                    onClick={() => {
                                      setTipoPagoModal("parcial");
                                      setSaldoModal(saldo);
                                      setSelectedInvoiceId(invoice._id);
                                      setShowPagoModal(true);
                                    }}
                                  >
                                    <i className="bi bi-dash me-1"></i>
                                    <span className="fw-bold">Parcial</span>
                                  </Button>
                                </div>
                                <Button
                                  variant="outline-secondary"
                                  className="d-flex align-items-center justify-content-center w-100 py-1"
                                  onClick={() => {
                                    setDescuentoSaldo(saldo);
                                    setDescuentoInvoiceId(invoice._id);
                                    setShowDescuentoModal(true);
                                  }}
                                >
                                  <i className="bi bi-gem me-1"></i>
                                  <span className="fw-bold">Descuento</span>
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
                          className="d-flex align-items-center fw-bold text-white btn-sm px-2 py-1"
                          onClick={() => {
                            navigator.clipboard.writeText(invoice.uuid);
                            toast.success("UUID copiado al portapapeles");
                          }}
                        >
                          <BsClipboard className="me-1" />
                          Copiar
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
                        <span className="badge fs-6 bg-warning bg-opacity-10 text-warning">
                          PPD
                        </span>
                      </td>
                      {/* Emisor RFC */}
                      <td>{invoice.rfcEmisor}</td>
                      {/* Estatus */}
                      <td>
                        <span
                          className={`badge fs-6 ${
                            estatus.text === "Vigente"
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {estatus.text}
                        </span>
                      </td>
                      {/* Fecha Cancelación */}
                      <td>
                        {invoice.fechaCancelacion
                          ? formatDate(invoice.fechaCancelacion)
                          : ""}
                      </td>
                      {/* Total a Pagar */}
                      <td>
                        <div className="d-flex flex-column">
                          <span
                            className={`fw-bold ${
                              invoiceWithTempPayments.importeAPagar > 0
                                ? "text-success"
                                : "text-muted"
                            }`}
                          >
                            {formatCurrency(
                              invoiceWithTempPayments.importeAPagar
                            )}
                          </span>
                        </div>
                      </td>
                      {/* Importe Pagado */}
                      <td>
                        <div className="d-flex flex-column">
                          <span
                            className={`fw-bold ${
                              invoiceWithTempPayments.importePagado > 0
                                ? "text-success"
                                : "text-muted"
                            }`}
                          >
                            {formatCurrency(
                              invoiceWithTempPayments.importePagado
                            )}
                          </span>
                          {invoiceWithTempPayments.importePagado > 0 && (
                            <small className="text-muted">
                              {Math.round(
                                (invoiceWithTempPayments.importePagado /
                                  invoiceWithTempPayments.importeAPagar) *
                                  100
                              )}
                              % pagado
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
                        <span
                          className={
                            saldo > 0 ? "text-warning" : "text-success"
                          }
                        >
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

        {pagination.total > 0 && (
          <Card.Footer className="bg-white border-top">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">
                Mostrando {(currentPage - 1) * pagination.limit + 1} a{" "}
                {Math.min(currentPage * pagination.limit, pagination.total)} de{" "}
                {pagination.total} registros
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
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const pageNum =
                      Math.max(
                        1,
                        Math.min(pagination.pages - 4, currentPage - 2)
                      ) + i;
                    if (pageNum > pagination.pages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pageNum === currentPage
                            ? "primary"
                            : "outline-secondary"
                        }
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}

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
        companyId={selectedCompany}
        brandId={selectedBrand}
        branchId={selectedBranch}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSuccess={handleTempPayment}
      />

      <EnviarPagoModal
        show={showEnviarPagoModal}
        onClose={() => setShowEnviarPagoModal(false)}
        facturas={facturasProcesadas.map((f) => ({
          _id: f._id,
          nombreEmisor: f.nombreEmisor,
          uuid: f.uuid,
          fechaEmision: f.fechaEmision,
          tipoComprobante: f.tipoComprobante,
          rfcEmisor: f.rfcEmisor,
          estatus: String(f.estatus),
          descripcionEstatus: f.estatus === 1 ? "Vigente" : "Cancelado",
          fechaCancelacion: f.fechaCancelacion,
          importeAPagar: f.importeAPagar,
          saldo: f.importeAPagar - f.importePagado,
          importePagado: f.importePagado,
          completamentePagada: f.importePagado >= f.importeAPagar,
        }))}
        paqueteExistente={paqueteExistenteSeleccionado}
        razonSocialName={
          companies.find((c) => c._id === selectedCompany)?.name || ""
        }
        isNewPackage={isNewPackage}
        selectedCompanyId={selectedCompany}
        selectedBrandId={selectedBrand}
        selectedBranchId={selectedBranch}
        tempPayments={tempPayments}
        tempCashPayments={tempCashPayments}
        onRemoveTempPayment={handleRemoveTempPayment}
        onRemoveTempCashPayment={handleRemoveTempCashPayment}
        onSuccess={async () => {
          setShowEnviarPagoModal(false);
          setTempPayments({});
          setTempCashPayments([]);
          const paquetes = await loadExistingPackages();
          if (paquetes && paquetes.length > 0) {
            const sorted = paquetes.sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            const newest = sorted[0];
            setCreatedPackpageId(newest._id);
            setShowCreatedPackpageModal(true);
          }
        }}
        onCancel={() => {
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
            router.push(
              `/modulos/paquetes-facturas/detalle-paquete?packpageId=${createdPackpageId}`
            );
          }
        }}
        onViewList={() => {
          setShowCreatedPackpageModal(false);
          router.push("/modulos/paquetes-facturas/listado-paquetes");
        }}
      />

      <CashPaymentModalSimple
        show={showCashPaymentModal}
        onHide={() => setShowCashPaymentModal(false)}
        companyId={selectedCompany}
        brandId={selectedBrand}
        branchId={selectedBranch}
        onSuccess={(cashPaymentData) => {
          const concept = expenseConcepts.find(
            (c) => c._id === cashPaymentData.expenseConcept
          );

          const tempCashPayment = {
            _id: `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            importeAPagar: cashPaymentData.importeAPagar,
            expenseConcept: {
              _id: cashPaymentData.expenseConcept,
              name: concept?.name || "Concepto no encontrado",
              categoryId: concept?.categoryId
                ? {
                    _id: concept.categoryId._id,
                    name: concept.categoryId.name,
                  }
                : undefined,
            },
            description: cashPaymentData.description,
            createdAt: new Date().toISOString(),
          };

          handleAddTempCashPayment(tempCashPayment);
          setShowCashPaymentModal(false);
        }}
        departmentId={user?.departmentId || undefined}
      />
    </Container>
  );
};

export default InvoicesPackagePage;

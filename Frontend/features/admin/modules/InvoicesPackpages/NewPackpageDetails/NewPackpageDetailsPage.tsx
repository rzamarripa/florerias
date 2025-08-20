"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import {
  getInvoicesPackageById,
  ImportedInvoice,
  InvoicesPackage,
  toggleFacturaAutorizada,
  getInvoiceById,
  enviarPaqueteADireccion,
  createAuthorizationFolio,
  CreateAuthorizationFolioRequest,
  getAuthorizationFoliosByPackage,
  getAuthorizationFolioByNumber,
  AuthorizationFolio,
  redeemAuthorizationFolio,
  getPackageCompanyInfo,
  PackageCompanyInfo,
  getUserById,
  UserInfo,
} from "../services/invoicesPackpage";
import {
  getAllCompanies,
  getBankAccountsByCompany,
  schedulePayment,
  Company,
  BankAccount,
} from "../services/scheduledPayment";
import {
  BudgetItem,
  validatePackageBudgetByExpenseConcept,
  BudgetValidationResult,
} from "../services/budget";
import { getBudgetByCompanyBrandBranch } from "../../InvoicesPackpages/services";
import { BsClipboard } from "react-icons/bs";
import { toast } from "react-toastify";
import { useUserSessionStore } from "@/stores";
import { formatDate } from "date-fns";
import CashPaymentsInPackageTable from "../../cashPayments/components/CashPaymentsInPackageTable";
import {
  authorizeCashPaymentInPackage,
  rejectCashPaymentInPackage,
} from "../../cashPayments/services/cashPayments";
import PackageTimeline from "../components/timeline/PackageTimeline";
import { LucideChevronDown, LucideChevronUp } from "lucide-react";

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
  const packpageId = searchParams.get("packpageId");
  const invoiceId = searchParams.get("invoiceId");

  const [packpage, setPackpage] = useState<InvoicesPackage | null>(null);
  const [singleInvoice, setSingleInvoice] = useState<ImportedInvoice | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"facturas" | "pagosEfectivo">(
    "facturas"
  );
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);
  const [budgetValidationData, setBudgetValidationData] =
    useState<BudgetValidationResult | null>(null);
  const [solicitandoFolio, setSolicitandoFolio] = useState(false);
  const [showFolioModal, setShowFolioModal] = useState(false);
  const [folioIngresado, setFolioIngresado] = useState("");
  const [validandoFolio, setValidandoFolio] = useState(false);
  const [foliosAutorizados, setFoliosAutorizados] = useState<
    AuthorizationFolio[]
  >([]);
  const [todosLosFolios, setTodosLosFolios] = useState<AuthorizationFolio[]>(
    []
  );
  const [folioValidado, setFolioValidado] = useState<AuthorizationFolio | null>(
    null
  );
  const [packageCompanyInfo, setPackageCompanyInfo] =
    useState<PackageCompanyInfo | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [packageCreator, setPackageCreator] = useState<UserInfo | null>(null);
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);

  // Estados para el modal de programación de pagos
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [schedulingPayment, setSchedulingPayment] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const { user } = useUserSessionStore();

  useEffect(() => {
    if (packpageId) {
      loadPackpage();
    } else if (invoiceId) {
      loadSingleInvoice();
    }
  }, [packpageId, invoiceId]);

  // Función para validar presupuesto por concepto de gasto
  const loadBudgetValidationData = async () => {
    if (!packpage?._id || !packageCompanyInfo) {
      console.log("❌ No se puede validar presupuesto:", {
        packpageId: packpage?._id,
        packageCompanyInfo: !!packageCompanyInfo,
      });
      return;
    }

    try {
      console.log(
        "🔍 Validando presupuesto por concepto de gasto para paquete:",
        packpage._id
      );
      const response = await validatePackageBudgetByExpenseConcept(
        packpage._id
      );
      console.log("✅ Validación de presupuesto exitosa:", response);
      console.log("📊 Estructura de la respuesta:", {
        tienePackageId: !!response.packageId,
        tieneMonth: !!response.month,
        requiereAutorizacion: response.requiereAutorizacion,
        cantidadValidaciones: response.validaciones?.length || 0,
        validaciones: response.validaciones,
        resumen: response.resumen,
      });
      setBudgetValidationData(response);
    } catch (error) {
      console.error(
        "❌ Error al validar presupuesto por concepto de gasto:",
        error
      );
      setBudgetValidationData(null);
    }
  };

  // Función para formatear el mes de la fecha de pago
  const getMonthFromPaymentDate = () => {
    if (!packpage?.fechaPago) return "Mes no disponible";

    const fechaPago = new Date(packpage.fechaPago);
    const monthNames = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const monthName = monthNames[fechaPago.getMonth()];
    const year = fechaPago.getFullYear();

    return `Mes de ${monthName} ${year}`;
  };

  // Función para cargar la información de compañía/marca/sucursal
  const loadPackageCompanyInfo = async () => {
    if (!packpage?._id) {
      return;
    }

    try {
      const response = await getPackageCompanyInfo(packpage._id);
      setPackageCompanyInfo(response);

      // Después de obtener la información de compañía, cargar el presupuesto
      if (response) {
        const companyId = response.companyId._id;
        const brandId = response.brandId?._id;
        const branchId = response.branchId?._id;

        if (companyId && brandId && branchId && packpage?.fechaPago) {
          // USAR LA FECHA DE PAGO DEL PAQUETE en lugar de la fecha actual
          const fechaPago = new Date(packpage.fechaPago);
          const year = fechaPago.getFullYear();
          const month = String(fechaPago.getMonth() + 1).padStart(2, "0");
          const monthFormatted = `${year}-${month}`;

          console.log("📅 Cargando presupuesto para fecha del paquete:", {
            fechaPagoPaquete: packpage.fechaPago,
            fechaParseada: fechaPago,
            year,
            month,
            monthFormatted,
          });

          // Pasar routeId si está disponible en la información del paquete
          const budgetParams: {
            companyId: string;
            brandId: string;
            branchId: string;
            month: string;
            routeId?: string;
          } = {
            companyId: companyId.toString(),
            brandId: brandId.toString(),
            branchId: branchId.toString(),
            month: monthFormatted,
          };

          // Si el paquete tiene routeId asignado, incluirlo en los parámetros
          if (packageCompanyInfo?.routeId?._id) {
            budgetParams.routeId = packageCompanyInfo.routeId._id.toString();
            console.log(
              `🎯 Obteniendo presupuestos para ruta específica: ${packageCompanyInfo.routeId.name} (${packageCompanyInfo.routeId._id})`
            );
          } else {
            console.log(
              `📊 Obteniendo presupuestos para sucursal (sin ruta específica)`
            );
          }

          const budgetResponse = await getBudgetByCompanyBrandBranch(
            budgetParams
          );

          setBudgetData(budgetResponse || []);
        }
      }
    } catch (error) {
      console.error(
        "Error al cargar información de compañía del paquete:",
        error
      );
      setPackageCompanyInfo(null);
    }
  };

  // Función para cargar la información del usuario que creó el paquete
  const loadPackageCreator = async () => {
    if (!packpage?.usuario_id) {
      return;
    }

    try {
      const userInfo = await getUserById(packpage.usuario_id);
      setPackageCreator(userInfo);
    } catch (error) {
      console.error(
        "Error al cargar información del creador del paquete:",
        error
      );
      setPackageCreator(null);
    }
  };

  // Función para actualizar el timeline
  const refreshTimeline = () => {
    setTimelineRefreshTrigger((prev) => prev + 1);
  };

  // Cargar datos cuando se cargue el paquete
  useEffect(() => {
    if (packpage) {
      loadPackageCompanyInfo();
      loadFoliosAutorizados();
      loadPackageCreator();
    }
  }, [packpage]);

  // Cargar validación de presupuesto después de obtener la información de compañía
  useEffect(() => {
    if (packageCompanyInfo && packpage) {
      loadBudgetValidationData();
    }
  }, [packageCompanyInfo, packpage]);

  // Validar presupuesto SOLO cuando ambos datos estén disponibles
  useEffect(() => {
    if (budgetData.length > 0 && budgetValidationData && packpage) {
      console.log(
        "🚀 TODOS los datos de presupuesto están disponibles, ejecutando validación final"
      );
      // La validación se ejecuta automáticamente
      console.log(
        "✅ Validación final ejecutada:",
        verificarExcesoPresupuesto()
      );
    }
  }, [budgetData, budgetValidationData, packpage]);

  // Función para cargar folios autorizados del paquete
  const loadFoliosAutorizados = async () => {
    if (!packpage?._id) return;

    try {
      const folios = await getAuthorizationFoliosByPackage(packpage._id);
      const foliosAutorizados = folios.filter(
        (folio) => folio.estatus === "autorizado"
      );
      setFoliosAutorizados(foliosAutorizados);
      setTodosLosFolios(folios); // Guardar todos los folios para la búsqueda
    } catch (error) {
      console.error("Error al cargar folios autorizados:", error);
      setFoliosAutorizados([]);
    }
  };

  // Función para validar folio ingresado
  const validarFolioIngresado = async (): Promise<boolean> => {
    if (!folioIngresado.trim()) {
      toast.error("Por favor ingrese un folio");
      return false;
    }

    if (!packpage?._id) {
      toast.error("Error: ID del paquete no encontrado");
      return false;
    }

    setValidandoFolio(true);
    try {
      const folio = await getAuthorizationFolioByNumber(folioIngresado.trim());

      if (!folio) {
        toast.error("El folio ingresado no existe");
        return false;
      }

      // Comparar los IDs como strings
      const folioPackageId = String(folio.paquete_id);
      const currentPackageId = String(packpage._id);

      if (folioPackageId !== currentPackageId) {
        toast.error("El folio no corresponde a este paquete");
        return false;
      }

      if (folio.estatus !== "autorizado") {
        toast.error(
          `El folio tiene estatus "${folio.estatus}". Solo se aceptan folios autorizados`
        );
        return false;
      }

      toast.success("Folio validado correctamente");
      setFolioValidado(folio); // Guardar el folio validado para canjearlo después
      return true;
    } catch (error) {
      console.error("Error al validar folio:", error);
      toast.error("Error al validar el folio");
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
        console.error("No se encontró el paquete. Response:", response);
        setPackpage(null);
      } else {
        const packpageData = response.data as any;

        // Normalizar datos numéricos
        if (packpageData.facturas) {
          packpageData.facturas = packpageData.facturas.map((f: any) => ({
            ...f,
            importeAPagar: parseFloat(f.importeAPagar || 0),
            importePagado: parseFloat(f.importePagado || 0),
          }));
        }

        packpageData.totalImporteAPagar = parseFloat(
          packpageData.totalImporteAPagar || 0
        );
        packpageData.totalPagado = parseFloat(packpageData.totalPagado || 0);

        // Verificar si hay duplicados por UUID
        const uuids = packpageData.facturas?.map((f: any) => f.uuid) || [];
        const uuidsUnicos = [...new Set(uuids)];
        if (uuids.length !== uuidsUnicos.length) {
        }
        setPackpage(packpageData);
      }
    } catch (error) {
      console.error("Error al cargar el paquete:", error);
      toast.error("Error al cargar el paquete");
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
      console.error("Error loading invoice:", error);
      toast.error("Error al cargar la factura");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopied(uuid);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleToggleAutorizada = async (
    facturaId: string,
    nuevoEstado: boolean
  ) => {
    try {
      const factura = packpage?.facturas.find((f) => f._id === facturaId);
      if (!factura) return;
      if (factura.autorizada === nuevoEstado) {
        return;
      }

      const result = await toggleFacturaAutorizada(
        facturaId,
        nuevoEstado,
        packpage?._id
      );

      if (
        result &&
        result.success &&
        typeof (result.data as any).autorizada !== "undefined"
      ) {
        // Actualizar el estado local con los datos de la respuesta
        setPackpage((prev) => {
          if (!prev) return prev;

          const facturasActualizadas = prev.facturas.map((f) =>
            f._id === facturaId
              ? {
                  ...f,
                  autorizada: (result.data as any).autorizada,
                  pagoRechazado: (result.data as any).pagoRechazado,
                  importePagado: (result.data as any).importePagado,
                  estadoPago: (result.data as any).estadoPago,
                  esCompleta: (result.data as any).esCompleta,
                }
              : f
          );

          // Recalcular totales
          const facturasAutorizadas = facturasActualizadas.filter(
            (f) => f.autorizada === true
          );

          // Total pagado: solo facturas autorizadas
          const totalPagado = facturasAutorizadas.reduce(
            (sum, f) => sum + (f.importePagado || 0),
            0
          );

          // Total importe a pagar: solo facturas autorizadas (como se guarda en BD)
          const totalImporteAPagar = facturasAutorizadas.reduce(
            (sum, f) => sum + (f.importeAPagar || 0),
            0
          );

          return {
            ...prev,
            facturas: facturasActualizadas,
            totalPagado,
            totalImporteAPagar,
          };
        });

        if (!(result.data as any).autorizada) {
          toast.info(
            "Factura rechazada. Los datos de pago se han reiniciado y puede ser pagada nuevamente en otro paquete."
          );
        } else {
          toast.success("Estado de autorización actualizado correctamente.");
        }
      } else {
        toast.error("Error inesperado al cambiar el estado de autorización");
      }
    } catch (error) {
      console.error("Error en toggle:", error);
      toast.error("Error al cambiar el estado de autorización");
    }
  };

  const handleEnviarADireccion = async () => {
    if (!packpage?._id) {
      toast.error("No se puede enviar el paquete. ID no encontrado.");
      return;
    }

    // Si el paquete ya está enviado, manejar programación de pago
    if (paqueteEnviado) {
      await handleProgramarPago();
      return;
    }

    // Verificar si hay exceso de presupuesto
    const excesoInfo = verificarExcesoPresupuesto();
    if (excesoInfo.excede) {
      // Si hay exceso, verificar si hay folios pendientes o autorizados
      const folioMasReciente = todosLosFolios.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (
        folioMasReciente &&
        (folioMasReciente.estatus === "pendiente" ||
          folioMasReciente.estatus === "autorizado")
      ) {
        // Si hay folio pendiente o autorizado, mostrar modal de folio directamente
        setShowFolioModal(true);
        return;
      } else if (foliosAutorizados.length === 0) {
        // Si no hay folios autorizados, mostrar error
        toast.error(
          "No se puede enviar el paquete. Presupuesto excedido y no hay folios autorizados."
        );
        return;
      }
    }

    // Si no hay exceso o hay folios autorizados, mostrar modal de confirmación
    setShowConfirmationModal(true);
  };

  const handleConfirmarEnvio = async () => {
    setShowConfirmationModal(false);
    await enviarPaqueteATesoreria();
  };

  const handleProgramarPago = async () => {
    if (!packpage?._id) {
      toast.error("No se puede programar el pago. ID no encontrado.");
      return;
    }

    try {
      setLoadingCompanies(true);
      const companiesData = await getAllCompanies();
      setCompanies(companiesData);

      // Set default company if packageCompanyInfo is available
      if (packageCompanyInfo?.companyId?._id) {
        setSelectedCompanyId(packageCompanyInfo.companyId._id);
        // Load bank accounts for the default company
        try {
          setLoadingBankAccounts(true);
          const bankAccountsData = await getBankAccountsByCompany(
            packageCompanyInfo.companyId._id
          );
          setBankAccounts(bankAccountsData);
        } catch (error) {
          console.error(
            "Error al cargar cuentas bancarias por defecto:",
            error
          );
        } finally {
          setLoadingBankAccounts(false);
        }
      }

      setShowScheduleModal(true);
    } catch (error) {
      console.error("Error al cargar razones sociales:", error);
      toast.error("Error al cargar las razones sociales");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedBankAccountId("");
    setBankAccounts([]);

    if (!companyId) return;

    try {
      setLoadingBankAccounts(true);
      const bankAccountsData = await getBankAccountsByCompany(companyId);
      setBankAccounts(bankAccountsData);
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
      toast.error("Error al cargar las cuentas bancarias");
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const handleSchedulePayment = async () => {
    if (!packpage?._id || !selectedCompanyId || !selectedBankAccountId) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      setSchedulingPayment(true);
      const response = await schedulePayment({
        packageId: packpage._id,
        companyId: selectedCompanyId,
        bankAccountId: selectedBankAccountId,
      });

      if (response.success) {
        toast.success("Pago programado exitosamente");
        setPackpage((prev) =>
          prev ? { ...prev, estatus: "Programado" } : null
        );
        setShowScheduleModal(false);
        setSelectedCompanyId("");
        setSelectedBankAccountId("");
        setBankAccounts([]);
        setCompanies([]);

        // Actualizar timeline
        refreshTimeline();
      } else {
        toast.error(response.message || "Error al programar el pago");
      }
    } catch (error) {
      console.error("Error al programar pago:", error);
      toast.error("Error al programar el pago");
    } finally {
      setSchedulingPayment(false);
    }
  };

  const enviarPaqueteATesoreria = async () => {
    if (!packpage?._id) return;

    try {
      // Si hay un folio validado, canjearlo primero
      if (folioValidado) {
        try {
          await redeemAuthorizationFolio(folioValidado._id);
          await loadFoliosAutorizados(); // Recargar folios para actualizar estado
        } catch (error) {
          console.error("Error al canjear folio:", error);
          toast.error("Error al canjear el folio de autorización");
          return;
        }
      }

      // Enviar el paquete
      const result = await enviarPaqueteADireccion(packpage._id);
      if (
        result &&
        result.success &&
        result.data &&
        result.data.estatus === "Enviado"
      ) {
        toast.success("Paquete enviado a tesorería correctamente");
        setPackpage((prev) => (prev ? { ...prev, estatus: "Enviado" } : null));
        setShowFolioModal(false);
        setFolioIngresado("");
        setFolioValidado(null); // Limpiar el folio validado

        // Actualizar timeline
        refreshTimeline();
      } else {
        toast.error("Error al enviar el paquete a tesorería");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al enviar el paquete a tesorería");
    }
  };

  const handleValidarYEnviar = async () => {
    const folioValido = await validarFolioIngresado();
    if (folioValido) {
      // Obtener el folio validado y guardarlo para usarlo en la confirmación
      const folioValidadoActual = await getAuthorizationFolioByNumber(
        folioIngresado.trim()
      );
      setFolioValidado(folioValidadoActual);

      // Cerrar modal de folio y mostrar modal de confirmación
      setShowFolioModal(false);
      setShowConfirmationModal(true);
    }
  };

  const handleSolicitarFolio = async () => {
    if (!packpage?._id || !user?._id) {
      toast.error("No se puede solicitar el folio. Datos faltantes.");
      return;
    }

    setSolicitandoFolio(true);
    try {
      const excesoInfo = verificarExcesoPresupuesto();
      const now = new Date();
      const folioNumber = `AUTH-${packpage.folio}-${now.getTime()}`;

      // Construir motivo detallado
      let motivo = "";

      if (excesoInfo.excedePresupuestoTotal) {
        motivo += `Exceso de presupuesto total por $${excesoInfo.diferencia.toLocaleString(
          "es-MX",
          { minimumFractionDigits: 2 }
        )}`;
      }

      if (
        excesoInfo.excedePresupuestoConcepto &&
        excesoInfo.validacionConcepto
      ) {
        const conceptosExcedidos =
          excesoInfo.validacionConcepto.validaciones.filter((v) => v.excede);
        if (motivo) motivo += ". ";
        motivo += `${conceptosExcedidos.length} concepto(s) de gasto exceden su presupuesto: `;
        motivo += conceptosExcedidos
          .map(
            (c) =>
              `${c.concepto.categoryName} - ${
                c.concepto.name
              } (exceso: $${c.diferencia.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })})`
          )
          .join(", ");
      }

      const folioData: CreateAuthorizationFolioRequest = {
        paquete_id: packpage._id,
        motivo,
        usuario_id: user._id,
        fecha: now.toISOString(),
        fechaFolioAutorizacion: now.toISOString(),
        folio: folioNumber,
      };

      const response = await createAuthorizationFolio(folioData);

      if (response && response.success) {
        toast.success(`Folio de autorización creado exitosamente`);
        // Recargar folios autorizados
        await loadFoliosAutorizados();
      } else {
        toast.error("Error al crear el folio de autorización");
      }
    } catch (error: any) {
      console.error("Error al solicitar folio:", error);
      toast.error(
        error?.message || "Error al solicitar el folio de autorización"
      );
    } finally {
      setSolicitandoFolio(false);
    }
  };

  // Función para verificar si hay pagos pendientes (facturas o pagos en efectivo)
  const hayPagosPendientes = () => {
    // Verificar facturas pendientes
    const facturasPendientes =
      packpage?.facturas?.some(
        (factura: ImportedInvoice) =>
          factura.autorizada === null || factura.autorizada === undefined
      ) || false;

    // Verificar pagos en efectivo pendientes
    const pagosEfectivoPendientes =
      packpage?.pagosEfectivo?.some(
        (pago: any) => pago.autorizada === null || pago.autorizada === undefined
      ) || false;

    return facturasPendientes || pagosEfectivoPendientes;
  };

  // Verificar si el usuario es de tesorería
  const esUsuarioTesorería = user?.department?.toLowerCase() === "tesorería";

  // Verificar si el paquete está enviado
  const paqueteEnviado = packpage?.estatus === "Enviado";

  // Verificar si el paquete está programado
  const paqueteProgramado = packpage?.estatus === "Programado";

  // Determinar si el botón debe estar deshabilitado
  const botonDeshabilitado = () => {
    if (paqueteProgramado) {
      // Si el paquete está programado, no se muestra ningún botón
      return true;
    } else if (paqueteEnviado) {
      // Si el paquete está enviado, solo usuarios de tesorería pueden programar pago
      return !esUsuarioTesorería;
    } else {
      // Si el paquete no está enviado ni programado (estado Borrador)
      // Solo usuarios NO de tesorería pueden enviar a tesorería
      return (
        hayPagosPendientes() ||
        (verificarExcesoPresupuesto().excede &&
          foliosAutorizados.length === 0) ||
        esUsuarioTesorería
      );
    }
  };

  // Determinar si se debe mostrar el botón
  const mostrarBoton = () => {
    if (paqueteProgramado) {
      // Si el paquete está programado, no mostrar ningún botón
      return false;
    } else if (paqueteEnviado) {
      // Si el paquete está enviado, solo mostrar botón de programar pago para usuarios de tesorería
      return esUsuarioTesorería;
    } else {
      // Si el paquete está en estado Borrador, mostrar botón de enviar a tesorería solo para usuarios NO de tesorería
      return !esUsuarioTesorería && !hayPagosPendientes();
    }
  };

  // Determinar el texto del botón
  const textoBoton = paqueteEnviado ? "Programar Pago" : "Enviar a Tesorería";

  // Función para calcular el total de visualización (autorizadas + pendientes)
  const calcularTotalVisualizacion = () => {
    if (!packpage?.facturas) return 0;
    const facturasNoRechazadas = packpage.facturas.filter(
      (f) => f.autorizada !== false
    ); // autorizadas + pendientes
    return facturasNoRechazadas.reduce(
      (sum, f) => sum + toNumber(f.importeAPagar),
      0
    );
  };

  // Función para calcular el total pagado de visualización (autorizadas + pendientes)
  const calcularTotalPagadoVisualizacion = () => {
    if (!packpage?.facturas) return 0;
    const facturasNoRechazadas = packpage.facturas.filter(
      (f) => f.autorizada !== false
    ); // autorizadas + pendientes
    return facturasNoRechazadas.reduce(
      (sum, f) => sum + toNumber(f.importePagado),
      0
    );
  };

  // Función helper para convertir valores a números
  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;

    // Manejar objetos con formato $numberDecimal de MongoDB
    if (typeof value === "object" && value !== null) {
      if (value.$numberDecimal) {
        return parseFloat(value.$numberDecimal) || 0;
      }
      if (value._bsontype === "Decimal128") {
        return parseFloat(value.toString()) || 0;
      }
    }

    return 0;
  };

  // Función para calcular totales de facturas
  const calcularTotalesFacturas = () => {
    if (!packpage?.facturas)
      return { total: 0, pagado: 0, pendiente: 0, cantidad: 0 };

    const facturasNoRechazadas = packpage.facturas.filter(
      (f) => f.autorizada !== false
    );
    const total = facturasNoRechazadas.reduce(
      (sum, f) => sum + toNumber(f.importeAPagar),
      0
    );
    const pagado = facturasNoRechazadas.reduce(
      (sum, f) => sum + toNumber(f.importePagado),
      0
    );
    const pendiente = total - pagado;

    return {
      total,
      pagado,
      pendiente,
      cantidad: facturasNoRechazadas.length,
    };
  };

  // Función para calcular totales de pagos en efectivo
  const calcularTotalesPagosEfectivo = () => {
    if (!packpage?.pagosEfectivo)
      return { total: 0, pagado: 0, pendiente: 0, cantidad: 0 };

    const pagosNoRechazados = packpage.pagosEfectivo.filter(
      (p) => p.autorizada !== false
    );
    const total = pagosNoRechazados.reduce(
      (sum, p) => sum + toNumber(p.importeAPagar),
      0
    );
    const pagado = pagosNoRechazados.reduce(
      (sum, p) => sum + toNumber(p.importePagado),
      0
    );
    const pendiente = total - pagado;

    return {
      total,
      pagado,
      pendiente,
      cantidad: pagosNoRechazados.length,
    };
  };

  // Función para calcular el presupuesto total del mes
  const calcularPresupuestoTotal = () => {
    if (!Array.isArray(budgetData)) return 0;

    const total = budgetData.reduce((acc, budget) => {
      return acc + (budget.assignedAmount || 0);
    }, 0);

    return total;
  };

  const verificarExcesoPresupuesto = () => {
    if (budgetData.length === 0) {
      return {
        presupuestoTotal: 0,
        totalPagadoPaquete: 0,
        excede: false,
        excedePresupuestoTotal: false,
        excedePresupuestoConcepto: false,
        diferencia: 0,
        validacionConcepto: null,
      };
    }

    const presupuestoTotal = calcularPresupuestoTotal();
    const totalPagadoPaquete =
      calcularTotalesFacturas().pagado + calcularTotalesPagosEfectivo().pagado;

    const excedePresupuestoTotal = totalPagadoPaquete > presupuestoTotal;
    const validacionConceptos = validarPresupuestosPorConcepto();
    const excedePresupuestoConcepto = validacionConceptos.excede;

    const requiereAutorizacion =
      excedePresupuestoTotal || excedePresupuestoConcepto;

    return {
      presupuestoTotal,
      totalPagadoPaquete,
      excede: requiereAutorizacion, // Usar la nueva variable
      excedePresupuestoTotal,
      excedePresupuestoConcepto,
      diferencia: totalPagadoPaquete - presupuestoTotal,
      validacionConcepto: budgetValidationData,
    };
  };

  const validarPresupuestosPorConcepto = () => {
    if (!packpage || budgetData.length === 0) {
      return { excede: false, conceptosExcedidos: [] };
    }

    // Usar un Map para consolidar pagos por concepto de gasto
    const conceptosMap = new Map();
    let hayExceso = false;

    // VALIDAR FACTURAS
    console.log("=== DEBUG VALIDACIÓN FACTURAS ===");
    if (packpage.facturas && packpage.facturas.length > 0) {
      for (const factura of packpage.facturas) {
        const conceptoId = (factura as any).conceptoGasto?.id;
        const conceptoNombre =
          (factura as any).conceptoGasto?.name || "Sin nombre";
        const montoPago = factura.importePagado || 0;

        console.log(`FACTURA ID: ${factura._id}`);
        console.log(`  - Concepto ID: ${conceptoId}`);
        console.log(`  - Concepto Nombre: ${conceptoNombre}`);
        console.log(`  - Monto Pago: $${montoPago}`);

        if (!conceptoId) {
          console.log(`  - ❌ No tiene concepto de gasto`);
          continue;
        }

        // Agregar o actualizar el concepto en el Map
        if (!conceptosMap.has(conceptoId)) {
          conceptosMap.set(conceptoId, {
            conceptoId,
            nombreConcepto: conceptoNombre,
            totalPagado: 0,
            pagos: [],
          });
        }

        const conceptoData = conceptosMap.get(conceptoId);
        conceptoData.totalPagado += montoPago;
        conceptoData.pagos.push({
          tipo: "factura",
          id: factura._id,
          monto: montoPago,
        });

        console.log(
          `  - Total acumulado para concepto ${conceptoNombre}: $${conceptoData.totalPagado}`
        );
        console.log("---");
      }
    } else {
      console.log("No hay facturas en el paquete");
    }

    // VALIDAR PAGOS EN EFECTIVO
    if (packpage.pagosEfectivo && packpage.pagosEfectivo.length > 0) {
      for (const pago of packpage.pagosEfectivo) {
        const conceptoId = pago.expenseConcept?._id;
        const conceptoNombre = pago.expenseConcept?.name || "Sin nombre";
        const montoPago = toNumber(pago.importeAPagar || 0);

        if (!conceptoId) continue;

        console.log(`EFECTIVO: ${conceptoNombre} | Pago: $${montoPago}`);

        // Agregar o actualizar el concepto en el Map
        if (!conceptosMap.has(conceptoId)) {
          conceptosMap.set(conceptoId, {
            conceptoId,
            nombreConcepto: conceptoNombre,
            totalPagado: 0,
            pagos: [],
          });
        }

        const conceptoData = conceptosMap.get(conceptoId);
        conceptoData.totalPagado += montoPago;
        conceptoData.pagos.push({
          tipo: "efectivo",
          id: pago._id,
          monto: montoPago,
        });

        console.log(
          `  - Total acumulado para concepto ${conceptoNombre}: $${conceptoData.totalPagado}`
        );
      }
    }

    // Ahora validar cada concepto consolidado contra su presupuesto
    const conceptosExcedidos: any[] = [];

    for (const [conceptoId, conceptoData] of conceptosMap) {
      // FIX: Acceder correctamente al _id del objeto poblado expenseConceptId
      const presupuesto = budgetData.find((budget) => {
        const budgetConceptId =
          (budget as any).expenseConceptId?._id ||
          (budget as any).expenseConceptId;
        return budgetConceptId?.toString() === conceptoId.toString();
      });

      if (presupuesto) {
        const montoPresupuesto = (presupuesto as any).assignedAmount || 0;
        const excede = conceptoData.totalPagado > montoPresupuesto;

        console.log(`💰 Validación concepto ${conceptoData.nombreConcepto}:`);
        console.log(`  - Presupuesto: $${montoPresupuesto}`);
        console.log(`  - Total Pagado: $${conceptoData.totalPagado}`);
        console.log(`  - ¿Excede? ${excede}`);

        if (excede) {
          console.log(
            `  - 🚨 EXCEDE POR: $${conceptoData.totalPagado - montoPresupuesto}`
          );
          hayExceso = true;
          conceptosExcedidos.push({
            conceptoId,
            nombreConcepto: conceptoData.nombreConcepto,
            presupuesto: montoPresupuesto,
            totalPagado: conceptoData.totalPagado,
            diferencia: conceptoData.totalPagado - montoPresupuesto,
            pagos: conceptoData.pagos,
          });
        } else {
          console.log(`  - ✅ No excede`);
        }
      } else {
        console.log(
          `❌ No se encontró presupuesto para concepto ${conceptoData.nombreConcepto} (ID: ${conceptoId})`
        );
        console.log(
          `  - Presupuestos disponibles:`,
          budgetData.map((b) => ({
            conceptoId:
              (b as any).expenseConceptId?._id || (b as any).expenseConceptId,
            conceptoName: (b as any).expenseConceptId?.name || "N/A",
            monto: (b as any).assignedAmount,
          }))
        );
      }
    }

    return { excede: hayExceso, conceptosExcedidos };
  };

  // Interfaz para el mensaje del folio
  interface MensajeFolio {
    tipo: "exceso" | "folio";
    variant: "warning" | "info" | "success" | "danger";
    titulo: string;
    mensaje: string;
    detalles?: string[];
    diferencia?: number;
    validacionConcepto?: BudgetValidationResult | null;
    folio?: string;
  }

  // Función para determinar qué mostrar según el estado de los folios
  const determinarMensajeFolio = (): MensajeFolio | null => {
    const excesoInfo = verificarExcesoPresupuesto();

    // Si no hay exceso, no mostrar nada
    if (!excesoInfo.excede) {
      console.log("✅ No hay exceso de presupuesto, no mostrar alerta");
      return null;
    }

    console.log("🚨 HAY EXCESO DE PRESUPUESTO:", {
      excedeTotal: excesoInfo.excedePresupuestoTotal,
      excedeConcepto: excesoInfo.excedePresupuestoConcepto,
      diferencia: excesoInfo.diferencia,
    });

    // Si hay exceso pero no hay folios, mostrar alerta de exceso
    if (todosLosFolios.length === 0) {
      const titulo = "Presupuesto excedido";
      const mensaje = "Por favor solicite un folio de autorización.";
      const detalles: string[] = [];

      if (excesoInfo.excedePresupuestoTotal) {
        detalles.push(
          `Presupuesto total del mes excedido por $${excesoInfo.diferencia.toLocaleString(
            "es-MX",
            { minimumFractionDigits: 2 }
          )}`
        );
      }

      if (excesoInfo.excedePresupuestoConcepto) {
        // USAR LA VALIDACIÓN DEL FRONTEND QUE SÍ FUNCIONA
        const validacionConceptos = validarPresupuestosPorConcepto();

        if (
          validacionConceptos.excede &&
          validacionConceptos.conceptosExcedidos.length > 0
        ) {
          detalles.push(
            `${validacionConceptos.conceptosExcedidos.length} concepto(s) de gasto exceden su presupuesto`
          );

          // Agregar detalles específicos de cada concepto excedido - SIMPLIFICADO
          validacionConceptos.conceptosExcedidos.forEach((concepto) => {
            detalles.push(
              `• ${
                concepto.nombreConcepto
              }: Exceso $${concepto.diferencia.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}`
            );
          });

          // Calcular exceso total por conceptos
          const excesoTotalConceptos =
            validacionConceptos.conceptosExcedidos.reduce(
              (sum, concepto) => sum + concepto.diferencia,
              0
            );

          if (excesoTotalConceptos > 0) {
            detalles.push(
              `Exceso total por conceptos: $${excesoTotalConceptos.toLocaleString(
                "es-MX",
                { minimumFractionDigits: 2 }
              )}`
            );
          }
        }
      }

      const mensajeFinal: MensajeFolio = {
        tipo: "exceso",
        variant: "warning",
        titulo,
        mensaje,
        detalles,
        diferencia: excesoInfo.diferencia,
        validacionConcepto: excesoInfo.validacionConcepto,
      };

      console.log("🚨 ALERT FINAL GENERADO:", mensajeFinal);

      return mensajeFinal;
    }

    // Si hay folios, mostrar el estado del folio más reciente
    const folioMasReciente = todosLosFolios.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (folioMasReciente.estatus === "pendiente") {
      return {
        tipo: "folio",
        variant: "info",
        titulo: "Folio de autorización generado",
        mensaje: "Pendiente de autorización",
        folio: folioMasReciente.folio,
      };
    }

    if (folioMasReciente.estatus === "autorizado") {
      return {
        tipo: "folio",
        variant: "success",
        titulo: "Folio de autorización generado",
        mensaje: "Autorizado y listo para canjear",
        folio: folioMasReciente.folio,
      };
    }

    if (folioMasReciente.estatus === "rechazado") {
      return {
        tipo: "folio",
        variant: "danger",
        titulo: "Folio de autorización generado",
        mensaje: "Folio no autorizado, no es posible enviar a tesorería",
        folio: folioMasReciente.folio,
      };
    }

    return null;
  };

  // Handler para autorizar pago en efectivo
  const handleAuthorizeCashPayment = async (pagoId: string) => {
    try {
      if (!packpage) return;

      const pago = packpage.pagosEfectivo?.find((p) => p._id === pagoId);
      if (!pago) return;
      if (pago.autorizada === true) return;

      await authorizeCashPaymentInPackage(packpage._id, pagoId);

      // Actualizar el estado local
      setPackpage((prev) => {
        if (!prev) return prev;

        const pagosActualizados =
          prev.pagosEfectivo?.map((p) =>
            p._id === pagoId
              ? {
                  ...p,
                  autorizada: true,
                  pagoRechazado: false,
                  estadoPago: 2,
                  esCompleta: true,
                  registrado: 1,
                  pagado: 1,
                  descripcionPago: "Pago autorizado",
                  fechaRevision: new Date().toISOString(),
                  importePagado: p.importeAPagar,
                }
              : p
          ) || [];

        // Recalcular totales correctamente
        const facturasAutorizadas =
          prev.facturas?.filter((f) => f.autorizada === true) || [];
        const pagosEfectivoAutorizados = pagosActualizados.filter(
          (p) => p.autorizada === true
        );

        const totalPagadoFacturas = facturasAutorizadas.reduce(
          (sum, f) => sum + (f.importePagado || 0),
          0
        );
        const totalPagadoPagosEfectivo = pagosEfectivoAutorizados.reduce(
          (sum, p) => sum + (p.importePagado || 0),
          0
        );

        return {
          ...prev,
          pagosEfectivo: pagosActualizados,
          totalPagado: totalPagadoFacturas + totalPagadoPagosEfectivo,
        };
      });

      toast.success("Pago autorizado correctamente");
      refreshTimeline();
    } catch (error) {
      console.error("Error al autorizar pago en efectivo:", error);
      toast.error("Error al autorizar el pago");
    }
  };

  // Handler para rechazar pago en efectivo
  const handleRejectCashPayment = async (pagoId: string) => {
    try {
      if (!packpage) return;

      const pago = packpage.pagosEfectivo?.find((p) => p._id === pagoId);
      if (!pago) return;
      if (pago.autorizada === false && pago.pagoRechazado === true) return;

      await rejectCashPaymentInPackage(packpage._id, pagoId);

      // Actualizar el estado local
      setPackpage((prev) => {
        if (!prev) return prev;

        const pagosActualizados =
          prev.pagosEfectivo?.map((p) =>
            p._id === pagoId
              ? {
                  ...p,
                  autorizada: false,
                  pagoRechazado: true,
                  estadoPago: 0,
                  esCompleta: false,
                  registrado: 1,
                  pagado: 0,
                  descripcionPago: "Pago rechazado",
                  fechaRevision: new Date().toISOString(),
                  importePagado: 0,
                }
              : p
          ) || [];

        // Recalcular totales correctamente
        const facturasAutorizadas =
          prev.facturas?.filter((f) => f.autorizada === true) || [];
        const pagosEfectivoAutorizados = pagosActualizados.filter(
          (p) => p.autorizada === true
        );

        const totalPagadoFacturas = facturasAutorizadas.reduce(
          (sum, f) => sum + (f.importePagado || 0),
          0
        );
        const totalPagadoPagosEfectivo = pagosEfectivoAutorizados.reduce(
          (sum, p) => sum + (p.importePagado || 0),
          0
        );

        return {
          ...prev,
          pagosEfectivo: pagosActualizados,
          totalPagado: totalPagadoFacturas + totalPagadoPagosEfectivo,
        };
      });

      toast.success("Pago rechazado correctamente");
      refreshTimeline();
    } catch (error) {
      console.error("Error al rechazar pago en efectivo:", error);
      toast.error("Error al rechazar el pago");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <div className="mt-2">
          {packpageId ? "Cargando paquete..." : "Cargando factura..."}
        </div>
      </div>
    );
  }
  if (!packpage && !singleInvoice) {
    return (
      <Alert variant="danger">No se encontró el elemento solicitado.</Alert>
    );
  }

  // Si es una factura individual
  if (singleInvoice) {
    return (
      <div className="container-fluid py-4">
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <div className="d-flex align-items-center mb-2">
              <h4 className="fw-bold mb-0 me-3">
                Detalle de Factura:{" "}
                <span className="text-primary">{singleInvoice.uuid}</span>
              </h4>
              <Badge bg="secondary" className="ms-2">
                MongoDB
              </Badge>
            </div>
            <div className="mb-2 text-muted" style={{ fontSize: "1rem" }}>
              <span className="me-2">
                Proveedor: {singleInvoice.nombreEmisor}
              </span>
              <span className="me-2">RFC: {singleInvoice.rfcEmisor}</span>
            </div>
            <div className="d-flex justify-content-between">
              <div className="d-flex align-items-center mb-3">
                <span className="me-2">Estatus:</span>
                <Badge bg="info" className="me-2">
                  {singleInvoice.estatus === 1 ? "Vigente" : "Cancelado"}
                </Badge>
                <Badge bg={singleInvoice.autorizada ? "success" : "warning"}>
                  {singleInvoice.autorizada ? "Autorizada" : "Pendiente"}
                </Badge>
              </div>
              <div className="d-flex gap-2 mb-3">
                <Button variant="outline-success" size="sm">
                  Descargar PDF
                </Button>
                <Button variant="primary" size="sm">
                  Ver XML
                </Button>
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
                    <span className="font-monospace me-2">
                      {singleInvoice.uuid}
                    </span>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleCopy(singleInvoice.uuid)}
                    >
                      <BsClipboard className="me-1" />
                      {copied === singleInvoice.uuid ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
                <div className="mb-2">
                  <strong>Fecha de Emisión:</strong>
                  <span className="ms-2">
                    {singleInvoice.fechaEmision
                      ? new Date(singleInvoice.fechaEmision).toLocaleDateString(
                          "es-MX"
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Tipo de Comprobante:</strong>
                  <Badge bg="info" className="ms-2">
                    {singleInvoice.tipoComprobante}
                  </Badge>
                </div>
                <div className="mb-2">
                  <strong>Estatus:</strong>
                  <Badge
                    bg={singleInvoice.estatus === 1 ? "success" : "danger"}
                    className="ms-2"
                  >
                    {singleInvoice.estatus === 1 ? "Vigente" : "Cancelado"}
                  </Badge>
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold mb-3">Información Financiera</h6>
                <div className="mb-2">
                  <strong>Total a Pagar:</strong>
                  <span className="ms-2 text-primary fw-bold">
                    $
                    {toNumber(singleInvoice.importeAPagar).toLocaleString(
                      "es-MX",
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Importe Pagado:</strong>
                  <span className="ms-2 text-success fw-bold">
                    $
                    {toNumber(singleInvoice.importePagado).toLocaleString(
                      "es-MX",
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Saldo Pendiente:</strong>
                  <span className="ms-2 text-warning fw-bold">
                    $
                    {(
                      toNumber(singleInvoice.importeAPagar) -
                      toNumber(singleInvoice.importePagado)
                    ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Porcentaje Pagado:</strong>
                  <span className="ms-2">
                    {Math.round(
                      (toNumber(singleInvoice.importePagado) /
                        toNumber(singleInvoice.importeAPagar)) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => router.back()}>
            Volver
          </Button>
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
              <h3
                className="fw-bold mb-0 me-3"
                style={{ letterSpacing: "0.5px" }}
              >
                Paquete Folio:{" "}
                <span className="text-primary">{packpage.folio}</span>
              </h3>
            </div>
            {mostrarBoton() && (
              <Button
                variant="primary"
                onClick={handleEnviarADireccion}
                disabled={botonDeshabilitado()}
                title={
                  paqueteEnviado && !esUsuarioTesorería
                    ? "Solo usuarios de Tesorería pueden programar pagos"
                    : esUsuarioTesorería && !paqueteEnviado
                    ? "Los usuarios de Tesorería no pueden enviar paquetes a Tesorería"
                    : ""
                }
              >
                <i
                  className={`bi ${
                    paqueteEnviado ? "bi-calendar-check" : "bi-send"
                  } me-1`}
                ></i>
                {textoBoton}
              </Button>
            )}
          </div>

          <div className=" text-md" style={{ fontSize: "0.8rem" }}>
            {packageCreator ? (
              <div>
                <p className="mb-0 fw-bold">
                  Creado por:{" "}
                  <span className="fw-semibold text-uppercase">
                    {packageCreator.profile.fullName}
                  </span>
                </p>
                <p className="mb-2 fw-bold">
                  Departamento:
                  {packpage.departamento && (
                    <span className="fw-semibold text-uppercase ">
                      {" "}
                      {packpage.departamento}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-0 fw-bold">
                  Creado por:{" "}
                  <span className="fw-semibold text-uppercase">
                    Cargando...
                  </span>
                </p>
                <p className="mb-2 fw-bold">
                  Departamento:
                  {packpage.departamento && (
                    <span className="fw-semibold text-uppercase ">
                      {" "}
                      {packpage.departamento}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
          {/* Comentario, estatus y empresa */}
          <Card className="mb-2 border-0 shadow-sm bg-light">
            <Card.Body className="py-3 px-4 d-flex flex-column flex-md-row align-items-md-start justify-content-between">
              <div className="flex-grow-1 me-md-4">
                {/* Comentario y fecha de pago */}
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="me-3"
                    style={{ fontSize: "1.7rem", color: "#0d6efd" }}
                  >
                    <i className="bi bi-chat-left-text"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-primary">
                      Comentario: {packpage.comentario}
                    </div>
                    <div className="text-dark">
                      Fecha Pago:{" "}
                      {formatDate(packpage.fechaPago.toString(), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>

                {/* Estatus */}
                <div className="d-flex align-items-center">
                  <span className="fw-semibold text-muted me-2">
                    Estatus actual:
                  </span>
                  <Badge bg="info" className="me-2">
                    {packpage.estatus}
                  </Badge>
                  <Badge bg="primary">Borrador → Tesorería</Badge>
                </div>
              </div>

              {/* Información de la empresa - a la derecha */}
              {packageCompanyInfo && (
                <div className="d-flex align-items-center mt-3 mt-md-0">
                  <div
                    className="me-3"
                    style={{ fontSize: "1.5rem", color: "#0d6efd" }}
                  >
                    <i className="bi bi-building"></i>
                  </div>
                  <div className="text-end text-md-end">
                    <div
                      className="fw-bold text-primary"
                      style={{ fontSize: "1.1rem" }}
                    >
                      {packageCompanyInfo.companyId.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: "1rem" }}>
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
                    <div
                      className="me-3"
                      style={{ fontSize: "1.5rem", color: "#dc3545" }}
                    >
                      <i className="bi bi-wallet2"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-danger">Presupuestos</div>
                      <div className="text-muted small">
                        {getMonthFromPaymentDate()}
                      </div>
                      <div className="text-muted small">
                        Total: $
                        {calcularPresupuestoTotal().toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="fw-bold text-danger">
                        Disponible: $
                        {calcularPresupuestoTotal()
                          ? (
                              calcularPresupuestoTotal() -
                              (calcularTotalesFacturas().total +
                                calcularTotalesPagosEfectivo().total)
                            ).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })
                          : "0.00"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="d-flex align-items-center">
                    <div
                      className="me-3"
                      style={{ fontSize: "1.5rem", color: "#17a2b8" }}
                    >
                      <i className="bi bi-file-earmark-text"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-info">Facturas</div>
                      <div className="text-muted small">
                        {calcularTotalesFacturas().cantidad} facturas
                      </div>
                      <div className="fw-bold text-primary">
                        $
                        {calcularTotalPagadoVisualizacion().toLocaleString(
                          "es-MX",
                          { minimumFractionDigits: 2 }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="d-flex align-items-center">
                    <div
                      className="me-3"
                      style={{ fontSize: "1.5rem", color: "#28a745" }}
                    >
                      <i className="bi bi-cash-coin"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-success">
                        Pagos en efectivo
                      </div>
                      <div className="text-muted small">
                        {calcularTotalesPagosEfectivo().cantidad} pagos
                      </div>
                      <div className="fw-bold text-primary">
                        $
                        {calcularTotalesPagosEfectivo().total.toLocaleString(
                          "es-MX",
                          { minimumFractionDigits: 2 }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="me-3"
                      style={{ fontSize: "1.5rem", color: "#fd7e14" }}
                    >
                      <i className="bi bi-credit-card"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-warning">Total a pagar</div>
                      <div className="text-muted small">
                        Suma de importes a pagar
                      </div>
                      <div className="fw-bold text-success">
                        $
                        {(
                          calcularTotalPagadoVisualizacion() +
                          calcularTotalesPagosEfectivo().total
                        ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
              <Alert
                variant={mensajeFolio.variant}
                className="mb-3 d-flex align-items-center justify-content-between"
              >
                <div className="d-flex align-items-center">
                  <div
                    className="me-3"
                    style={{
                      fontSize: "1.5rem",
                      color:
                        mensajeFolio.variant === "warning"
                          ? "#856404"
                          : mensajeFolio.variant === "info"
                          ? "#0c5460"
                          : mensajeFolio.variant === "success"
                          ? "#0a3622"
                          : "#721c24",
                    }}
                  >
                    <i
                      className={`bi ${
                        mensajeFolio.variant === "warning"
                          ? "bi-exclamation-triangle-fill"
                          : mensajeFolio.variant === "info"
                          ? "bi-info-circle-fill"
                          : mensajeFolio.variant === "success"
                          ? "bi-check-circle-fill"
                          : "bi-x-circle-fill"
                      }`}
                    ></i>
                  </div>
                  <div>
                    <div className="fw-bold">{mensajeFolio.titulo}</div>
                    <div className="text-muted">
                      {mensajeFolio.mensaje}
                      {mensajeFolio.detalles &&
                        mensajeFolio.detalles.length > 0 && (
                          <>
                            <br />
                            {mensajeFolio.detalles.map((detalle, index) => (
                              <div key={index}>• {detalle}</div>
                            ))}
                          </>
                        )}
                      {!mensajeFolio.detalles && mensajeFolio.diferencia && (
                        <>
                          <br />
                          Exceso: $
                          {mensajeFolio.diferencia.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {mensajeFolio.tipo === "exceso" && (
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="fw-bold"
                      onClick={handleSolicitarFolio}
                      disabled={solicitandoFolio}
                    >
                      <i className="bi bi-clipboard-check me-2"></i>
                      {solicitandoFolio ? "Solicitando..." : "Solicitar Folio"}
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
          <a
            href="#facturas"
            className={`nav-link${activeTab === "facturas" ? " active" : ""}`}
            onClick={() => setActiveTab("facturas")}
          >
            Facturas
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#pagosEfectivo"
            className={`nav-link${
              activeTab === "pagosEfectivo" ? " active" : ""
            }`}
            onClick={() => setActiveTab("pagosEfectivo")}
          >
            Pagos en efectivo
          </a>
        </li>
      </ul>
      <div className="tab-content">
        <div
          className={`tab-pane${
            activeTab === "facturas" ? " show active" : ""
          }`}
          id="facturas"
        >
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
                    <th className="text-center">Valor Factura</th>
                    <th className="text-center">Importe a pagar</th>
                    <th className=" text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(packpage.facturas || []).map(
                    (factura: ImportedInvoice, idx: number) => (
                      <tr
                        key={factura._id}
                        className={idx % 2 === 1 ? "bg-pink bg-opacity-25" : ""}
                      >
                        <td>{idx + 1}</td>
                        <td>
                          <div className="fw-bold">{factura.nombreEmisor}</div>
                          <div>
                            <Badge bg="secondary" className="me-1">
                              servicio {idx + 1}
                            </Badge>
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
                            {copied === factura.uuid ? "Copiado" : "COPIAR"}
                          </Button>
                        </td>
                        <td>
                          {factura.fechaEmision
                            ? new Date(factura.fechaEmision).toLocaleDateString(
                                "es-MX",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : ""}
                        </td>
                        <td>
                          <Badge bg="info" className="me-1">
                            {factura.tipoComprobante}
                          </Badge>
                          <Badge bg="warning" className="me-1 text-dark">
                            PUE
                          </Badge>
                        </td>
                        <td>{factura.rfcEmisor}</td>
                        <td>
                          <Badge className="bg-success bg-opacity-10 text-success">
                            Vigente
                          </Badge>
                        </td>
                        <td>
                          <span className="text-primary">
                            {factura.autorizada
                              ? "Autorizada"
                              : factura.pagoRechazado
                              ? "Pago Rechazado"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="text-end">
                          $
                          {toNumber(factura.importeAPagar).toLocaleString(
                            "es-MX",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="text-end">
                          $
                          {toNumber(factura.importePagado).toLocaleString(
                            "es-MX",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center align-items-center">
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="fw-bold text-success me-1 action-button-hover-border"
                              title="Autorizar factura"
                              onClick={() =>
                                handleToggleAutorizada(factura._id, true)
                              }
                              disabled={packpage.estatus === "Enviado"}
                            >
                              Sí{" "}
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "1.1em",
                                }}
                              >
                                ✓
                              </span>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="fw-bold text-danger me-1 action-button-hover-border"
                              title="Rechazar factura"
                              onClick={() =>
                                handleToggleAutorizada(factura._id, false)
                              }
                              disabled={packpage.estatus === "Enviado"}
                            >
                              No{" "}
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "1.1em",
                                }}
                              >
                                ✗
                              </span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                  <tr className="fw-bold text-left">
                    <td className="text-end" colSpan={8}>
                      Total a pagar
                    </td>
                    <td className="text-end" colSpan={1}>
                      $
                      {calcularTotalVisualizacion().toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-end" colSpan={1}>
                      $
                      {calcularTotalPagadoVisualizacion().toLocaleString(
                        "es-MX",
                        { minimumFractionDigits: 2 }
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
        <div
          className={`tab-pane${
            activeTab === "pagosEfectivo" ? " show active" : ""
          }`}
          id="pagosEfectivo"
        >
          <CashPaymentsInPackageTable
            pagos={packpage?.pagosEfectivo || []}
            onAuthorize={handleAuthorizeCashPayment}
            onReject={handleRejectCashPayment}
            loading={false}
            packageStatus={packpage?.estatus}
          />
        </div>
      </div>
      {/* Timeline - se muestra cuando showTimeline es true */}
      {showTimeline && (
        <div className="mt-4">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold me-4">
                  <i className="bi bi-clock-history me-2"></i>
                  Timeline del Paquete
                </h5>
                <Button size="sm" onClick={() => setShowTimeline(false)}>
                  {showTimeline ? (
                    <LucideChevronUp className="me-1" />
                  ) : (
                    <LucideChevronDown className="me-1" />
                  )}

                  {showTimeline ? "Ocultar Timeline" : "Mostrar Timeline"}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <PackageTimeline
                packageId={packpage?._id}
                refreshTrigger={timelineRefreshTrigger}
              />
            </Card.Body>
          </Card>
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" onClick={() => router.back()}>
          Cerrar
        </Button>
        <Button
          variant="outline-secondary"
          className="ms-2"
          onClick={() => setShowTimeline(!showTimeline)}
        >
          <i
            className={`bi ${
              showTimeline ? "bi-eye-slash" : "bi-clock-history"
            } me-1`}
          ></i>
          {showTimeline ? "Ocultar Timeline" : "Mostrar Timeline"}
        </Button>
      </div>

      {/* Modal para ingreso de folio de autorización */}
      <Modal
        show={showFolioModal}
        onHide={() => {
          setShowFolioModal(false);
          setFolioValidado(null);
          setFolioIngresado("");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Ingrese folio de autorización</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Alert variant="warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              El presupuesto mensual ha sido excedido. Para enviar este paquete
              a tesorería, debe ingresar un folio de autorización válido.
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
          <Button
            variant="secondary"
            onClick={() => {
              setShowFolioModal(false);
              setFolioValidado(null);
              setFolioIngresado("");
            }}
          >
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
              "Validar y Enviar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmación para enviar a tesorería */}
      <Modal
        show={showConfirmationModal}
        onHide={() => setShowConfirmationModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar envío</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-3">
              <i
                className="bi bi-question-circle text-primary"
                style={{ fontSize: "3rem" }}
              ></i>
            </div>
            <h5 className="fw-bold">
              ¿Estás seguro de enviar el paquete a tesorería?
            </h5>
            <p className="text-muted">Esta acción no se puede deshacer.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="light"
            onClick={() => setShowConfirmationModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmarEnvio}>
            Aceptar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para programación de pagos */}
      <Modal
        show={showScheduleModal}
        onHide={() => {
          setShowScheduleModal(false);
          setSelectedCompanyId("");
          setSelectedBankAccountId("");
          setBankAccounts([]);
          setCompanies([]);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <div
              className="me-3"
              style={{ fontSize: "1.5rem", color: "#0d6efd" }}
            >
              <i className="bi bi-calendar-check"></i>
            </div>
            <div>
              <div className="fw-bold">Programar Pago</div>
              <div className="text-muted small">
                Seleccione la razón social y cuenta bancaria
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Paquete Folio: {packpage?.folio}</strong>
              <br />
              <span className="text-muted">
                Total a pagar: $
                {(
                  calcularTotalesFacturas().total +
                  calcularTotalesPagosEfectivo().total
                ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </Alert>
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Razón Social <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                disabled={loadingCompanies}
              >
                <option value="">Seleccione una razón social...</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name} - {company.rfc}
                  </option>
                ))}
              </Form.Select>
              {loadingCompanies && (
                <div className="mt-2">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Cargando razones sociales...
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Cuenta Bancaria <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={selectedBankAccountId}
                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                disabled={!selectedCompanyId || loadingBankAccounts}
              >
                <option value="">Seleccione una cuenta bancaria...</option>
                {bankAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.bankId.name} - {account.accountNumber} (
                    {account.accountType})
                  </option>
                ))}
              </Form.Select>
              {loadingBankAccounts && (
                <div className="mt-2">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Cargando cuentas bancarias...
                </div>
              )}
              {!selectedCompanyId && (
                <Form.Text className="text-muted">
                  Primero seleccione una razón social para ver las cuentas
                  bancarias disponibles.
                </Form.Text>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            onClick={() => {
              setShowScheduleModal(false);
              setSelectedCompanyId("");
              setSelectedBankAccountId("");
              setBankAccounts([]);
              setCompanies([]);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSchedulePayment}
            disabled={
              schedulingPayment || !selectedCompanyId || !selectedBankAccountId
            }
          >
            {schedulingPayment ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Programando...
              </>
            ) : (
              <>
                <i className="bi bi-calendar-check me-2"></i>
                Programar Pago
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewPackpageDetailsPage;

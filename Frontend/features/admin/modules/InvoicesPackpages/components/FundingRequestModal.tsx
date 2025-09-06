import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  getAllCompanies,
  getBankAccountsByCompany,
  Company,
  BankAccount,
} from "../services/scheduledPayment";
import {
  getPackagesToFund,
  getProvidersByRfcs,
  updatePackagesToGenerated,
} from "../services/invoicesPackpage";
import type { PaymentByProvider } from "../../paymentsByProvider/types";

import {
  generateBankReport,
  SantanderReportRow,
  AfirmeReportRow,
} from "../services/bankReports";

import { formatCurrency } from "@/utils";

interface FundingRequestModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FundingRequestModal: React.FC<FundingRequestModalProps> = ({
  show,
  onClose,
  onSuccess,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [packagesPreview, setPackagesPreview] = useState<any[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [totalToFund, setTotalToFund] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [requestingFunding, setRequestingFunding] = useState(false);
  const [packagesWithProviders, setPackagesWithProviders] = useState<any[]>([]);
  const [groupedPayments, setGroupedPayments] = useState<PaymentByProvider[]>(
    []
  );
  const [selectedGroupedPayments, setSelectedGroupedPayments] = useState<
    string[]
  >([]);
  const [loadingGrouping, setLoadingGrouping] = useState(false);
  const [layoutType, setLayoutType] = useState<"grouped" | "individual">(
    "grouped"
  );

  useEffect(() => {
    if (show) {
      loadCompanies();
    }
  }, [show]);

  useEffect(() => {
    if (selectedCompanyId) {
      loadBankAccounts();
    } else {
      setBankAccounts([]);
      setSelectedBankAccountId("");
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId && selectedBankAccountId) {
      loadPackagesPreview();
    } else {
      setPackagesPreview([]);
      setSelectedPackageIds([]);
      setTotalToFund(0);
      setPackagesWithProviders([]);
      setGroupedPayments([]);
    }
  }, [selectedCompanyId, selectedBankAccountId]);

  useEffect(() => {
    const selectedPackages = packagesPreview.filter((pkg) =>
      selectedPackageIds.includes(pkg._id)
    );
    const total = selectedPackages.reduce(
      (sum, pkg) => sum + (pkg.totalPagado || 0),
      0
    );
    setTotalToFund(total);

    // Agrupar facturas por proveedor localmente cuando se seleccionan paquetes
    if (
      selectedPackageIds.length > 0 &&
      selectedCompanyId &&
      selectedBankAccountId
    ) {
      if (layoutType === "grouped") {
        groupInvoicesByProviderLocally();
      } else {
        // Para layout individual, usar los paquetes tal como están
        setGroupedPayments([]);
      }
    } else {
      setGroupedPayments([]);
    }
  }, [
    selectedPackageIds,
    packagesPreview,
    selectedCompanyId,
    selectedBankAccountId,
    layoutType,
  ]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesData = await getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error al cargar razones sociales:", error);
      toast.error("Error al cargar las razones sociales");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const bankAccountsData = await getBankAccountsByCompany(
        selectedCompanyId
      );
      setBankAccounts(bankAccountsData);
    } catch (error) {
      console.error("Error al cargar cuentas bancarias:", error);
      toast.error("Error al cargar las cuentas bancarias");
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const loadPackagesPreview = async () => {
    try {
      setLoadingPreview(true);
      const result = await getPackagesToFund(
        selectedCompanyId,
        selectedBankAccountId
      );
      const packages = result.packages || [];
      setPackagesPreview(packages);
      setSelectedPackageIds(packages.map((pkg) => pkg._id));

      // No hacer petición para obtener proveedores aquí
      // Los proveedores se obtendrán localmente cuando se agrupen las facturas
      setPackagesWithProviders(packages);
    } catch (error) {
      console.error("Error al cargar preview de paquetes:", error);
      setPackagesPreview([]);
      setSelectedPackageIds([]);
      setTotalToFund(0);
      setPackagesWithProviders([]);
      setGroupedPayments([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const groupInvoicesByProviderLocally = async () => {
    try {
      setLoadingGrouping(true);

      // Obtener los paquetes seleccionados
      const selectedPackages = packagesWithProviders.filter((pkg) =>
        selectedPackageIds.includes(pkg._id)
      );

      // Agrupar facturas por proveedor
      const providerGroups = new Map();

      selectedPackages.forEach((pkg) => {
        // Procesar facturas
        if (pkg.facturas && Array.isArray(pkg.facturas)) {
          pkg.facturas.forEach((factura: any) => {
            // Verificar que la factura tenga RFC y que tenga algún importe
            if (
              factura.rfcEmisor &&
              (factura.importePagado > 0 ||
                factura.importeAPagar > 0 ||
                factura.autorizada ||
                factura.estadoPago === 2)
            ) {
              const rfcEmisor = factura.rfcEmisor.toUpperCase().trim();

              if (!providerGroups.has(rfcEmisor)) {
                providerGroups.set(rfcEmisor, {
                  rfc: rfcEmisor,
                  totalAmount: 0,
                  invoices: [],
                  provider: null,
                });
              }

              const group = providerGroups.get(rfcEmisor);
              const amountToAdd =
                factura.importePagado && factura.importePagado.$numberDecimal
                  ? parseFloat(factura.importePagado.$numberDecimal)
                  : factura.importeAPagar &&
                    factura.importeAPagar.$numberDecimal
                  ? parseFloat(factura.importeAPagar.$numberDecimal)
                  : 0;
              console.log("Importe a agregar:", amountToAdd);

              group.totalAmount += amountToAdd;
              group.invoices.push(factura);
              console.log(
                `RFC: ${rfcEmisor} - Factura: ${
                  factura.folio || "N/A"
                } - Importe: ${amountToAdd} - Total acumulado: ${
                  group.totalAmount
                }`
              );
            }
          });
        }

        // Procesar pagos en efectivo (si aplica)
        if (pkg.pagosEfectivo && Array.isArray(pkg.pagosEfectivo)) {
          pkg.pagosEfectivo.forEach((pago: any) => {
            const cashAmount =
              pago.importePagado && pago.importePagado.$numberDecimal
                ? parseFloat(pago.importePagado.$numberDecimal)
                : 0;
            if (cashAmount > 0) {
              const rfcKey = `EFECTIVO_${
                pago.expenseConcept?.name || "SIN_CONCEPTO"
              }`;

              if (!providerGroups.has(rfcKey)) {
                providerGroups.set(rfcKey, {
                  rfc: rfcKey,
                  totalAmount: 0,
                  invoices: [],
                  isCashPayment: true,
                  expenseConcept: pago.expenseConcept,
                });
              }

              const group = providerGroups.get(rfcKey);
              group.totalAmount += cashAmount;
              group.invoices.push(pago);
            }
          });
        }
      });

      // Obtener los RFCs únicos de proveedores (excluyendo pagos en efectivo)
      const allRfcs = Array.from(providerGroups.keys());
      const rfcs = allRfcs.filter((rfc) => !rfc.startsWith("EFECTIVO_"));

      // Obtener los datos reales de los proveedores
      let providers: any[] = [];
      if (rfcs.length > 0) {
        providers = await getProvidersByRfcs(rfcs);
      }

      // Asignar proveedores a cada grupo
      providerGroups.forEach((group, rfc) => {
        if (!group.isCashPayment) {
          const provider = providers.find((p) => p.rfc === rfc);
          if (provider) {
            group.provider = provider;
          } else {
            // Crear un proveedor temporal si no se encuentra
            group.provider = {
              rfc: rfc,
              commercialName: `Proveedor ${rfc}`,
              businessName: `Empresa ${rfc}`,
              sucursal: "Sucursal Principal", // Cambiado de objeto a string
              bank: {
                _id: "temp",
                name: "Banco Temporal",
                bankNumber: 999, // Número temporal para proveedores no encontrados
              },
              accountNumber: "000000000000000000",
              clabe: "000000000000000000", // CLABE temporal
              referencia: `REF_${rfc}`,
              contactName: "Contacto Temporal",
              _id: `temp_${rfc}`,
            };
          }
        }
      });

      // Crear objetos PaymentByProvider para mostrar en la tabla
      const localGroupedPayments: PaymentByProvider[] = [];

      providerGroups.forEach((group, rfc) => {
        if (group.isCashPayment) {
          // Para pagos en efectivo
          localGroupedPayments.push({
            _id: `local_${rfc}`,
            groupingFolio: `LOCAL_${Math.random()
              .toString(36)
              .substring(2, 7)
              .toUpperCase()}`,
            totalAmount: Number(group.totalAmount) || 0,
            providerRfc: rfc,
            providerName: group.expenseConcept?.name || "Pago en Efectivo",
            branchName: "N/A",
            companyProvider: "Pago en Efectivo",
            bankNumber: "00000",
            providerAccountNumber: "000000000000000000", // Cuenta especial para pagos en efectivo
            debitedBankAccount: selectedBankAccountId,
            companyId: selectedCompanyId,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalInvoices: group.invoices.length,
          });
        } else if (group.provider) {
          // Para proveedores regulares
          localGroupedPayments.push({
            _id: `local_${rfc}`,
            groupingFolio: `LOCAL_${Math.random()
              .toString(36)
              .substring(2, 7)
              .toUpperCase()}`,
            totalAmount: Number(group.totalAmount) || 0,
            providerRfc: group.provider.rfc,
            providerName: group.provider.commercialName,
            branchName: group.provider.sucursal || "N/A", // Cambiado de sucursal?.name a sucursal
            companyProvider: group.provider.businessName,
            bankNumber:
              group.provider.bank?.bankNumber?.toString().padStart(3, "0") ||
              "000", // Usar bankNumber real del proveedor
            providerAccountNumber: group.provider.clabe || "000000000000000000", // Usar CLABE del proveedor para transferencias
            debitedBankAccount: selectedBankAccountId,
            companyId: selectedCompanyId,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalInvoices: group.invoices.length,
          });
        }
      });

      setGroupedPayments(localGroupedPayments);
      setSelectedGroupedPayments(
        localGroupedPayments.map((payment) => payment._id)
      );
    } catch (error: any) {
      console.error("Error al agrupar facturas localmente:", error);
      setGroupedPayments([]);
    } finally {
      setLoadingGrouping(false);
    }
  };

  const handleClose = () => {
    setSelectedCompanyId("");
    setSelectedBankAccountId("");
    setBankAccounts([]);
    setPackagesPreview([]);
    setSelectedPackageIds([]);
    setTotalToFund(0);
    setPackagesWithProviders([]);
    setSelectedGroupedPayments([]);
    onClose();
  };

  const generatePaymentReport = async () => {
    if (!selectedCompanyId || !selectedBankAccountId) {
      toast.error("Por favor seleccione una razón social y cuenta bancaria");
      return;
    }

    if (selectedPackageIds.length === 0) {
      toast.error(
        "Por favor seleccione al menos un paquete para generar el reporte"
      );
      return;
    }

    if (layoutType === "grouped" && selectedGroupedPayments.length === 0) {
      toast.error(
        "Por favor seleccione al menos una agrupación de facturas para generar el reporte"
      );
      return;
    }

    try {
      setRequestingFunding(true);

      if (layoutType === "grouped") {
        // Aquí es donde se hace la petición al backend para guardar en cc_payments_by_provider
        const { groupInvoicesByProvider } = await import(
          "../../paymentsByProvider/services/paymentsByProvider"
        );

        const result = await groupInvoicesByProvider({
          packageIds: selectedPackageIds,
          bankAccountId: selectedBankAccountId,
          companyId: selectedCompanyId,
        });
        console.log("result", result);
        if (!result.success) {
          throw new Error(
            result.message || "Error al procesar pagos por proveedor"
          );
        }

        toast.success(
          `Generando reporte con ${selectedGroupedPayments.length} proveedores seleccionados`
        );
      } else {
        // Para layout individual, generar referencias individuales para cada factura
        const { generateIndividualInvoiceReferences } = await import(
          "../../paymentsByProvider/services/paymentsByProvider"
        );

        const result = await generateIndividualInvoiceReferences({
          packageIds: selectedPackageIds,
        });
        
        if (!result.success) {
          throw new Error(
            result.message || "Error al generar referencias individuales"
          );
        }

        toast.success(
          `Referencias generadas para facturas en ${selectedPackageIds.length} paquetes seleccionados`
        );
      }

      const selectedBankAccount = bankAccounts.find(
        (acc) => acc._id === selectedBankAccountId
      );
      const bankName = selectedBankAccount?.bankId?.name || "";

      let reportData: any[] = [];

      if (bankName.toLowerCase() === "banorte") {
        const banorteData: SantanderReportRow[] = [];

        console.log("🔍 DEBUG - Layout type:", layoutType);
        console.log("🔍 DEBUG - packagesWithProviders:", packagesWithProviders);
        console.log("🔍 DEBUG - selectedPackageIds:", selectedPackageIds);

        if (layoutType === "grouped") {
          const selectedPayments = groupedPayments.filter((payment) =>
            selectedGroupedPayments.includes(payment._id)
          );

          selectedPayments.forEach((paymentGroup: PaymentByProvider) => {
            if (paymentGroup.providerRfc.startsWith("EFECTIVO_")) {
              // Para pagos en efectivo, crear registro especial
              const reportRow: SantanderReportRow = {
                cuentaCargo: selectedBankAccount?.accountNumber || "",
                cuentaAbono: "000000000000000000", // CLABE especial para efectivo
                bancoReceptor: "PAGO EN EFECTIVO",
                beneficiario: paymentGroup.providerName,
                sucursal: "N/A",
                importe: paymentGroup.totalAmount,
                plazaBanxico: selectedBankAccount?.claveBanxico || "",
                concepto: `Pago en efectivo - ${paymentGroup.providerName}`,
                estadoCuentaFiscal: "SI",
                rfc: "XAXX010101000", // RFC genérico para pagos en efectivo
                iva: paymentGroup.totalAmount * 0.16,
                referenciaOrdenante: paymentGroup.groupingFolio,
                formaAplicacion: "1",
                fechaAplicacion: "",
                emailBeneficiario: "",
              };
              banorteData.push(reportRow);
            } else {
              // Para proveedores regulares
              const iva = paymentGroup.totalAmount * 0.16; // 16% de IVA

              const reportRow: SantanderReportRow = {
                cuentaCargo: selectedBankAccount?.accountNumber || "",
                cuentaAbono:
                  paymentGroup.providerAccountNumber || "000000000000000000", // Usar cuenta real del proveedor
                bancoReceptor: paymentGroup.providerName,
                beneficiario: paymentGroup.providerName,
                sucursal: paymentGroup.branchName,
                importe: paymentGroup.totalAmount,
                plazaBanxico: selectedBankAccount?.claveBanxico || "",
                concepto: `Pago a ${paymentGroup.providerName}`,
                estadoCuentaFiscal: "SI",
                rfc: paymentGroup.providerRfc,
                iva: iva,
                referenciaOrdenante: paymentGroup.groupingFolio,
                formaAplicacion: "1",
                fechaAplicacion: "",
                emailBeneficiario: "",
              };

              banorteData.push(reportRow);
            }
          });
        } else {
          // Layout individual - crear filas para cada factura individual
          console.log("🔍 DEBUG - Procesando layout individual");
          const selectedPackages = packagesWithProviders.filter((pkg) =>
            selectedPackageIds.includes(pkg._id)
          );

          console.log(
            "🔍 DEBUG - selectedPackages count:",
            selectedPackages.length
          );

          // Obtener todos los RFCs únicos de las facturas para buscar proveedores
          const allRfcs = new Set<string>();
          selectedPackages.forEach((pkg) => {
            if (pkg.facturas && Array.isArray(pkg.facturas)) {
              pkg.facturas.forEach((factura: any) => {
                if (factura.rfcEmisor) {
                  allRfcs.add(factura.rfcEmisor.toUpperCase().trim());
                }
              });
            }
          });

          console.log(
            "🔍 DEBUG - RFCs únicos encontrados:",
            Array.from(allRfcs)
          );

          // Obtener información de proveedores
          const providersMap = new Map();
          if (allRfcs.size > 0) {
            try {
              const providers = await getProvidersByRfcs(Array.from(allRfcs));
              console.log("🔍 DEBUG - Proveedores obtenidos:", providers);
              providers.forEach((provider) => {
                providersMap.set(provider.rfc, provider);
              });
            } catch (error) {
              console.error("Error obteniendo proveedores:", error);
            }
          }

          selectedPackages.forEach((pkg) => {
            // Procesar facturas individuales
            if (pkg.facturas && Array.isArray(pkg.facturas)) {
              pkg.facturas.forEach((factura: any) => {
                // Parsear correctamente los valores Decimal128
                const importeAPagar =
                  factura.importeAPagar && factura.importeAPagar.$numberDecimal
                    ? parseFloat(factura.importeAPagar.$numberDecimal)
                    : factura.importeAPagar || 0;

                const importePagado =
                  factura.importePagado && factura.importePagado.$numberDecimal
                    ? parseFloat(factura.importePagado.$numberDecimal)
                    : factura.importePagado || 0;

                console.log(
                  "🔍 DEBUG - Factura:",
                  factura.folio,
                  "importeAPagar:",
                  importeAPagar,
                  "importePagado:",
                  importePagado
                );

                if (
                  factura.rfcEmisor &&
                  (importeAPagar > 0 || importePagado > 0)
                ) {
                  // Obtener información del proveedor si está disponible
                  const provider = providersMap.get(
                    factura.rfcEmisor.toUpperCase().trim()
                  );
                  const cuentaAbono = provider?.clabe || "000000000000000000";
                  const sucursal = provider?.sucursal || "N/A";

                  console.log(
                    "🔍 DEBUG - Proveedor para RFC:",
                    factura.rfcEmisor,
                    "- Cuenta:",
                    cuentaAbono,
                    "- Sucursal:",
                    sucursal
                  );

                  const reportRow: SantanderReportRow = {
                    cuentaCargo: selectedBankAccount?.accountNumber || "",
                    cuentaAbono: cuentaAbono, // Usar CLABE real del proveedor
                    bancoReceptor: factura.nombreEmisor,
                    beneficiario: factura.nombreEmisor,
                    sucursal: sucursal, // Usar sucursal real del proveedor
                    importe: importePagado > 0 ? importePagado : importeAPagar, // Usar importePagado si existe, sino importeAPagar
                    plazaBanxico: selectedBankAccount?.claveBanxico || "",
                    concepto: `Pago individual - ${factura.nombreEmisor} - ${
                      factura.folio || factura.uuid.substring(0, 8)
                    }`,
                    estadoCuentaFiscal: "SI",
                    rfc: factura.rfcEmisor,
                    iva:
                      (importePagado > 0 ? importePagado : importeAPagar) *
                      0.16,
                    referenciaOrdenante: `PKG_${pkg.folio}_${
                      factura.folio || factura._id
                    }`,
                    formaAplicacion: "1",
                    fechaAplicacion: "",
                    emailBeneficiario: "",
                  };
                  console.log(
                    "✅ DEBUG - Agregando factura al reporte:",
                    reportRow
                  );
                  banorteData.push(reportRow);
                }
              });
            }

            // Para layout individual, NO procesar pagos en efectivo
            console.log(
              "🔍 DEBUG - Facturas procesadas para pkg:",
              pkg.folio,
              "Total banorteData:",
              banorteData.length
            );
          });

          console.log(
            "🔍 DEBUG - Total banorteData final:",
            banorteData.length
          );
        }

        reportData = banorteData;
      } else if (bankName.toLowerCase() === "afirme") {
        const afirmeData: AfirmeReportRow[] = [];

        console.log("🔍 DEBUG - AFIRME Layout type:", layoutType);

        if (layoutType === "grouped") {
          const selectedPayments = groupedPayments.filter((payment) =>
            selectedGroupedPayments.includes(payment._id)
          );

          selectedPayments.forEach((paymentGroup: PaymentByProvider) => {
            if (!paymentGroup.providerRfc.startsWith("EFECTIVO_")) {
              const reportRow: AfirmeReportRow = {
                nombreBeneficiario: paymentGroup.providerName,
                tipoCuenta: "40",
                cuentaDestino:
                  paymentGroup.providerAccountNumber || "000000000000000000", // Usar cuenta real del proveedor
                numeroBanco: paymentGroup.bankNumber,
                correoElectronico: "",
              };

              afirmeData.push(reportRow);
            }
          });
        } else {
          // Layout individual para Afirme
          console.log("🔍 DEBUG - AFIRME Procesando layout individual");
          const selectedPackages = packagesWithProviders.filter((pkg) =>
            selectedPackageIds.includes(pkg._id)
          );

          console.log(
            "🔍 DEBUG - AFIRME selectedPackages count:",
            selectedPackages.length
          );

          // Obtener todos los RFCs únicos de las facturas para buscar proveedores (igual que en Banorte)
          const allRfcs = new Set<string>();
          selectedPackages.forEach((pkg) => {
            if (pkg.facturas && Array.isArray(pkg.facturas)) {
              pkg.facturas.forEach((factura: any) => {
                if (factura.rfcEmisor) {
                  allRfcs.add(factura.rfcEmisor.toUpperCase().trim());
                }
              });
            }
          });

          // Obtener información de proveedores
          const providersMap = new Map();
          if (allRfcs.size > 0) {
            try {
              const providers = await getProvidersByRfcs(Array.from(allRfcs));
              providers.forEach((provider) => {
                providersMap.set(provider.rfc, provider);
              });
            } catch (error) {
              console.error("Error obteniendo proveedores para Afirme:", error);
            }
          }

          selectedPackages.forEach((pkg) => {
            if (pkg.facturas && Array.isArray(pkg.facturas)) {
              pkg.facturas.forEach((factura: any) => {
                // Parsear correctamente los valores Decimal128
                const importeAPagar =
                  factura.importeAPagar && factura.importeAPagar.$numberDecimal
                    ? parseFloat(factura.importeAPagar.$numberDecimal)
                    : factura.importeAPagar || 0;

                const importePagado =
                  factura.importePagado && factura.importePagado.$numberDecimal
                    ? parseFloat(factura.importePagado.$numberDecimal)
                    : factura.importePagado || 0;

                console.log(
                  "🔍 DEBUG - AFIRME Factura:",
                  factura.folio,
                  "importeAPagar:",
                  importeAPagar,
                  "importePagado:",
                  importePagado
                );

                if (
                  factura.rfcEmisor &&
                  (importeAPagar > 0 || importePagado > 0)
                ) {
                  // Obtener información del proveedor si está disponible
                  const provider = providersMap.get(
                    factura.rfcEmisor.toUpperCase().trim()
                  );
                  const cuentaDestino = provider?.clabe || "000000000000000000";
                  const numeroBanco =
                    provider?.bank?.bankNumber?.toString().padStart(3, "0") ||
                    "000";

                  const reportRow: AfirmeReportRow = {
                    nombreBeneficiario: factura.nombreEmisor,
                    tipoCuenta: "40",
                    cuentaDestino: cuentaDestino, // Usar CLABE real del proveedor
                    numeroBanco: numeroBanco, // Usar número de banco real del proveedor
                    correoElectronico: "",
                  };
                  console.log(
                    "✅ DEBUG - AFIRME Agregando factura al reporte:",
                    reportRow
                  );
                  afirmeData.push(reportRow);
                }
              });
            }
          });

          console.log(
            "🔍 DEBUG - AFIRME Total afirmeData final:",
            afirmeData.length
          );
        }

        reportData = afirmeData;
      } else {
        throw new Error(`Banco no soportado: ${bankName}`);
      }

      console.log("🔍 DEBUG - reportData final length:", reportData.length);
      console.log("🔍 DEBUG - reportData sample:", reportData.slice(0, 2));

      if (reportData.length > 0) {
        const fileName = `reporte_${bankName.toLowerCase()}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        await generateBankReport(bankName, reportData, fileName);
        toast.success(
          `Reporte Excel de ${bankName} generado con ${reportData.length} registros`
        );

        console.log(
          "🔍 DEBUG - Iniciando actualización de estatus para paquetes:",
          selectedPackageIds
        );

        try {
          const updateResult = await updatePackagesToGenerated(
            selectedPackageIds
          );

          console.log(
            "🔍 DEBUG - Resultado de updatePackagesToGenerated:",
            updateResult
          );
          if (updateResult.success) {
            toast.success(
              `Estatus de ${
                updateResult.data?.updatedCount || selectedPackageIds.length
              } paquetes actualizado a "Generado"`
            );
            handleClose();
            if (onSuccess) onSuccess();
          } else {
            toast.warning(
              "Reporte generado pero hubo un problema al actualizar el estatus de los paquetes"
            );
            handleClose();
            if (onSuccess) onSuccess();
          }
        } catch (error) {
          console.error("Error al actualizar estatus de paquetes:", error);
          toast.warning(
            "Reporte generado pero hubo un problema al actualizar el estatus de los paquetes"
          );
          handleClose();
          if (onSuccess) onSuccess();
        }
      } else {
        console.log("🔍 DEBUG - No hay datos para generar el reporte");
        toast.warning("No hay datos para generar el reporte");
        handleClose();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error("Error al generar reporte:", error);
      toast.error(error?.message || "Error al generar el reporte");
    } finally {
      setRequestingFunding(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <div
            className="me-3"
            style={{ fontSize: "1.5rem", color: "#198754" }}
          >
            <i className="bi bi-file-earmark-text"></i>
          </div>
          <div>
            <div className="fw-bold">Generar Reporte</div>
            <div className="text-muted small">
              Generar reporte por razón social y cuenta bancaria
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>
              Razón Social <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
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
            {selectedBankAccountId && (
              <div className="mt-2">
                <Alert variant="info" className="py-2">
                  <i className="bi bi-wallet2 me-2"></i>
                  <strong>Saldo disponible:</strong>{" "}
                  {formatCurrency(
                    bankAccounts.find(
                      (acc) => acc._id === selectedBankAccountId
                    )?.currentBalance || 0
                  )}
                </Alert>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Tipo de Layout <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={layoutType}
              onChange={(e) =>
                setLayoutType(e.target.value as "grouped" | "individual")
              }
            >
              <option value="grouped">Agrupado por Proveedor</option>
              <option value="individual">Individual (Sin Agrupar)</option>
            </Form.Select>
            <Form.Text className="text-muted">
              {layoutType === "grouped"
                ? "Las facturas se agruparán por proveedor en el reporte Excel"
                : "Las facturas se mostrarán individualmente en el reporte Excel"}
            </Form.Text>
          </Form.Group>
        </Form>

        {selectedCompanyId && selectedBankAccountId && (
          <div className="mt-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-check2-square me-2"></i>
              Seleccionar Paquetes Programados
            </h6>

            {loadingPreview ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" className="me-2" />
                Cargando paquetes...
              </div>
            ) : packagesPreview.length > 0 ? (
              <>
                <div className="mb-3">
                  <Form.Label>Paquetes Disponibles</Form.Label>
                  <Table size="sm" className="mt-2">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>
                          <Form.Check
                            type="checkbox"
                            checked={
                              selectedPackageIds.length ===
                                packagesPreview.length &&
                              packagesPreview.length > 0
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPackageIds(
                                  packagesPreview.map((pkg) => pkg._id)
                                );
                              } else {
                                setSelectedPackageIds([]);
                              }
                            }}
                          />
                        </th>
                        <th>Folio</th>
                        <th>Departamento</th>
                        <th>Total Pagado</th>
                        <th>Fecha Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packagesPreview.map((pkg) => (
                        <tr key={pkg._id}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedPackageIds.includes(pkg._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPackageIds([
                                    ...selectedPackageIds,
                                    pkg._id,
                                  ]);
                                } else {
                                  setSelectedPackageIds(
                                    selectedPackageIds.filter(
                                      (id) => id !== pkg._id
                                    )
                                  );
                                }
                              }}
                            />
                          </td>
                          <td>#{pkg.folio}</td>
                          <td>{pkg.departamento}</td>
                          <td>{formatCurrency(pkg.totalPagado)}</td>
                          <td>
                            {new Date(pkg.fechaPago).toLocaleDateString(
                              "es-MX"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Form.Text className="text-muted">
                    {packagesPreview.length} paquetes programados disponibles •{" "}
                    {selectedPackageIds.length} seleccionados
                  </Form.Text>
                </div>

                {selectedPackageIds.length > 0 && (
                  <Alert
                    variant="success"
                    className="d-flex align-items-center justify-content-between"
                  >
                    <div>
                      <strong>
                        Total a procesar: {formatCurrency(totalToFund)}
                      </strong>
                      <br />
                      <small>
                        {selectedPackageIds.length} paquetes seleccionados
                        {layoutType === "grouped" &&
                          selectedGroupedPayments.length > 0 && (
                            <span>
                              {" "}
                              • {selectedGroupedPayments.length} proveedores
                              seleccionados
                            </span>
                          )}
                      </small>
                    </div>
                    <i
                      className="bi bi-file-earmark-text"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                  </Alert>
                )}

                {layoutType === "grouped" ? (
                  loadingGrouping ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Agrupando facturas por proveedor...
                    </div>
                  ) : groupedPayments.length > 0 ? (
                    <Table size="sm" className="mt-3">
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>
                            <Form.Check
                              type="checkbox"
                              checked={
                                selectedGroupedPayments.length ===
                                groupedPayments.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroupedPayments(
                                    groupedPayments.map(
                                      (payment) => payment._id
                                    )
                                  );
                                } else {
                                  setSelectedGroupedPayments([]);
                                }
                              }}
                            />
                          </th>
                          <th>Folio</th>
                          <th>Proveedor</th>
                          <th>Razón Social</th>
                          <th>Sucursal</th>
                          <th>Total Agrupado</th>
                          <th>Total Facturas</th>
                          <th>Número Banco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedPayments.map((payment) => (
                          <tr key={payment._id} className="table-success">
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedGroupedPayments.includes(
                                  payment._id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGroupedPayments([
                                      ...selectedGroupedPayments,
                                      payment._id,
                                    ]);
                                  } else {
                                    setSelectedGroupedPayments(
                                      selectedGroupedPayments.filter(
                                        (id) => id !== payment._id
                                      )
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td>#{payment.groupingFolio}</td>
                            <td className="fw-bold">{payment.providerName}</td>
                            <td>{payment.companyProvider}</td>
                            <td>{payment.branchName}</td>
                            <td className="fw-bold text-success">
                              {formatCurrency(payment.totalAmount)}
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {payment.totalInvoices || 0}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                {payment.bankNumber}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Table size="sm" className="mt-3">
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>
                            <Form.Check
                              type="checkbox"
                              checked={
                                selectedPackageIds.length ===
                                  packagesWithProviders.length &&
                                packagesWithProviders.length > 0
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPackageIds(
                                    packagesWithProviders.map((pkg) => pkg._id)
                                  );
                                } else {
                                  setSelectedPackageIds([]);
                                }
                              }}
                            />
                          </th>
                          <th>Folio</th>
                          <th>Departamento</th>
                          <th>Total Pagado</th>
                          <th>Fecha Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packagesWithProviders.map((pkg) => {
                          const isSelected = selectedPackageIds.includes(
                            pkg._id
                          );
                          return (
                            <tr
                              key={pkg._id}
                              className={isSelected ? "table-success" : ""}
                            >
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPackageIds([
                                        ...selectedPackageIds,
                                        pkg._id,
                                      ]);
                                    } else {
                                      setSelectedPackageIds(
                                        selectedPackageIds.filter(
                                          (id) => id !== pkg._id
                                        )
                                      );
                                    }
                                  }}
                                />
                              </td>
                              <td>#{pkg.folio}</td>
                              <td>{pkg.departamento}</td>
                              <td className={isSelected ? "fw-bold" : ""}>
                                {formatCurrency(pkg.totalPagado)}
                              </td>
                              <td>
                                {new Date(pkg.fechaPago).toLocaleDateString(
                                  "es-MX"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )
                ) : (
                  // Layout individual - mostrar facturas individuales
                  <div className="mt-3">
                    <h6 className="fw-bold mb-3 text-info">
                      <i className="bi bi-list-ul me-2"></i>
                      Vista Individual - Facturas sin Agrupar
                    </h6>
                    {packagesWithProviders
                      .filter((pkg) => selectedPackageIds.includes(pkg._id))
                      .map((pkg) => (
                        <div key={pkg._id} className="mb-3">
                          <h6 className="text-primary">Paquete #{pkg.folio}</h6>
                          {pkg.facturas && pkg.facturas.length > 0 && (
                            <Table size="sm" className="mb-2">
                              <thead>
                                <tr>
                                  <th>UUID</th>
                                  <th>Emisor</th>
                                  <th>RFC Emisor</th>
                                  <th>Importe</th>
                                  <th>Folio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pkg.facturas.map((factura: any) => (
                                  <tr key={factura._id}>
                                    <td className="small">
                                      {factura.uuid?.substring(0, 8)}...
                                    </td>
                                    <td>{factura.nombreEmisor}</td>
                                    <td>{factura.rfcEmisor}</td>
                                    <td>
                                      {formatCurrency(
                                        factura.importePagado &&
                                          factura.importePagado.$numberDecimal
                                          ? parseFloat(
                                              factura.importePagado
                                                .$numberDecimal
                                            )
                                          : 0
                                      )}
                                    </td>
                                    <td>{factura.folio || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                          {pkg.pagosEfectivo &&
                            pkg.pagosEfectivo.length > 0 && (
                              <>
                                <h6 className="text-secondary mt-2">
                                  Pagos en Efectivo
                                </h6>
                                <Table size="sm" className="mb-2">
                                  <thead>
                                    <tr>
                                      <th>Concepto</th>
                                      <th>Descripción</th>
                                      <th>Importe</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pkg.pagosEfectivo.map((pago: any) => (
                                      <tr key={pago._id}>
                                        <td>
                                          {pago.expenseConcept?.name ||
                                            "Sin concepto"}
                                        </td>
                                        <td>{pago.description || "-"}</td>
                                        <td>
                                          {formatCurrency(
                                            pago.importePagado &&
                                              pago.importePagado.$numberDecimal
                                              ? parseFloat(
                                                  pago.importePagado
                                                    .$numberDecimal
                                                )
                                              : 0
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </>
                            )}
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <Alert variant="warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                No hay paquetes programados para esta combinación de razón
                social y cuenta bancaria.
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={generatePaymentReport}
          disabled={
            requestingFunding ||
            !selectedCompanyId ||
            !selectedBankAccountId ||
            selectedPackageIds.length === 0 ||
            (layoutType === "grouped" && selectedGroupedPayments.length === 0)
          }
        >
          {requestingFunding ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Generando Reporte...
            </>
          ) : (
            <>
              <i className="bi bi-file-earmark-text me-2"></i>
              Generar Reporte
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FundingRequestModal;

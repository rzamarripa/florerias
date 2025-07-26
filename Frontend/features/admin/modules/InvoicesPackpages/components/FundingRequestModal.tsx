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
  Provider,
  updatePackagesToGenerated,
} from "../services/invoicesPackpage";
import {
  generateBankReport,
  SantanderReportRow,
  AfirmeReportRow,
} from "../services/bankReports";
import Multiselect from "@/components/forms/Multiselect";
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
  const [estadoCuentaFiscal, setEstadoCuentaFiscal] = useState<"SI" | "NO">(
    "NO"
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
  }, [selectedPackageIds, packagesPreview]);

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
      setSelectedPackageIds([]); // Limpiar selección al cargar nuevos paquetes

      // Obtener proveedores para cada paquete
      const packagesWithProvidersData = await Promise.all(
        packages.map(async (pkg) => {
          // Extraer RFCs únicos de las facturas del paquete
          const rfcs = [
            ...new Set(pkg.facturas?.map((f: any) => f.rfcEmisor) || []),
          ].filter((rfc): rfc is string => typeof rfc === "string");

          console.log(`Paquete ${pkg.folio} - RFCs encontrados:`, rfcs);
          console.log(`Paquete ${pkg.folio} - Facturas:`, pkg.facturas);

          // Obtener proveedores por RFCs solo si hay RFCs válidos
          let providers: Provider[] = [];
          if (rfcs.length > 0) {
            console.log(`Llamando endpoint para RFCs:`, rfcs);
            providers = await getProvidersByRfcs(rfcs);
            console.log(`Proveedores obtenidos para ${pkg.folio}:`, providers);
          } else {
            console.log(`No hay RFCs válidos para el paquete ${pkg.folio}`);
          }

          return {
            ...pkg,
            providers,
          };
        })
      );

      setPackagesWithProviders(packagesWithProvidersData);
    } catch (error) {
      console.error("Error al cargar preview de paquetes:", error);
      setPackagesPreview([]);
      setSelectedPackageIds([]);
      setTotalToFund(0);
      setPackagesWithProviders([]);
    } finally {
      setLoadingPreview(false);
    }
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

    try {
      setRequestingFunding(true);

      // Log de los paquetes seleccionados
      console.log(
        "Paquetes seleccionados para generar reporte:",
        selectedPackageIds
      );
      console.log("Razón social ID:", selectedCompanyId);
      console.log("Cuenta bancaria ID:", selectedBankAccountId);

      // Log de paquetes con sus proveedores relacionados
      const selectedPackagesWithProviders = packagesWithProviders.filter(
        (pkg) => selectedPackageIds.includes(pkg._id)
      );
      selectedPackagesWithProviders.forEach((pkg) => {
        console.log(`Paquete ID: ${pkg._id} - Proveedores:`, pkg.providers);
      });

      // Log del estado de cuenta fiscal
      console.log("Estado de cuenta fiscal:", estadoCuentaFiscal);

      // Obtener datos de la cuenta bancaria seleccionada
      const selectedBankAccount = bankAccounts.find(
        (acc) => acc._id === selectedBankAccountId
      );
      const bankName = selectedBankAccount?.bankId?.name || "";

      console.log("Procesando paquetes para reporte...");
      console.log("Cuenta bancaria seleccionada:", selectedBankAccount);
      console.log("Banco detectado:", bankName);

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

      // Generar datos según el banco
      let reportData: any[] = [];

      if (bankName.toLowerCase() === "santander") {
        // Estructura para Santander
        const santanderData: SantanderReportRow[] = [];

        selectedPackagesWithProviders.forEach((pkg) => {
          console.log(`Procesando paquete ${pkg.folio} para Santander:`);
          console.log("- Facturas:", pkg.facturas?.length || 0);
          console.log("- Proveedores:", pkg.providers?.length || 0);

          // Procesar cada factura del paquete
          pkg.facturas?.forEach((factura: any, index: number) => {
            const importePagado = toNumber(factura.importePagado);

            console.log(`  Factura ${index + 1}:`);
            console.log(`    - RFC Emisor: ${factura.rfcEmisor}`);
            console.log(`    - Importe Pagado: ${importePagado}`);

            // Buscar el proveedor correspondiente a esta factura
            const provider = pkg.providers?.find(
              (p: Provider) => p.rfc === factura.rfcEmisor
            );

            if (provider && importePagado > 0) {
              const iva = importePagado * 0.16; // 16% de IVA

              const reportRow: SantanderReportRow = {
                cuentaCargo: selectedBankAccount?.accountNumber || "",
                cuentaAbono: provider.accountNumber || "",
                bancoReceptor: provider.bank?.name || "",
                beneficiario: provider.commercialName || "",
                sucursal: provider.sucursal?.name || "",
                importe: importePagado,
                plazaBanxico: selectedBankAccount?.claveBanxico || "",
                concepto:
                  factura.descripcionPago || `Pago factura ${factura.uuid}`,
                estadoCuentaFiscal: estadoCuentaFiscal,
                rfc: provider.rfc || "",
                iva: iva,
                referenciaOrdenante: factura._id || "",
                formaAplicacion: "1",
                fechaAplicacion: "",
                emailBeneficiario: "",
              };

              santanderData.push(reportRow);
              console.log(`    - ✅ Fila agregada al reporte Santander`);
            }
          });
        });

        reportData = santanderData;
      } else if (bankName.toLowerCase() === "afirme") {
        // Estructura para Afirme
        const afirmeData: AfirmeReportRow[] = [];

        selectedPackagesWithProviders.forEach((pkg) => {
          console.log(`Procesando paquete ${pkg.folio} para Afirme:`);
          console.log("- Facturas:", pkg.facturas?.length || 0);
          console.log("- Proveedores:", pkg.providers?.length || 0);

          // Procesar cada factura del paquete
          pkg.facturas?.forEach((factura: any, index: number) => {
            const importePagado = toNumber(factura.importePagado);

            console.log(`  Factura ${index + 1}:`);
            console.log(`    - RFC Emisor: ${factura.rfcEmisor}`);
            console.log(`    - Importe Pagado: ${importePagado}`);

            // Buscar el proveedor correspondiente a esta factura
            const provider = pkg.providers?.find(
              (p: Provider) => p.rfc === factura.rfcEmisor
            );

            if (provider && importePagado > 0) {
              const reportRow: AfirmeReportRow = {
                nombreBeneficiario: provider.commercialName || "",
                tipoCuenta: "40", // Hardcodeado como especificaste
                cuentaDestino: provider.accountNumber || "",
                numeroBanco:
                  selectedBankAccount?.bankId?.bankNumber?.toString() || "",
                correoElectronico: "", // Vacío como especificaste
              };

              afirmeData.push(reportRow);
              console.log(`    - ✅ Fila agregada al reporte Afirme`);
            }
          });
        });

        reportData = afirmeData;
      } else {
        throw new Error(`Banco no soportado: ${bankName}`);
      }

      console.log(
        "Total de filas generadas para el reporte:",
        reportData.length
      );

      if (reportData.length > 0) {
        const fileName = `reporte_${bankName.toLowerCase()}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        await generateBankReport(bankName, reportData, fileName);
        toast.success(
          `Reporte Excel de ${bankName} generado con ${reportData.length} registros`
        );

        try {
          const updateResult = await updatePackagesToGenerated(
            selectedPackageIds
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

  const handleClose = () => {
    setSelectedCompanyId("");
    setSelectedBankAccountId("");
    setBankAccounts([]);
    setPackagesPreview([]);
    setSelectedPackageIds([]);
    setTotalToFund(0);
    setPackagesWithProviders([]);
    setEstadoCuentaFiscal("NO");
    onClose();
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
                <Form.Group className="mb-3">
                  <Form.Label>Paquetes Disponibles</Form.Label>
                  <Multiselect
                    options={packagesPreview.map((pkg) => ({
                      value: pkg._id,
                      label: `Folio #${pkg.folio} - ${
                        pkg.departamento
                      } - ${formatCurrency(pkg.totalPagado)}`,
                    }))}
                    value={selectedPackageIds}
                    onChange={setSelectedPackageIds}
                    placeholder="Seleccione los paquetes programados..."
                  />
                  <Form.Text className="text-muted">
                    {packagesPreview.length} paquetes programados disponibles
                  </Form.Text>
                </Form.Group>

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
                      </small>
                    </div>
                    <i
                      className="bi bi-file-earmark-text"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
                  </Alert>
                )}

                <Table size="sm" className="mt-3">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Folio</th>
                      <th>Departamento</th>
                      <th>Proveedores</th>
                      <th>Total Pagado</th>
                      <th>Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packagesWithProviders.map((pkg) => {
                      const isSelected = selectedPackageIds.includes(pkg._id);
                      return (
                        <tr
                          key={pkg._id}
                          className={isSelected ? "table-success" : ""}
                        >
                          <td>
                            {isSelected ? (
                              <i className="bi bi-check-circle-fill text-success"></i>
                            ) : (
                              <i className="bi bi-circle text-muted"></i>
                            )}
                          </td>
                          <td>#{pkg.folio}</td>
                          <td>{pkg.departamento}</td>
                          <td>
                            {pkg.providers && pkg.providers.length > 0 ? (
                              <div>
                                {pkg.providers.map((provider: Provider) => (
                                  <div key={provider._id} className="mb-1">
                                    <small className="text-muted">
                                      {provider.rfc}
                                    </small>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <small className="text-muted">
                                Sin proveedor
                              </small>
                            )}
                          </td>
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

        {selectedPackageIds.length > 0 && (
          <div className="mt-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="bi bi-file-earmark-check me-2"></i>
                Estado de cuenta fiscal
              </Form.Label>
              <div className="d-flex gap-2">
                <Button
                  variant={
                    estadoCuentaFiscal === "SI" ? "success" : "outline-success"
                  }
                  size="sm"
                  onClick={() => setEstadoCuentaFiscal("SI")}
                  className="fw-bold"
                >
                  SI
                </Button>
                <Button
                  variant={
                    estadoCuentaFiscal === "NO" ? "danger" : "outline-danger"
                  }
                  size="sm"
                  onClick={() => setEstadoCuentaFiscal("NO")}
                  className="fw-bold"
                >
                  NO
                </Button>
              </div>
              <Form.Text className="text-muted">
                Seleccione si desea incluir el estado de cuenta fiscal en el
                reporte
              </Form.Text>
            </Form.Group>
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
            selectedPackageIds.length === 0
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

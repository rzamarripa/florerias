import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  BankMovement,
  Company,
  BankAccount,
  ImportConfig,
  ConciliationData,
} from "../types/validation";
import {
  processMovementsWithCalculatedBalance,
  validateConciliation,
} from "../services/validationService";
import { getParser } from "../parsers";
import { bankMovementsService } from "../services/bankMovements";

export function useBankMovementsImport() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<BankMovement[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("configuracion");

  const [importConfig, setImportConfig] = useState<ImportConfig>({
    selectedCompany: "",
    selectedBankAccount: "",
    file: null,
    selectedBank: "",
    parserWarning: "",
  });

  const [conciliationData, setConciliationData] = useState<ConciliationData>({
    saldoInicialCuenta: null,
    saldoInicialCalculado: null,
    saldoFinalCalculado: null,
    saldoFinalReportado: null,
    abonoPrimeraFila: null,
    cargoPrimeraFila: null,
    balancesCuadran: null,
    saldosInicialesCoinciden: null,
  });

  useEffect(() => {
    bankMovementsService.getCompanies().then((res) => {
      if (res && res.success && Array.isArray(res.data)) {
        setCompanies(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (importConfig.selectedCompany) {
      bankMovementsService
        .getBankAccounts(importConfig.selectedCompany)
        .then((res) => {
          if (res && res.success && Array.isArray(res.data)) {
            setBankAccounts(res.data);
          }
        });
    } else {
      setBankAccounts([]);
      setImportConfig((prev) => ({
        ...prev,
        selectedBankAccount: "",
      }));
      setConciliationData((prev) => ({
        ...prev,
        saldoInicialCuenta: null,
      }));
    }
  }, [importConfig.selectedCompany]);

  useEffect(() => {
    if (importConfig.selectedBankAccount) {
      const cuenta = bankAccounts.find(
        (b) => b._id === importConfig.selectedBankAccount
      );
      setImportConfig((prev) => ({
        ...prev,
        selectedBank: cuenta?.bank?.name || "",
      }));
      setConciliationData((prev) => ({
        ...prev,
        saldoInicialCuenta: cuenta?.currentBalance ?? null,
      }));
    } else {
      setImportConfig((prev) => ({
        ...prev,
        selectedBank: "",
      }));
      setConciliationData((prev) => ({
        ...prev,
        saldoInicialCuenta: null,
      }));
    }
  }, [importConfig.selectedBankAccount, bankAccounts]);

  const resetCalculations = () => {
    setConciliationData({
      saldoInicialCuenta: conciliationData.saldoInicialCuenta,
      saldoInicialCalculado: null,
      saldoFinalCalculado: null,
      saldoFinalReportado: null,
      abonoPrimeraFila: null,
      cargoPrimeraFila: null,
      balancesCuadran: null,
      saldosInicialesCoinciden: null,
    });
    setPreviewData([]);
    setPreviewHeaders([]);
  };

  useEffect(() => {
    if (importConfig.file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        setImportConfig((prev) => ({ ...prev, parserWarning: "" }));

        if (!importConfig.selectedBank) {
          setImportConfig((prev) => ({
            ...prev,
            parserWarning:
              "Selecciona una cuenta bancaria para identificar el banco.",
          }));
          setPreviewHeaders([]);
          setPreviewData([]);
          return;
        }

        const parser = getParser(importConfig.selectedBank);
        if (!parser) {
          setImportConfig((prev) => ({
            ...prev,
            parserWarning: `No hay parser implementado para el banco: ${importConfig.selectedBank}`,
          }));
          setPreviewHeaders([]);
          setPreviewData([]);
          return;
        }

        const parsedData = parser(json);
        if (parsedData.length === 0) {
          toast.error("El archivo no contiene movimientos válidos.");
          resetCalculations();
          return;
        }

        const {
          dataConSaldoCalculado,
          saldoInicialArchivo,
          saldoFinalArchivo,
          saldoFinalCalculado,
          abonoPrimeraFila,
          cargoPrimeraFila,
        } = processMovementsWithCalculatedBalance(parsedData);

        const saldosInicialesCoinciden =
          Math.abs(
            (conciliationData.saldoInicialCuenta ?? 0) - saldoInicialArchivo
          ) < 0.01;

        const balancesCuadran = validateConciliation(
          conciliationData.saldoInicialCuenta,
          saldoInicialArchivo
        );

        setConciliationData((prev) => ({
          ...prev,
          saldoInicialCalculado: saldoInicialArchivo,
          saldoFinalReportado: saldoFinalArchivo,
          saldoFinalCalculado,
          abonoPrimeraFila,
          cargoPrimeraFila,
          saldosInicialesCoinciden,
          balancesCuadran,
        }));

        setPreviewHeaders([
          "#",
          "Fecha",
          "Recibo",
          "Concepto",
          "Cargo",
          "Abono",
          "Saldo Reportado",
          "Saldo Calculado",
          "Advertencia",
        ]);
        setPreviewData(dataConSaldoCalculado);
        setActiveTab("resultados");
      };
      reader.readAsArrayBuffer(importConfig.file);
    } else {
      resetCalculations();
      setActiveTab("configuracion");
    }
  }, [
    importConfig.file,
    importConfig.selectedBank,
    conciliationData.saldoInicialCuenta,
  ]);

  const handleImport = async (validacion: any) => {
    setLoading(true);
    const movimientos = (validacion.movimientosOrdenados ?? previewData).filter(
      (mov: BankMovement) => !mov.advertencia
    );

    const res = await bankMovementsService.importMovements({
      company: importConfig.selectedCompany,
      bankAccount: importConfig.selectedBankAccount,
      movimientos,
      finalBalance: validacion.saldoFinalArchivo ?? 0,
    });

    setLoading(false);

    if (res && res.success) {
      toast.success(res.message || "Importación exitosa", {
        position: "top-right",
      });

      const accountsRes = await bankMovementsService.getBankAccounts(
        importConfig.selectedCompany
      );
      if (
        accountsRes &&
        accountsRes.success &&
        Array.isArray(accountsRes.data)
      ) {
        setBankAccounts(accountsRes.data);

        const updatedAccount = accountsRes.data.find(
          (acc) => acc._id === importConfig.selectedBankAccount
        );
        if (updatedAccount) {
          setConciliationData((prev) => ({
            ...prev,
            saldoInicialCuenta: updatedAccount.currentBalance,
          }));
        }
      }

      setImportConfig((prev) => ({ ...prev, file: null }));
      setPreviewData([]);
      setPreviewHeaders([]);

      setActiveTab("configuracion");
    } else {
      toast.error(res?.message || "Error al importar movimientos");
    }
  };

  return {
    companies,
    bankAccounts,
    loading,
    previewData,
    previewHeaders,
    activeTab,
    importConfig,
    conciliationData,
    setActiveTab,
    setImportConfig,
    handleImport,
  };
}

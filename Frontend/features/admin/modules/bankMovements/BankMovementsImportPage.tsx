'use client';
import React, { useEffect, useState } from "react";
import { bankMovementsService } from "./services/bankMovements";
import ImportDropzone from "./components/ImportDropzone";
import { Button, Form, Spinner, Alert, Table } from "react-bootstrap";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { getParser } from "./parsers";

function parseExcelDate(excelDate: number): Date {
  // Excel serial date to JS Date (corrige desfase de zona horaria sumando 1 día)
  return new Date(Math.round((excelDate - 25569) * 86400 * 1000) + (24 * 60 * 60 * 1000));
}

function parseExcelTime(excelTime: number): string {
  if (typeof excelTime !== "number") return String(excelTime);
  const totalSeconds = Math.round(86400 * (excelTime % 1));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatDateTime(fecha: any) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" }) +
    " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatMoney(val: any) {
  if (val === null || val === undefined) return "";
  return Number(val).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const BankMovementsImportPage: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [parserWarning, setParserWarning] = useState<string>("");

  useEffect(() => {
    bankMovementsService.getCompanies().then(res => {
      if (res && res.success && Array.isArray(res.data)) setCompanies(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      bankMovementsService.getBankAccounts(selectedCompany).then(res => {
        if (res && res.success && Array.isArray(res.data)) setBankAccounts(res.data);
      });
    } else {
      setBankAccounts([]);
      setSelectedBankAccount("");
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedBankAccount) {
      const cuenta = bankAccounts.find(b => b._id === selectedBankAccount);
      setSelectedBank(cuenta?.bank?.name || "");
    } else {
      setSelectedBank("");
    }
  }, [selectedBankAccount, bankAccounts]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setParserWarning("");
        if (!selectedBank) {
          setParserWarning("Selecciona una cuenta bancaria para identificar el banco.");
          setPreviewHeaders([]);
          setPreviewData([]);
          return;
        }
        const parser = getParser(selectedBank);
        if (!parser) {
          setParserWarning(`No hay parser implementado para el banco: ${selectedBank}`);
          setPreviewHeaders([]);
          setPreviewData([]);
          return;
        }
        const movimientos = parser(json);
        if (movimientos.length > 0) {
          setPreviewHeaders(["#", "Fecha", "Recibo", "Concepto", "Cargo", "Abono", "Saldo", "Advertencia"]);
          setPreviewData(movimientos);
        } else {
          setPreviewHeaders([]);
          setPreviewData([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setPreviewHeaders([]);
      setPreviewData([]);
    }
  }, [file, selectedBank, getParser]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    if (!selectedCompany || !selectedBankAccount || !file) {
      setErrorMsg("Selecciona razón social, cuenta bancaria y archivo.");
      return;
    }
    setLoading(true);
    const movimientos = previewData.filter(mov => !mov.advertencia); // Solo los válidos
    console.log("Payload enviado al backend:", {
      company: selectedCompany,
      bankAccount: selectedBankAccount,
      movimientos,
    });
    const res = await bankMovementsService.importMovements({
      company: selectedCompany,
      bankAccount: selectedBankAccount,
      movimientos,
    });
    setLoading(false);
    if (res && res.success) {
      toast.success(res.message || "Importación exitosa", { position: "top-right" });
      setSelectedCompany("");
      setSelectedBankAccount("");
      setFile(null);
      setPreviewHeaders([]);
      setPreviewData([]);
    } else {
      setErrorMsg(res?.message || "Error al importar movimientos");
    }
  };

  return (
    <div className="container-fluid">
      
      <Form onSubmit={handleImport}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label>Razón Social</Form.Label>
              <Form.Select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                required
              >
                <option value="">Selecciona una razón social</option>
                {companies.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div className="col-md-6 mb-3">
            <Form.Group>
              <Form.Label>Cuenta Bancaria</Form.Label>
              <Form.Select
                value={selectedBankAccount}
                onChange={e => setSelectedBankAccount(e.target.value)}
                required
                disabled={!selectedCompany}
              >
                <option value="">Selecciona una cuenta bancaria</option>
                {bankAccounts.map(b => (
                  <option key={b._id} value={b._id}>{b.accountNumber} ({b.bank?.name})</option>
                ))}
              </Form.Select>
              {selectedBankAccount && (
                <div className="mt-2">
                  <span className="badge bg-info text-dark">
                    Banco: {bankAccounts.find(b => b._id === selectedBankAccount)?.bank?.name || ""}
                  </span>
                </div>
              )}
            </Form.Group>
          </div>
        </div>
        <Form.Group className="mb-3">
          <Form.Label>Archivo Excel</Form.Label>
          <ImportDropzone file={file} setFile={setFile} />
        </Form.Group>
        {previewHeaders.length > 0 && (
          <div className="mb-4">
            <div className="d-flex justify-content-end mb-2">
              <Button type="submit" variant="primary" disabled={loading || !selectedCompany || !selectedBankAccount || !file}>
                {loading ? <Spinner size="sm" animation="border" /> : "Importar"}
              </Button>
            </div>
            <div className="mb-2 fw-bold">Previsualización del archivo</div>
            {/* Resumen de movimientos */}
            <div className="mb-2">
              <span className="fw-medium">Total filas: {previewData.length}</span> | {" "}
              <span className="text-success">Válidas: {previewData.filter(mov => !mov.advertencia).length}</span> | {" "}
              <span className="text-danger">Con advertencia: {previewData.filter(mov => mov.advertencia).length}</span>
            </div>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Recibo</th>
                  <th>Concepto</th>
                  <th>Cargo</th>
                  <th>Abono</th>
                  <th>Saldo</th>
                  <th>Advertencia</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.numero}</td>
                    <td>{row.advertencia ? <span className="text-danger">{row.advertencia}</span> : formatDateTime(row.fecha)}</td>
                    <td>{row.recibo}</td>
                    <td>{row.concepto}</td>
                    <td className="text-end">{formatMoney(row.cargo)}</td>
                    <td className="text-end">{formatMoney(row.abono)}</td>
                    <td className="text-end">{formatMoney(row.saldo)}</td>
                    <td>{row.advertencia && <span className="text-danger">{row.advertencia}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Mostrando {previewData.length} filas del archivo.
            </div>
          </div>
        )}
        {parserWarning && (
          <div className="alert alert-warning">{parserWarning}</div>
        )}
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}
      </Form>
    </div>
  );
};

export default BankMovementsImportPage; 
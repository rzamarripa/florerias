"use client";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import CountUp from "react-countup";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { formatMoney } from "../../../../utils";
import ImportDropzone from "./components/ImportDropzone";
import { getParser } from "./parsers";
import { bankMovementsService } from "./services/bankMovements";

function formatDateTime(fecha: any) {
  if (!fecha) return "";
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    return d.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(fecha);
  }
}

function round2(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

const BankMovementsImportPage: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [parserWarning, setParserWarning] = useState<string>("");
  const [saldoInicialCuenta, setSaldoInicialCuenta] = useState<number | null>(
    null
  );
  const [saldoInicialCalculado, setSaldoInicialCalculado] = useState<
    number | null
  >(null);
  const [saldoFinalCalculado, setSaldoFinalCalculado] = useState<number | null>(
    null
  );
  const [saldoFinalReportado, setSaldoFinalReportado] = useState<number | null>(
    null
  );
  const [abonoPrimeraFila, setAbonoPrimeraFila] = useState<number | null>(null);
  const [cargoPrimeraFila, setCargoPrimeraFila] = useState<number | null>(null);
  const [balancesCuadran, setBalancesCuadran] = useState<boolean | null>(null);
  const [saldosInicialesCoinciden, setSaldosInicialesCoinciden] = useState<
    boolean | null
  >(null);
  const [activeTab, setActiveTab] = useState("configuracion");

  useEffect(() => {
    bankMovementsService.getCompanies().then((res) => {
      if (res && res.success && Array.isArray(res.data)) setCompanies(res.data);
    });
  }, []);
  useEffect(() => {
    if (selectedCompany) {
      bankMovementsService.getBankAccounts(selectedCompany).then((res) => {
        if (res && res.success && Array.isArray(res.data))
          setBankAccounts(res.data);
      });
    } else {
      setBankAccounts([]);
      setSelectedBankAccount("");
      setSaldoInicialCuenta(null);
    }
  }, [selectedCompany]);
  useEffect(() => {
    if (selectedBankAccount) {
      const cuenta = bankAccounts.find((b) => b._id === selectedBankAccount);
      setSelectedBank(cuenta?.bank?.name || "");
      setSaldoInicialCuenta(cuenta?.currentBalance ?? null);
    } else {
      setSelectedBank("");
      setSaldoInicialCuenta(null);
    }
  }, [selectedBankAccount, bankAccounts]);

  const resetCalculations = () => {
    setSaldoInicialCalculado(null);
    setSaldoFinalCalculado(null);
    setSaldoFinalReportado(null);
    setBalancesCuadran(null);
    setSaldosInicialesCoinciden(null);
    setPreviewData([]);
    setPreviewHeaders([]);
  };

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
          setParserWarning(
            "Selecciona una cuenta bancaria para identificar el banco."
          );
          setPreviewHeaders([]);
          setPreviewData([]);
          return;
        }
        const parser = getParser(selectedBank);
        if (!parser) {
          setParserWarning(
            `No hay parser implementado para el banco: ${selectedBank}`
          );
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
        const movimientoMasAntiguo = parsedData[parsedData.length - 1];
        const saldoInicialArchivo = movimientoMasAntiguo.saldo;
        setSaldoInicialCalculado(saldoInicialArchivo);
        const movimientoMasReciente = parsedData[0];
        const saldoFinalArchivo = movimientoMasReciente.saldo;
        setSaldoFinalReportado(saldoFinalArchivo);
        const movimientosOrdenados = [...parsedData].reverse();
        let saldoCorriente = saldoInicialArchivo;
        const dataConSaldoCalculado = movimientosOrdenados.map((mov, idx) => {
          let saldoCalculado;
          if (idx === 0) {
            saldoCalculado = saldoCorriente;
          } else {
            saldoCalculado = saldoCorriente + mov.abono - mov.cargo;
          }
          const advertencia =
            Math.abs(saldoCalculado - mov.saldo) > 0.01
              ? `El saldo reportado (${formatMoney(
                  mov.saldo
                )}) no coincide con el calculado (${formatMoney(
                  saldoCalculado
                )})`
              : "";
          const result = {
            ...mov,
            saldoCalculado: saldoCalculado,
            advertencia: advertencia,
          };
          saldoCorriente = saldoCalculado;
          return result;
        });
        const saldoInicialCalculadoLocal =
          dataConSaldoCalculado.length > 0
            ? dataConSaldoCalculado[0].saldoCalculado
            : saldoInicialArchivo;
        setSaldoFinalCalculado(saldoInicialCalculadoLocal);
        const abonoPrimeraFila = movimientosOrdenados[0]?.abono
          ? Number(movimientosOrdenados[0].abono)
          : 0;
        setAbonoPrimeraFila(abonoPrimeraFila);
        const cargoPrimeraFila = movimientosOrdenados[0]?.cargo
          ? Number(movimientosOrdenados[0].cargo)
          : 0;
        setCargoPrimeraFila(cargoPrimeraFila);
        if (saldoInicialCuenta !== null) {
          setSaldosInicialesCoinciden(
            Math.abs(
              saldoInicialArchivo -
                (saldoInicialCuenta + abonoPrimeraFila - cargoPrimeraFila)
            ) < 0.01
          );
        } else {
          setSaldosInicialesCoinciden(true);
        }
        const saldoActualCuentaCalculado =
          (saldoInicialCuenta ?? 0) + abonoPrimeraFila - cargoPrimeraFila;
        setBalancesCuadran(
          Math.abs(saldoActualCuentaCalculado - saldoInicialCalculadoLocal) <
            0.01
        );
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
      reader.readAsArrayBuffer(file);
    } else {
      resetCalculations();
      setFile(null);
      setActiveTab("configuracion");
    }
  }, [file, selectedBank]);

  const validarYCalcularSaldos = (
    movimientos: any[],
    saldoActualCuenta: number | null
  ) => {
    if (!movimientos || movimientos.length === 0) return { valido: false };
    const movimientosOrdenados = [...movimientos].sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaA.getTime() - fechaB.getTime();
    });
    const saldoInicialArchivo =
      round2(movimientosOrdenados[0]?.saldo ?? 0) || 0;
    const saldoFinalArchivo =
      round2(
        movimientosOrdenados[movimientosOrdenados.length - 1]?.saldo ?? 0
      ) || 0;
    const abonosRestantes = movimientosOrdenados
      .slice(1)
      .reduce((acc, mov) => acc + (Number(mov.abono) || 0), 0);
    const cargosRestantes = movimientosOrdenados
      .slice(1)
      .reduce((acc, mov) => acc + (Number(mov.cargo) || 0), 0);
    const saldoEsperado = round2(
      saldoInicialArchivo + abonosRestantes - cargosRestantes
    );
    const saldoCalculadoUltimaFila = round2(
      movimientosOrdenados[movimientosOrdenados.length - 1]?.saldoCalculado ?? 0
    );
    const saldoEsperadoCuadra =
      Math.abs(saldoEsperado - saldoFinalArchivo) < 0.01;
    const saldoCalculadoCuadra =
      Math.abs(saldoFinalArchivo - saldoCalculadoUltimaFila) < 0.01;
    let advertenciaPrimeraFila = null;
    if (saldoActualCuenta !== null && movimientosOrdenados.length > 0) {
      const abono1 = Number(movimientosOrdenados[0].abono) || 0;
      const cargo1 = Number(movimientosOrdenados[0].cargo) || 0;
      const saldoEsperadoPrimera = round2(saldoActualCuenta + abono1 - cargo1);
      if (
        Math.abs(saldoEsperadoPrimera - round2(movimientosOrdenados[0].saldo)) >
        0.01
      ) {
        advertenciaPrimeraFila = `El saldo reportado de la primera fila (${round2(
          movimientosOrdenados[0].saldo
        )}) no cuadra con el saldo actual de la cuenta (${saldoActualCuenta}) + abono (${abono1}) - cargo (${cargo1}) = ${saldoEsperadoPrimera}`;
      }
    }
    const advertenciasFilas = [];
    for (let i = 1; i < movimientosOrdenados.length; i++) {
      const prevSaldo = round2(movimientosOrdenados[i - 1].saldo);
      const abono = Number(movimientosOrdenados[i].abono) || 0;
      const cargo = Number(movimientosOrdenados[i].cargo) || 0;
      const esperado = round2(prevSaldo + abono - cargo);
      const reportado = round2(movimientosOrdenados[i].saldo);
      if (Math.abs(esperado - reportado) > 0.01) {
        advertenciasFilas.push(
          `Fila ${
            i + 1
          }: Saldo reportado (${reportado}) no cuadra con saldo anterior (${prevSaldo}) + abono (${abono}) - cargo (${cargo}) = ${esperado}`
        );
      }
    }
    return {
      saldoInicialArchivo,
      saldoFinalArchivo,
      saldoEsperado,
      totalAbonos: abonosRestantes,
      totalCargos: cargosRestantes,
      saldoCalculadoUltimaFila,
      saldoEsperadoCuadra,
      saldoCalculadoCuadra,
      valido:
        saldoEsperadoCuadra &&
        saldoCalculadoCuadra &&
        !advertenciaPrimeraFila &&
        advertenciasFilas.length === 0,
      movimientosOrdenados,
      advertenciaPrimeraFila,
      advertenciasFilas,
    };
  };

  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const movimientos = (validacion.movimientosOrdenados ?? previewData).filter(
      (mov) => !mov.advertencia
    );
    const res = await bankMovementsService.importMovements({
      company: selectedCompany,
      bankAccount: selectedBankAccount,
      movimientos,
      finalBalance: validacion.saldoFinalArchivo ?? 0,
    });
    setLoading(false);
    if (res && res.success) {
      toast.success(res.message || "Importación exitosa", {
        position: "top-right",
      });
      await bankMovementsService.updateBankAccount(selectedBankAccount, {
        currentBalance: validacion.saldoFinalArchivo ?? 0,
      });
      const accountsRes = await bankMovementsService.getBankAccounts(
        selectedCompany
      );
      if (
        accountsRes &&
        accountsRes.success &&
        Array.isArray(accountsRes.data)
      ) {
        setBankAccounts(accountsRes.data);
      }
      setFile(null);
    } else {
      toast.error(res?.message || "Error al importar movimientos");
    }
  };

  const validacion = validarYCalcularSaldos(previewData, saldoInicialCuenta);

  return (
    <div className="container-fluid">
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as string)}
            id="import-wizard"
            className="mb-3"
          >
            <Tab eventKey="configuracion" title="1. Configuración">
              <Form onSubmit={(e) => e.preventDefault()}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Razón Social</Form.Label>
                      <Form.Select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        required
                      >
                        <option value="">Selecciona una razón social</option>
                        {companies.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cuenta Bancaria</Form.Label>
                      <Form.Select
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        required
                        disabled={!selectedCompany}
                      >
                        <option value="">Selecciona una cuenta bancaria</option>
                        {bankAccounts.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.accountNumber} ({b.bank?.name})
                          </option>
                        ))}
                      </Form.Select>
                      {saldoInicialCuenta !== null && (
                        <Alert variant="info" className="mt-2">
                          Saldo Actual Registrado:{" "}
                          <strong>{formatMoney(saldoInicialCuenta)}</strong>
                        </Alert>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Archivo Excel</Form.Label>
                  <ImportDropzone file={file} setFile={setFile} />
                  {parserWarning && (
                    <Alert variant="warning" className="mt-2">
                      {parserWarning}
                    </Alert>
                  )}
                </Form.Group>
              </Form>
            </Tab>
            <Tab
              eventKey="resultados"
              title="2. Resultados de Conciliación"
              disabled={previewData.length === 0}
            >
              {previewData.length > 0 && (
                <>
                  <Row className="g-3 mb-3">
                    <Col xl={4}>
                      <Card className="border-0 bg-light shadow-none mb-0">
                        <Card.Body>
                          <h5 title="Saldo Inicial Calculado del Archivo">
                            Saldo Inicial (Calculado)
                          </h5>
                          <div className="d-flex align-items-center gap-2 my-3">
                            <div className="avatar-md flex-shrink-0">
                              <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-22">
                                <ArrowRight />
                              </span>
                            </div>
                            <h3 className="mb-0">
                              <CountUp
                                start={0}
                                end={saldoInicialCalculado ?? 0}
                                duration={1}
                                separator=","
                                prefix="$"
                                decimals={2}
                              />
                            </h3>
                          </div>
                          {saldoInicialCuenta !== null &&
                          saldosInicialesCoinciden !== null ? (
                            <p className="mb-0 d-flex justify-content-between">
                              <span className="text-nowrap text-muted">
                                Saldo Registrado:{" "}
                                <span
                                  className={`fw-bold ${
                                    saldosInicialesCoinciden
                                      ? "text-success"
                                      : "text-danger"
                                  }`}
                                >
                                  {saldosInicialesCoinciden
                                    ? "Coincide"
                                    : "No Coincide"}
                                </span>
                              </span>
                              <span className="fw-bold text-end">
                                Saldo Actual:{" "}
                                {formatMoney(saldoInicialCuenta ?? 0)}
                                <br />
                                (+) Abono: {formatMoney(abonoPrimeraFila ?? 0)}
                                <br />
                                (-) Cargo: {formatMoney(cargoPrimeraFila ?? 0)}
                                <br />
                                {formatMoney(
                                  (saldoInicialCuenta ?? 0) +
                                    (abonoPrimeraFila ?? 0) -
                                    (cargoPrimeraFila ?? 0)
                                )}
                              </span>
                            </p>
                          ) : (
                            <p className="mb-0 text-muted fst-italic">
                              No hay saldo inicial para comparar.
                            </p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xl={4}>
                      <Card
                        className={`border-0 bg-${
                          balancesCuadran ? "success" : "danger"
                        } bg-opacity-10 shadow-none mb-0`}
                      >
                        <Card.Body>
                          <h5 title="Resultado de la Conciliación">
                            Conciliación
                          </h5>
                          <div className="d-flex align-items-center gap-2 my-3">
                            <div className="avatar-md flex-shrink-0">
                              <span
                                className={`avatar-title text-bg-${
                                  balancesCuadran ? "success" : "danger"
                                } bg-opacity-90 rounded-circle fs-22`}
                              >
                                {balancesCuadran ? <Check /> : <X />}
                              </span>
                            </div>
                            <h3 className="mb-0">
                              {balancesCuadran ? "CUADRA" : "NO CUADRA"}
                            </h3>
                          </div>
                          <p className="mb-0 d-flex justify-content-between">
                            <span className="text-muted">Diferencia</span>
                            <span className="fw-bold">
                              {formatMoney(
                                Math.abs(
                                  (saldoFinalCalculado ?? 0) -
                                    (saldoFinalReportado ?? 0)
                                )
                              )}
                            </span>
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xl={4}>
                      <Card className="border-0 bg-light shadow-none mb-0">
                        <Card.Body>
                          <h5 title="Saldo Final Calculado">
                            Saldo Final (Calculado)
                          </h5>
                          <div className="d-flex align-items-center gap-2 my-3">
                            <div className="avatar-md flex-shrink-0">
                              <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-22">
                                <ArrowLeft />
                              </span>
                            </div>
                            <h3 className="mb-0">
                              <CountUp
                                start={0}
                                end={saldoFinalCalculado ?? 0}
                                duration={1}
                                separator=","
                                prefix="$"
                                decimals={2}
                              />
                            </h3>
                          </div>
                          <p className="mb-0 d-flex justify-content-between">
                            <span className="text-nowrap text-muted">
                              Saldo Reportado
                            </span>
                            <span className="fw-bold">
                              {formatMoney(saldoFinalReportado)}
                            </span>
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <div className="my-4">
                    {balancesCuadran === false && (
                      <Alert variant="danger">
                        <b>Importación Bloqueada:</b> La conciliación de saldos
                        interna del archivo ha fallado. Revisa que el archivo de
                        movimientos esté completo y no tenga errores.
                      </Alert>
                    )}
                    {saldosInicialesCoinciden === false && (
                      <Alert variant="danger">
                        <b>Importación Bloqueada:</b> El saldo inicial del
                        archivo ({formatMoney(saldoInicialCalculado)}) no
                        coincide con el saldo actual de la cuenta (
                        {formatMoney(saldoInicialCuenta)}). Asegúrate de estar
                        importando el estado de cuenta correcto o ajusta el
                        saldo de la cuenta si es necesario.
                      </Alert>
                    )}
                    {validacion.advertenciaPrimeraFila && (
                      <Alert variant="danger">
                        {validacion.advertenciaPrimeraFila}
                      </Alert>
                    )}
                    {validacion.advertenciasFilas &&
                      validacion.advertenciasFilas.length > 0 && (
                        <Alert variant="danger">
                          <div>
                            <b>Advertencias por filas:</b>
                          </div>
                          <ul>
                            {validacion.advertenciasFilas.map((msg, idx) => (
                              <li key={idx}>{msg}</li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    <div className="d-flex justify-content-between mb-2">
                      <span>
                        Total Filas: {previewData.length} | Válidos:{" "}
                        {previewData.filter((d) => !d.advertencia).length} | Con
                        advertencia:{" "}
                        {previewData.filter((d) => d.advertencia).length}
                      </span>
                      <Button
                        onClick={handleImport}
                        variant="primary"
                        disabled={
                          loading ||
                          !selectedCompany ||
                          !selectedBankAccount ||
                          !file ||
                          previewData.filter((d) => !d.advertencia).length ===
                            0 ||
                          !balancesCuadran ||
                          saldosInicialesCoinciden === false
                        }
                      >
                        {loading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Importar"
                        )}
                      </Button>
                    </div>

                    <Table striped bordered hover responsive size="sm">
                      <thead>
                        <tr>
                          {previewHeaders.map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr
                            key={idx}
                            className={row.advertencia ? "table-warning" : ""}
                          >
                            <td>{idx + 1}</td>
                            <td>{formatDateTime(row.fecha)}</td>
                            <td>{row.recibo}</td>
                            <td>{row.concepto}</td>
                            <td className="text-end">
                              {formatMoney(row.cargo)}
                            </td>
                            <td className="text-end">
                              {formatMoney(row.abono)}
                            </td>
                            <td className="text-end">
                              {formatMoney(row.saldo)}
                            </td>
                            <td className="text-end">
                              {formatMoney(row.saldoCalculado)}
                            </td>
                            <td>
                              {row.advertencia && (
                                <Alert variant="warning" className="p-1 m-0">
                                  {row.advertencia}
                                </Alert>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BankMovementsImportPage;

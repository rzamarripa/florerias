import { MovimientoBancario } from "./types";

export function parseBanBajio(json: any[][]): MovimientoBancario[] {
  const headerIndex = json.findIndex(
    (row) => Array.isArray(row) && row[0] === "#"
  );
  if (headerIndex === -1) return [];
  const headers = json[headerIndex];
  const dataRows = json.slice(headerIndex + 1);
  function parseExcelDate(excelDate: number): Date {
    return new Date(
      Math.round((excelDate - 25569) * 86400 * 1000) + 24 * 60 * 60 * 1000
    );
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
  function parseAfirmeDate(fechaStr: any): Date | null {
    if (!fechaStr || typeof fechaStr !== "string") return null;
    const [dd, mm, aa] = fechaStr.split("/");
    if (!dd || !mm || !aa) return null;
    const year = Number(aa) < 100 ? 2000 + Number(aa) : Number(aa);
    const date = new Date(year, Number(mm) - 1, Number(dd));
    return isNaN(date.getTime()) ? null : date;
  }
  return dataRows.map((row, i) => {
    const obj: Record<string, any> = {};
    headers.forEach((header: string, idx: number) => {
      obj[header] = row[idx];
    });
    let fecha = obj["Fecha Movimiento"];
    let hora = obj["Hora"];
    let fechaObj: Date | null = null;
    let advertencia = "";
    if (typeof fecha === "number") {
      fechaObj = parseExcelDate(fecha);
    } else if (typeof fecha === "string" && fecha.trim() !== "") {
      fechaObj = parseAfirmeDate(fecha);
    }
    let horaStr = hora;
    if (typeof hora === "number") {
      horaStr = parseExcelTime(hora);
    }
    if (
      fechaObj &&
      horaStr &&
      typeof horaStr === "string" &&
      horaStr.includes(":")
    ) {
      const [h, m, s] = horaStr.split(":");
      fechaObj.setHours(Number(h), Number(m), Number(s));
    }
    if (!fechaObj || isNaN(fechaObj.getTime())) {
      advertencia = "Fecha inválida";
    }
    const parseMonto = (val: any) => {
      if (!val) return 0;
      if (typeof val === "number") return val;
      return Number(String(val).replace(/[^\d.-]+/g, "")) || 0;
    };
    const cargo = parseMonto(obj["Cargos"]);
    const abono = parseMonto(obj["Abonos"]);
    const saldo = parseMonto(obj["Saldo"]);
    return {
      numero: obj["#"] || i + 1,
      fecha: fechaObj,
      recibo: obj["Recibo"] || "",
      concepto: obj["Descripción"] || "",
      cargo,
      abono,
      saldo,
      advertencia,
    };
  });
}

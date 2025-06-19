import { MovimientoBancario } from "./types";

function parseBBVADate(fechaStr: any): Date | null {
  if (typeof fechaStr === "number") {
    // Serial de Excel
    return new Date(
      Math.round((fechaStr - 25569) * 86400 * 1000) + 24 * 60 * 60 * 1000
    );
  }
  if (!fechaStr || typeof fechaStr !== "string") return null;
  const [dd, mmm] = fechaStr.split("-");
  if (!dd || !mmm) return null;
  const meses = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const mesIdx = meses.findIndex((m) => m === mmm.toLowerCase());
  if (mesIdx === -1) return null;
  const year = new Date().getFullYear();
  const date = new Date(year, mesIdx, Number(dd));
  return isNaN(date.getTime()) ? null : date;
}

function parseMontoBBVA(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/[^\d.-]+/g, "")) || 0;
}

export function parseBBVA(json: any[][]): MovimientoBancario[] {
  if (!json || json.length < 2) return [];
  const headers = json[0];
  const dataRows = json.slice(1);
  const movimientos: MovimientoBancario[] = [];
  let lastMovimiento: MovimientoBancario | null = null;
  dataRows.forEach((row, i) => {
    const obj: Record<string, any> = {};
    headers.forEach((header: string, idx: number) => {
      obj[header] = row[idx];
    });
    const getCol = (obj: Record<string, any>, keys: string[]) => {
      for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
      }
      return undefined;
    };
    const fechaObj = parseBBVADate(obj["Fecha"]);
    if (fechaObj) {
      // Nuevo movimiento
      lastMovimiento = {
        numero: movimientos.length + 1,
        fecha: fechaObj,
        recibo: "",
        concepto: obj["Concepto / Referencia"] || "",
        cargo: parseMontoBBVA(getCol(obj, ["Cargo", "Cargos"])),
        abono: parseMontoBBVA(getCol(obj, ["Abono", "Abonos"])),
        saldo: parseMontoBBVA(obj["Saldo"]),
        advertencia: "",
      };

      movimientos.push(lastMovimiento);
    } else if (lastMovimiento) {
      // Concatenar al concepto del último movimiento válido
      const extra = obj["Concepto / Referencia"] || "";
      if (extra) {
        lastMovimiento.concepto += "\n" + extra;
      }
    }
  });
  // Validar advertencias de fecha
  movimientos.forEach((mov) => {
    if (!mov.fecha || isNaN(mov.fecha.getTime())) {
      mov.advertencia = "Fecha inválida";
    }
  });
  return movimientos;
}

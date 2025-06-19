import { MovimientoBancario } from "./types";

function parseAfirmeDate(fechaStr: any): Date | null {
  if (typeof fechaStr === "number") {
    // Serial de Excel
    return new Date(
      Math.round((fechaStr - 25569) * 86400 * 1000) + 24 * 60 * 60 * 1000
    );
  }
  if (!fechaStr || typeof fechaStr !== "string") return null;
  const [dd, mm, aa] = fechaStr.split("/");
  if (!dd || !mm || !aa) return null;
  // Asume años 2000+
  const year = Number(aa) < 100 ? 2000 + Number(aa) : Number(aa);
  const date = new Date(year, Number(mm) - 1, Number(dd));
  return isNaN(date.getTime()) ? null : date;
}

export function parseAfirme(json: any[][]): MovimientoBancario[] {
  if (!json || json.length < 2) return [];
  const headers = json[0];
  const dataRows = json.slice(1);
  return dataRows.map((row, i) => {
    const obj: Record<string, any> = {};
    headers.forEach((header: string, idx: number) => {
      obj[header] = row[idx];
    });
    let advertencia = "";
    const fechaObj = parseAfirmeDate(obj["Fecha (DD/MM/AA)"]);
    if (!fechaObj) advertencia = "Fecha inválida";
    return {
      numero: obj["No. Secuencia"] || i + 1,
      fecha: fechaObj,
      recibo: obj["Referencia"] || "",
      concepto: obj["Concepto"] || "",
      cargo: Number(obj["Cargo"]) || 0,
      abono: Number(obj["Abono"]) || 0,
      saldo: Number(obj["Saldo"]) || 0,
      advertencia,
    };
  });
}

function parseBBVADate(fechaStr: any): Date | null {
  console.log("parseBBVADate fechaStr:", fechaStr, typeof fechaStr);
  if (typeof fechaStr === "number") {
    // Serial de Excel
    return new Date(
      Math.round((fechaStr - 25569) * 86400 * 1000) + 24 * 60 * 60 * 1000
    );
  }
  if (!fechaStr || typeof fechaStr !== "string") return null;
  // Si algún día viene como string tipo '17-jun', aquí puedes agregar el parseo
  return null;
}

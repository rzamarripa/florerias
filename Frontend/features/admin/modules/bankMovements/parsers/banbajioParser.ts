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
    
    // Limpiar la cadena de espacios y caracteres especiales
    const cleanStr = fechaStr.trim();
    const [dd, mm, aa] = cleanStr.split("/");
    
    if (!dd || !mm || !aa) {
      console.warn(`Formato de fecha inválido: ${fechaStr}`);
      return null;
    }
    
    const dayNum = Number(dd);
    const monthNum = Number(mm);
    const yearNum = Number(aa);
    
    // Validar rangos básicos
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
      console.warn(`Fecha fuera de rango: ${fechaStr}`);
      return null;
    }
    
    // Convertir año de 2 dígitos a 4 dígitos
    const year = yearNum < 100 ? 2000 + yearNum : yearNum;
    
    // Crear fecha (mes - 1 porque Date usa 0-11 para meses)
    const date = new Date(year, monthNum - 1, dayNum);
    
    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn(`Fecha inválida creada: ${fechaStr} -> ${date}`);
      return null;
    }
    
    // Verificar que los componentes de la fecha coinciden con los valores originales
    if (date.getDate() !== dayNum || date.getMonth() !== (monthNum - 1) || date.getFullYear() !== year) {
      console.warn(`Fecha inconsistente: ${fechaStr} -> ${date}`);
      return null;
    }
    
    return date;
  }
  return dataRows.map((row, i) => {
    const obj: Record<string, any> = {};
    headers.forEach((header: string, idx: number) => {
      obj[header] = row[idx];
    });
    // Tomar fecha de la columna B (índice 1) directamente del array row
    let fecha = row[1]; // Columna B (segunda columna) contiene la fecha en formato dd/mm/aa
    let hora = obj["Hora"];
    let fechaObj: Date | null = null;
    let advertencia = "";
    
    // Debug: Log de la fecha que se está procesando
    if (i < 3) { // Solo para las primeras 3 filas para evitar spam
      console.log(`Fila ${i}: Fecha de columna B =`, fecha, typeof fecha);
    }
    
    if (typeof fecha === "number") {
      fechaObj = parseExcelDate(fecha);
    } else if (typeof fecha === "string" && fecha.trim() !== "") {
      // Usar parseAfirmeDate para formato dd/mm/aa
      fechaObj = parseAfirmeDate(fecha.trim());
      if (i < 3) {
        console.log(`Fila ${i}: Fecha parseada =`, fechaObj);
      }
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

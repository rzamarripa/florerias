import xlsx from "xlsx";

// Convierte un serial de fecha de Excel a un objeto Date de JS (solo fecha)
function parseExcelDate(excelDate) {
  // Excel serial date to JS Date (corrige desfase de zona horaria sumando 1 día)
  return new Date(
    Math.round((excelDate - 25569) * 86400 * 1000) + 24 * 60 * 60 * 1000
  );
}

// Convierte un serial de hora de Excel a string HH:mm:ss
function parseExcelTime(excelTime) {
  if (typeof excelTime !== "number") return String(excelTime);
  const totalSeconds = Math.round(86400 * (excelTime % 1));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Parsea un archivo Excel de movimientos bancarios (formato tipo Banorte/Afirme)
 * @param {Buffer} buffer - El buffer del archivo Excel
 * @param {Object} options - Opciones (puedes pasar el nombre del archivo, etc)
 * @returns {Array} Array de movimientos normalizados
 */
export function parseMovementsExcel(buffer, options = {}) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  // Buscar la fila de encabezados real
  const headerIndex = rows.findIndex(
    (row) =>
      Array.isArray(row) &&
      row.includes("Fecha Movimiento") &&
      row.includes("Descripción")
  );
  if (headerIndex === -1) return [];
  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  // Lectura manual y validación
  const movimientos = dataRows
    .map((row, i) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx];
      });
      // Validaciones y transformaciones
      // Fecha
      let fecha = obj["Fecha Movimiento"];
      let hora = obj["Hora"];
      let fechaObj = null;
      if (typeof fecha === "number") {
        fechaObj = parseExcelDate(fecha);
      } else if (typeof fecha === "string" && fecha.trim() !== "") {
        fechaObj = new Date(Date.parse(fecha.replace(/\./g, "/")));
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
      // Montos
      const parseMonto = (val) => {
        if (!val) return 0;
        if (typeof val === "number") return val;
        return Number(String(val).replace(/[^\d.-]+/g, "")) || 0;
      };
      const getCol = (obj, keys) => {
        for (const k of keys) {
          if (obj[k] !== undefined) return obj[k];
        }
        return undefined;
      };
      const cargos = parseMonto(getCol(obj, ["Cargo", "Cargos"]));
      const abonos = parseMonto(getCol(obj, ["Abono", "Abonos"]));
      const saldo = parseMonto(obj["Saldo"]);
      return {
        fecha: fechaObj,
        concepto: obj["Descripción"] || "",
        referencia: obj["Recibo"] || "",
        cargo: cargos,
        abono: abonos,
        saldo: saldo,
      };
    })
    // Solo movimientos con fecha válida
    .filter((mov) => mov.fecha instanceof Date && !isNaN(mov.fecha.getTime()));

  return movimientos;
}

import { BankMovement } from "../models/BankMovement.js";
import { BankAccount } from "../models/BankAccount.js";
import { LogImportBankMovements } from "../models/LogImportBankMovements.js";

// Importar movimientos bancarios desde JSON
export const importBankMovements = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { company, bankAccount, movimientos } = req.body;
    console.log("company", company);
    if (!company || !bankAccount || !Array.isArray(movimientos)) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos obligatorios" });
    }
    // Buscar la cuenta bancaria para obtener el banco
    const account = await BankAccount.findById(bankAccount);
    if (!account) {
      return res
        .status(400)
        .json({ success: false, message: "Cuenta bancaria no encontrada" });
    }
    // Enriquecer movimientos
    const docs = movimientos.map((mov) => {
      console.log("Movimiento recibido:", {
        cargo: { tipo: typeof mov.cargo, valor: mov.cargo },
        abono: { tipo: typeof mov.abono, valor: mov.abono },
        saldo: { tipo: typeof mov.saldo, valor: mov.saldo },
      });

      // Asegurar que los valores sean números
      const cargoNum = Number(mov.cargo);
      const abonoNum = Number(mov.abono);
      const saldoNum = Number(mov.saldo);

      console.log("Valores convertidos:", {
        cargoNum,
        abonoNum,
        saldoNum,
      });

      const movimientoEnriquecido = {
        ...mov,
        cargo: cargoNum,
        abono: abonoNum,
        saldo: saldoNum,
        company,
        bankAccount,
        bank: account.bank,
      };

      console.log("Movimiento a guardar:", {
        cargo: {
          tipo: typeof movimientoEnriquecido.cargo,
          valor: movimientoEnriquecido.cargo,
        },
        abono: {
          tipo: typeof movimientoEnriquecido.abono,
          valor: movimientoEnriquecido.abono,
        },
        saldo: {
          tipo: typeof movimientoEnriquecido.saldo,
          valor: movimientoEnriquecido.saldo,
        },
      });

      return movimientoEnriquecido;
    });

    console.log("Documentos a insertar:", JSON.stringify(docs, null, 2));

    try {
      const resultado = await BankMovement.insertMany(docs);
      console.log(
        "Resultado de inserción:",
        JSON.stringify(resultado, null, 2)
      );
      // Registrar en la bitácora de importación de movimientos bancarios
      await LogImportBankMovements.create({
        company,
        bankAccount,
        user: req.user?._id, // si tienes autenticación
        fileName: req.file?.originalname, // si usas multer
        count: docs.length,
      });
      res.json({
        success: true,
        message: `Se importaron ${docs.length} movimientos.`,
        count: docs.length,
      });
    } catch (error) {
      console.error("Error en insertMany:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    console.error("Error importando movimientos:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

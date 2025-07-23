import { BankMovement } from "../models/BankMovement.js";
import { BankAccount } from "../models/BankAccount.js";
import { LogImportBankMovements } from "../models/LogImportBankMovements.js";

export const importBankMovements = async (req, res) => {
  try {
    const { company, bankAccount, movimientos, finalBalance } = req.body;

    if (!company || !bankAccount || !Array.isArray(movimientos)) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos obligatorios" });
    }

    const account = await BankAccount.findById(bankAccount);
    
    if (!account) {
      return res
        .status(400)
        .json({ success: false, message: "Cuenta bancaria no encontrada" });
    }

    const docs = movimientos.map((mov) => {
      const cargoNum = Number(mov.cargo);
      const abonoNum = Number(mov.abono);
      const saldoNum = Number(mov.saldo);

      const movimientoEnriquecido = {
        ...mov,
        cargo: cargoNum,
        abono: abonoNum,
        saldo: saldoNum,
        company,
        bankAccount,
        bank: account.bank,
      };

      return movimientoEnriquecido;
    });

    try {
      await BankMovement.insertMany(docs);

      await LogImportBankMovements.create({
        company,
        bankAccount,
        user: req.user?._id,
        fileName: req.file?.originalname,
        count: docs.length,
      });
      
      // Use finalBalance from frontend instead of calculating from array
      const saldoFinalCalculado = finalBalance !== undefined && finalBalance !== null 
        ? Number(finalBalance) 
        : docs[docs.length - 1].saldo;
        
      await BankAccount.findByIdAndUpdate(bankAccount, {
        currentBalance: saldoFinalCalculado,
      });
      
      res.json({
        success: true,
        message: `Se importaron ${docs.length} movimientos y se actualizó el saldo de la cuenta bancaria a ${saldoFinalCalculado}.`,
        count: docs.length,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

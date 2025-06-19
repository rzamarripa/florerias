import { LogImportBankMovements } from "../models/LogImportBankMovements.js";
import { BankAccount } from "../models/BankAccount.js";

export const getTodayImportBankMovements = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const logs = await LogImportBankMovements.find({
      importedAt: { $gte: today, $lt: tomorrow },
    }).populate("company bankAccount user");

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBankAccountsImportStatusToday = async (req, res) => {
  try {
    // Obtener todas las cuentas bancarias activas
    const bankAccounts = await BankAccount.find({ isActive: true })
      .populate("company", "name")
      .populate("bank", "name")
      .sort({ "company.name": 1, "bank.name": 1, accountNumber: 1 });

    // Obtener los logs de importación de hoy y nada más hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayLogs = await LogImportBankMovements.find({
      importedAt: { $gte: today, $lt: tomorrow },
    });

    // Crear un Set con los IDs de las cuentas importadas hoy
    const importedAccountIds = new Set(
      todayLogs.map((log) => log.bankAccount.toString())
    );

    // Agregar el flag importedToday a cada cuenta
    const accountsWithStatus = bankAccounts.map((account) => ({
      _id: account._id,
      accountNumber: account.accountNumber,
      clabe: account.clabe,
      bank: account.bank,
      company: account.company,
      importedToday: importedAccountIds.has(account._id.toString()),
    }));

    res.json({ success: true, data: accountsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

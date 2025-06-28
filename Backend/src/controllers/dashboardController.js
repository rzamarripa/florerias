import moment from "moment-timezone";
import { BankAccount } from "../models/BankAccount.js";
import { LogImportBankMovements } from "../models/LogImportBankMovements.js";

export const getImportStatusByAccount = async (req, res) => {
  try {
    const startOfWeek = moment()
      .tz("America/Mazatlan")
      .startOf("isoWeek")
      .toDate();
    const endOfWeek = moment().tz("America/Mazatlan").endOf("isoWeek").toDate();

    const bankAccounts = await BankAccount.find({ isActive: true })
      .populate("company", "name")
      .populate("bank", "name");

    const importLogs = await LogImportBankMovements.find({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      status: "completed",
    });

    const importStatusByAccount = bankAccounts.map((account) => {
      const dailyStatus = Array(7).fill(false);
      const accountLogs = importLogs.filter(
        (log) => log.bankAccount.toString() === account._id.toString()
      );

      accountLogs.forEach((log) => {
        const dayOfWeek =
          moment(log.createdAt).tz("America/Mazatlan").isoWeekday() - 1;
        dailyStatus[dayOfWeek] = true;
      });

      return {
        accountId: account._id,
        accountNumber: account.accountNumber,
        companyName: account.company.name,
        bankName: account.bank ? account.bank.name : "N/A",
        currentBalance: account.currentBalance,
        dailyStatus,
      };
    });

    res.status(200).json({
      success: true,
      data: importStatusByAccount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { BankAccount } from "../models/BankAccount.js";

export const getAllBankAccounts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filters = {};

    if (search) {
      filters.$or = [
        { accountNumber: { $regex: search, $options: "i" } },
        { clabe: { $regex: search, $options: "i" } },
        { branch: { $regex: search, $options: "i" } },
      ];
    }
    if (req.query.company) {
      filters.company = req.query.company;
    }

    const total = await BankAccount.countDocuments(filters);
    const bankAccounts = await BankAccount.find(filters)
      .populate("company", "name")
      .populate("bank", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: bankAccounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBankAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const bankAccount = await BankAccount.findById(id)
      .populate("company", "name")
      .populate("bank", "name");
    if (!bankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }
    res.status(200).json({ success: true, data: bankAccount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBankAccount = async (req, res) => {
  try {
    const { company, bank, accountNumber, clabe, branch } = req.body;
    const newBankAccount = await BankAccount.create({
      company,
      bank,
      accountNumber: accountNumber.trim(),
      clabe: clabe.trim(),
      branch: branch?.trim() || "",
      isActive: true,
    });
    res.status(201).json({
      success: true,
      data: newBankAccount,
      message: "Bank account created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { company, bank, accountNumber, clabe, branch } = req.body;
    const updatedBankAccount = await BankAccount.findByIdAndUpdate(
      id,
      {
        company,
        bank,
        accountNumber: accountNumber.trim(),
        clabe: clabe.trim(),
        branch: branch?.trim() || "",
      },
      { new: true }
    );
    if (!updatedBankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }
    res.json({
      success: true,
      data: updatedBankAccount,
      message: "Bank account updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBankAccount = await BankAccount.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!deletedBankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }
    res.json({
      success: true,
      message: "Bank account deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const activatedBankAccount = await BankAccount.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!activatedBankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }
    res.json({ success: true, message: "Bank account activated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveBankAccountsCount = async (req, res) => {
  try {
    const { company } = req.query;
    const filters = { isActive: true };

    if (company) {
      filters.company = company;
    }

    const count = await BankAccount.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET - Obtener cuentas bancarias por companyId
export const getBankAccountsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId es requerido',
      });
    }

    const bankAccounts = await BankAccount.find({ 
      companyId: companyId,
      isActive: true 
    })
    .populate('bankId', 'name')
    .select('_id accountNumber accountType bankId')
    .sort({ accountNumber: 1 });

    res.status(200).json({
      success: true,
      data: bankAccounts,
    });
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

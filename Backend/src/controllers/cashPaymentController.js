import { CashPayment } from "../models/CashPayment.js";

export const getAllCashPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await CashPayment.countDocuments();
        const payments = await CashPayment.find()
            .populate({
                path: "expenseConcept",
                populate: { path: "categoryId", select: "name" },
                select: "name description categoryId"
            })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const response = {
            success: true,
            data: payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('CashPayment getAllCashPayments - Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCashPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await CashPayment.findById(id)
            .populate({
                path: "expenseConcept",
                populate: { path: "categoryId", select: "name" },
                select: "name description categoryId"
            });
        if (!payment) {
            return res.status(404).json({ success: false, message: "Cash payment not found" });
        }
        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCashPayment = async (req, res) => {
    try {
        const { amount, expenseConcept, description } = req.body;
        const newPayment = await CashPayment.create({
            amount,
            expenseConcept,
            description,
        });
        const populatedPayment = await CashPayment.findById(newPayment._id)
            .populate({
                path: "expenseConcept",
                populate: { path: "categoryId", select: "name" },
                select: "name description categoryId"
            });
        res.status(201).json({ success: true, data: populatedPayment, message: "Cash payment created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCashPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, expenseConcept, description } = req.body;
        const updatedPayment = await CashPayment.findByIdAndUpdate(
            id,
            { amount, expenseConcept, description },
            { new: true }
        )
            .populate({
                path: "expenseConcept",
                populate: { path: "categoryId", select: "name" },
                select: "name description categoryId"
            });
        if (!updatedPayment) {
            return res.status(404).json({ success: false, message: "Cash payment not found" });
        }
        res.json({ success: true, data: updatedPayment, message: "Cash payment updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCashPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPayment = await CashPayment.findByIdAndDelete(id);
        if (!deletedPayment) {
            return res.status(404).json({ success: false, message: "Cash payment not found" });
        }
        res.json({ success: true, message: "Cash payment deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 
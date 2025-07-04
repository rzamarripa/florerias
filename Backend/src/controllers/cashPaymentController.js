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
        const { importeAPagar, expenseConcept, description } = req.body;
        const newPayment = await CashPayment.create({
            importeAPagar,
            expenseConcept,
            description,
            importePagado: importeAPagar
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
        const { importeAPagar, expenseConcept, description } = req.body;
        const updatedPayment = await CashPayment.findByIdAndUpdate(
            id,
            { importeAPagar, expenseConcept, description },
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

// Autorizar pago en efectivo dentro de un paquete
export const authorizeCashPaymentInPackage = async (req, res) => {
    try {
        const { packageId, cashPaymentId } = req.body;
        if (!packageId || !cashPaymentId) {
            return res.status(400).json({ success: false, message: 'packageId y cashPaymentId son requeridos' });
        }
        const { InvoicesPackage } = await import('../models/InvoicesPackpage.js');
        const paquete = await InvoicesPackage.findById(packageId);
        if (!paquete) {
            return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
        }
        // Buscar el pago embebido
        const pago = paquete.pagosEfectivo.find(p => p._id.toString() === cashPaymentId);
        if (!pago) {
            return res.status(404).json({ success: false, message: 'Pago en efectivo no encontrado en el paquete' });
        }
        // Cambiar estado en el embebido
        pago.autorizada = true;
        pago.pagoRechazado = false;
        pago.estadoPago = 2; // Pagado
        pago.esCompleta = true;
        pago.registrado = 1;
        pago.pagado = 1;
        pago.descripcionPago = 'Pago autorizado';
        pago.fechaRevision = new Date();
        await paquete.save();
        // Actualizar el registro original
        await CashPayment.findByIdAndUpdate(cashPaymentId, {
            $set: {
                autorizada: true,
                pagoRechazado: false,
                estadoPago: 2,
                esCompleta: true,
                registrado: 1,
                pagado: 1,
                descripcionPago: 'Pago autorizado',
                fechaRevision: new Date(),
                importePagado: pago.importeAPagar
            }
        });
        await paquete.actualizarTotales();
        res.status(200).json({ success: true, message: 'Pago en efectivo autorizado correctamente' });
    } catch (error) {
        console.error('Error autorizando pago en efectivo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Rechazar pago en efectivo dentro de un paquete
export const rejectCashPaymentInPackage = async (req, res) => {
    try {
        const { packageId, cashPaymentId } = req.body;
        if (!packageId || !cashPaymentId) {
            return res.status(400).json({ success: false, message: 'packageId y cashPaymentId son requeridos' });
        }
        const { InvoicesPackage } = await import('../models/InvoicesPackpage.js');
        const paquete = await InvoicesPackage.findById(packageId);
        if (!paquete) {
            return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
        }
        // Buscar el pago embebido
        const pago = paquete.pagosEfectivo.find(p => p._id.toString() === cashPaymentId);
        if (!pago) {
            return res.status(404).json({ success: false, message: 'Pago en efectivo no encontrado en el paquete' });
        }
        // Cambiar estado en el embebido
        pago.autorizada = false;
        pago.pagoRechazado = true;
        pago.estadoPago = 0; // Pendiente
        pago.esCompleta = false;
        pago.registrado = 1;
        pago.pagado = 0;
        pago.descripcionPago = 'Pago rechazado';
        pago.fechaRevision = new Date();
        await paquete.save();
        // Actualizar el registro original
        await CashPayment.findByIdAndUpdate(cashPaymentId, {
            $set: {
                autorizada: false,
                pagoRechazado: true,
                estadoPago: 0,
                esCompleta: false,
                registrado: 1,
                pagado: 0,
                descripcionPago: 'Pago rechazado',
                fechaRevision: new Date(),
                importePagado: 0
            }
        });
        await paquete.actualizarTotales();
        res.status(200).json({ success: true, message: 'Pago en efectivo rechazado correctamente' });
    } catch (error) {
        console.error('Error rechazando pago en efectivo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addCashPaymentToPackage = async (req, res) => {
    try {
        const { packageId, importeAPagar, expenseConcept, description } = req.body;
        if (!packageId || !importeAPagar || !expenseConcept) {
            return res.status(400).json({ success: false, message: 'packageId, importeAPagar y expenseConcept son requeridos' });
        }
        const { InvoicesPackage } = await import('../models/InvoicesPackpage.js');
        // 1. Crear el pago en cc_cash_payment
        const newPayment = await CashPayment.create({ importeAPagar, expenseConcept, description, importePagado: importeAPagar });
        // 2. Buscar el paquete
        const paquete = await InvoicesPackage.findById(packageId);
        if (!paquete) {
            return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
        }
        // 3. Embebe el pago completo en pagosEfectivo
        const pagoData = newPayment.toObject();
        pagoData.autorizada = null;
        pagoData.estadoPago = 0;
        pagoData.esCompleta = false;
        pagoData.pagoRechazado = false;
        pagoData.registrado = 0;
        pagoData.pagado = 0;
        pagoData.descripcionPago = '';
        pagoData.fechaRevision = new Date();
        paquete.pagosEfectivo.push(pagoData);
        await paquete.save();
        await paquete.actualizarTotales();
        res.status(201).json({ success: true, data: paquete, message: 'Pago en efectivo agregado al paquete correctamente' });
    } catch (error) {
        console.error('Error agregando pago en efectivo a paquete:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}; 
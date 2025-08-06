import { PaymentsByProvider } from "../models/PaymentsByProvider.js";
import { BankNumber } from "../models/BankNumber.js";
import { Provider } from "../models/Provider.js";

export const paymentsByProviderController = {
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (page - 1) * limit;

      let query = {};
      if (search) {
        query.$or = [
          { providerRfc: { $regex: search, $options: "i" } },
          { providerName: { $regex: search, $options: "i" } },
          { companyProvider: { $regex: search, $options: "i" } },
          { groupingFolio: { $regex: search, $options: "i" } },
        ];
      }

      const payments = await PaymentsByProvider.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await PaymentsByProvider.countDocuments(query);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener pagos por proveedor",
        error: error.message,
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await PaymentsByProvider.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Pago por proveedor no encontrado",
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener pago por proveedor",
        error: error.message,
      });
    }
  },

  create: async (req, res) => {
    try {
      const { totalAmount, providerRfc, providerName, branchName, companyProvider, bankNumber } = req.body;

      const newPayment = new PaymentsByProvider({
        totalAmount,
        providerRfc,
        providerName,
        branchName,
        companyProvider,
        bankNumber,
      });

      await newPayment.save();

      res.status(201).json({
        success: true,
        message: "Pago por proveedor creado exitosamente",
        data: newPayment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear pago por proveedor",
        error: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { totalAmount, providerRfc, providerName, branchName, companyProvider, bankNumber } = req.body;

      const updatedPayment = await PaymentsByProvider.findByIdAndUpdate(
        id,
        { totalAmount, providerRfc, providerName, branchName, companyProvider, bankNumber },
        { new: true }
      );

      if (!updatedPayment) {
        return res.status(404).json({
          success: false,
          message: "Pago por proveedor no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Pago por proveedor actualizado exitosamente",
        data: updatedPayment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar pago por proveedor",
        error: error.message,
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedPayment = await PaymentsByProvider.findByIdAndDelete(id);

      if (!deletedPayment) {
        return res.status(404).json({
          success: false,
          message: "Pago por proveedor no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Pago por proveedor eliminado exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar pago por proveedor",
        error: error.message,
      });
    }
  },

  groupInvoicesByProvider: async (req, res) => {
    try {
      console.log("Iniciando groupInvoicesByProvider con datos:", req.body);
      const { packageIds, bankAccountId } = req.body;

      if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
        console.log("Error: packageIds inválidos:", packageIds);
        return res.status(400).json({
          success: false,
          message: "Se requieren IDs de paquetes válidos",
        });
      }

      if (!bankAccountId) {
        console.log("Error: bankAccountId faltante");
        return res.status(400).json({
          success: false,
          message: "Se requiere ID de cuenta bancaria",
        });
      }

      console.log("Datos válidos recibidos. packageIds:", packageIds, "bankAccountId:", bankAccountId);

      // Obtener todos los paquetes con sus facturas
      let InvoicesPackage, BankAccount;
      
      try {
        const invoicesPackageModule = await import("../models/InvoicesPackpage.js");
        const bankAccountModule = await import("../models/BankAccount.js");
        InvoicesPackage = invoicesPackageModule.InvoicesPackage;
        BankAccount = bankAccountModule.BankAccount;
      } catch (importError) {
        console.error("Error importando modelos:", importError);
        return res.status(500).json({
          success: false,
          message: "Error interno del servidor al cargar modelos",
          error: importError.message,
        });
      }

      console.log("Buscando paquetes con IDs:", packageIds);
      const packages = await InvoicesPackage.find({ _id: { $in: packageIds } })
        .populate("facturas")
        .populate("pagosEfectivo");

      console.log("Paquetes encontrados:", packages.length);

      if (packages.length === 0) {
        console.log("No se encontraron paquetes");
        return res.status(404).json({
          success: false,
          message: "No se encontraron paquetes",
        });
      }

      // Obtener información de la cuenta bancaria
      console.log("Buscando cuenta bancaria con ID:", bankAccountId);
      const bankAccount = await BankAccount.findById(bankAccountId)
        .populate("bank");

      console.log("Cuenta bancaria encontrada:", bankAccount ? "Sí" : "No");

      if (!bankAccount) {
        console.log("Cuenta bancaria no encontrada");
        return res.status(404).json({
          success: false,
          message: "Cuenta bancaria no encontrada",
        });
      }

      // Agrupar facturas por proveedor
      const providerGroups = new Map();

      packages.forEach(pkg => {
        // Procesar facturas
        if (pkg.facturas && Array.isArray(pkg.facturas)) {
          pkg.facturas.forEach(factura => {
            // Verificar que la factura tenga RFC y que tenga algún importe
            if (factura.rfcEmisor && 
                (factura.importePagado > 0 || 
                 factura.importeAPagar > 0 || 
                 factura.autorizada || 
                 factura.estadoPago === 2)) {
              
              const rfcEmisor = factura.rfcEmisor.toUpperCase().trim();
              
              if (!providerGroups.has(rfcEmisor)) {
                providerGroups.set(rfcEmisor, {
                  rfc: rfcEmisor,
                  totalAmount: 0,
                  invoices: []
                });
              }
              
              const group = providerGroups.get(rfcEmisor);
              console.log("Grupo encontrado:", group);

              const amountToAdd = factura.importePagado && factura.importePagado.$numberDecimal
                ? parseFloat(factura.importePagado.$numberDecimal)
                : factura.importeAPagar && factura.importeAPagar.$numberDecimal
                ? parseFloat(factura.importeAPagar.$numberDecimal)
                : 0;
              group.totalAmount += amountToAdd;
              group.invoices.push(factura);
            }
          });
        }

        // Procesar pagos en efectivo (si aplica)
        if (pkg.pagosEfectivo && Array.isArray(pkg.pagosEfectivo)) {
          pkg.pagosEfectivo.forEach(pago => {
            const cashAmount = pago.importePagado && pago.importePagado.$numberDecimal
              ? parseFloat(pago.importePagado.$numberDecimal)
              : 0;
            if (cashAmount > 0) {
              // Para pagos en efectivo, usar un RFC especial o agrupar por concepto
              const rfcKey = `EFECTIVO_${pago.expenseConcept?.name || 'SIN_CONCEPTO'}`;
              
              if (!providerGroups.has(rfcKey)) {
                providerGroups.set(rfcKey, {
                  rfc: rfcKey,
                  totalAmount: 0,
                  invoices: [],
                  isCashPayment: true,
                  expenseConcept: pago.expenseConcept
                });
              }
              
              const group = providerGroups.get(rfcKey);
              group.totalAmount += cashAmount;
              group.invoices.push(pago);
            }
          });
        }
      });

      console.log("Grupos de proveedores encontrados:", providerGroups.size);

      // Obtener información de proveedores
      const rfcs = Array.from(providerGroups.keys()).filter(rfc => !rfc.startsWith('EFECTIVO_'));
      const providers = await Provider.find({ rfc: { $in: rfcs } })
        .populate('bank')
        .populate('sucursal');

      console.log("Proveedores encontrados:", providers.length);

      // Crear registros en PaymentsByProvider
      const createdPayments = [];

      for (const [rfc, group] of providerGroups) {
        if (group.isCashPayment) {
          // Para pagos en efectivo, crear registro especial
          const cashPayment = new PaymentsByProvider({
            totalAmount: group.totalAmount,
            providerRfc: rfc,
            providerName: group.expenseConcept?.name || 'Pago en Efectivo',
            branchName: 'N/A',
            companyProvider: 'Pago en Efectivo',
            bankNumber: '00000', // Número especial para pagos en efectivo
            debitedBankAccount: bankAccount._id,
          });
          
          await cashPayment.save();
          createdPayments.push(cashPayment);
        } else {
          // Para proveedores regulares
          const provider = providers.find(p => p.rfc === rfc);
          
          if (provider) {
            console.log("Procesando proveedor:", provider.rfc, provider.commercialName);
            console.log("Banco del proveedor:", provider.bank?.name);
            console.log("Sucursal del proveedor:", provider.sucursal?.name);
            
            // Buscar número de banco en BankNumber
            const bankNumberRecord = await BankNumber.findOne({
              bankDebited: bankAccount.bank._id,
              bankCredited: provider.bank.name
            });

            console.log("Registro de número de banco encontrado:", bankNumberRecord ? "Sí" : "No");

            const bankNumber = bankNumberRecord ? bankNumberRecord.bankNumber : '00000';

            const payment = new PaymentsByProvider({
              totalAmount: group.totalAmount,
              providerRfc: provider.rfc,
              providerName: provider.commercialName,
              branchName: provider.sucursal?.name || 'N/A',
              companyProvider: provider.businessName,
              bankNumber: bankNumber,
              debitedBankAccount: bankAccount._id,
            });

            await payment.save();
            createdPayments.push(payment);
            console.log("Pago creado para proveedor:", provider.rfc);
          } else {
            console.log("Proveedor no encontrado para RFC:", rfc);
          }
        }
      }

      console.log("Pagos creados:", createdPayments);

      res.json({
        success: true,
        message: `${createdPayments.length} grupos de pagos por proveedor creados exitosamente`,
        data: createdPayments,
      });
    } catch (error) {
      console.error("Error en groupInvoicesByProvider:", error);
      res.status(500).json({
        success: false,
        message: "Error al agrupar facturas por proveedor",
        error: error.message,
      });
    }
  },
}; 
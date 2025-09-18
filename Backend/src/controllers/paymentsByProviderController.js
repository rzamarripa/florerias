import { PaymentsByProvider } from "../models/PaymentsByProvider.js";
import { BankNumber } from "../models/BankNumber.js";
import { Provider } from "../models/Provider.js";
import { BankLayout } from "../models/BankLayout.js";

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
      const { packageIds, bankAccountId, companyId } = req.body;

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

      if (!companyId) {
        console.log("Error: companyId faltante");
        return res.status(400).json({
          success: false,
          message: "Se requiere ID de empresa",
        });
      }

      console.log("Datos válidos recibidos. packageIds:", packageIds, "bankAccountId:", bankAccountId);

      // Función para generar referencia con formato específico: fecha + año + mes + día + horas + minutos + segundos + 2 dígitos random
      const generateReferenciaCode = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');  
        const year = String(now.getFullYear()).slice(-2); // últimos 2 dígitos del año
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const randomDigits = String(Math.floor(Math.random() * 100)).padStart(2, '0'); // 2 dígitos random
        
        return `${day}${month}${year}${hours}${minutes}${seconds}${randomDigits}`;
      };

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

              // Mejorar el cálculo del importe
              let amountToAdd = 0;
              
              if (factura.importePagado) {
                if (typeof factura.importePagado === 'number') {
                  amountToAdd = factura.importePagado;
                } else if (factura.importePagado.$numberDecimal) {
                  amountToAdd = parseFloat(factura.importePagado.$numberDecimal);
                } else if (typeof factura.importePagado === 'string') {
                  amountToAdd = parseFloat(factura.importePagado);
                }
              } else if (factura.importeAPagar) {
                if (typeof factura.importeAPagar === 'number') {
                  amountToAdd = factura.importeAPagar;
                } else if (factura.importeAPagar.$numberDecimal) {
                  amountToAdd = parseFloat(factura.importeAPagar.$numberDecimal);
                } else if (typeof factura.importeAPagar === 'string') {
                  amountToAdd = parseFloat(factura.importeAPagar);
                }
              }

              console.log(`Factura ${factura.folio || factura._id}: importePagado=${factura.importePagado}, importeAPagar=${factura.importeAPagar}, amountToAdd=${amountToAdd}`);
              
              group.totalAmount += amountToAdd;
              group.invoices.push(factura);
              
              console.log(`Total acumulado para ${rfcEmisor}: ${group.totalAmount}`);
            }
          });
        }

        // Procesar pagos en efectivo (si aplica)
        if (pkg.pagosEfectivo && Array.isArray(pkg.pagosEfectivo)) {
          pkg.pagosEfectivo.forEach(pago => {
            let cashAmount = 0;
            
            if (pago.importePagado) {
              if (typeof pago.importePagado === 'number') {
                cashAmount = pago.importePagado;
              } else if (pago.importePagado.$numberDecimal) {
                cashAmount = parseFloat(pago.importePagado.$numberDecimal);
              } else if (typeof pago.importePagado === 'string') {
                cashAmount = parseFloat(pago.importePagado);
              }
            }
            
            console.log(`Pago efectivo: importePagado=${pago.importePagado}, cashAmount=${cashAmount}`);
            
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

      // Crear registros en PaymentsByProvider (siempre crear nuevos, nunca actualizar)
      const createdPayments = [];

      for (const [rfc, group] of providerGroups) {
        console.log(`Procesando grupo ${rfc}: totalAmount=${group.totalAmount}, facturas=${group.invoices.length}`);
        console.log(`Creando nueva agrupación para RFC ${rfc}`);
        
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
            companyId: companyId,
            facturas: group.invoices.map(invoice => invoice._id),
            packageIds: packageIds,
            referencia: generateReferenciaCode(),
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

            console.log(`Creando nueva agrupación para proveedor ${provider.rfc}: totalAmount=${group.totalAmount}, facturas=${group.invoices.length}`);
            
            const payment = new PaymentsByProvider({
              totalAmount: group.totalAmount,
              providerRfc: provider.rfc,
              providerName: provider.commercialName,
              branchName: provider.sucursal?.name || 'N/A',
              companyProvider: provider.businessName,
              bankNumber: bankNumber,
              debitedBankAccount: bankAccount._id,
              companyId: companyId,
              facturas: group.invoices.map(invoice => invoice._id),
              packageIds: packageIds,
              referencia: generateReferenciaCode(),
            });

            await payment.save();
            createdPayments.push(payment);
            console.log("Nueva agrupación creada para proveedor:", provider.rfc);
          } else {
            console.log("Proveedor no encontrado para RFC:", rfc);
          }
        }
      }

      console.log("Pagos creados:", createdPayments.length);

      // Crear registro de layout para agrupaciones
      let layoutRecord = null;
      if (createdPayments.length > 0) {
        try {
          // Obtener información de la empresa
          let Company;
          try {
            const companyModule = await import("../models/Company.js");
            Company = companyModule.Company;
          } catch (importError) {
            console.error("Error importando modelo Company:", importError);
          }

          const company = Company ? await Company.findById(companyId) : null;
          
          // Calcular total amount de todas las agrupaciones
          const totalLayoutAmount = createdPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

          layoutRecord = new BankLayout({
            tipoLayout: 'grouped',
            companyId: companyId,
            companyName: company ? company.name : 'Empresa no encontrada',
            companyRfc: company ? company.rfc : 'RFC no encontrado',
            bankAccountId: bankAccount._id,
            bankAccountNumber: bankAccount.accountNumber,
            bankName: bankAccount.bank?.name || 'Banco desconocido',
            packageIds: packageIds,
            agrupaciones: createdPayments.map(payment => payment._id),
            totalAmount: totalLayoutAmount,
            totalRegistros: createdPayments.length,
            totalPackages: packageIds.length,
            metadatos: {
              registrosExcel: createdPayments.length,
              tiempoProcesamiento: 0,
              version: '1.0'
            }
          });

          await layoutRecord.save();
          console.log(`Layout ${layoutRecord.layoutFolio} creado con ${createdPayments.length} agrupaciones`);

        } catch (layoutError) {
          console.error("Error creando registro de layout:", layoutError);
          // No fallar la operación principal si falla la creación del layout
        }
      }

      const totalProcessed = createdPayments.length;
      const allPayments = [...createdPayments];

      let message = '';
      if (createdPayments.length > 0) {
        message = `${createdPayments.length} nuevas agrupaciones de pagos por proveedor creadas exitosamente`;
        if (layoutRecord) {
          message += ` - Layout ${layoutRecord.layoutFolio} generado`;
        }
      } else {
        message = 'No se procesaron agrupaciones de pagos por proveedor';
      }

      res.json({
        success: true,
        message: message,
        data: allPayments,
        layout: layoutRecord ? {
          id: layoutRecord._id,
          folio: layoutRecord.layoutFolio,
          tipo: layoutRecord.tipoLayout,
          totalAmount: layoutRecord.totalAmount,
          totalRegistros: layoutRecord.totalRegistros
        } : null,
        summary: {
          created: createdPayments.length,
          updated: 0,
          total: totalProcessed
        }
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

  getBankLayouts: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      // Obtener layouts sin populate para evitar errores de modelos no registrados
      const layouts = await BankLayout.find({})
        .sort({ fechaLayout: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BankLayout.countDocuments({});

      // Procesar layouts para agregar información calculada
      const processedLayouts = await Promise.all(layouts.map(async layout => {
        let cantidadProveedores = 0;
        let cantidadFacturas = 0;

        if (layout.tipoLayout === 'grouped') {
          // Para layouts agrupados, usar los campos ya calculados
          cantidadProveedores = layout.agrupaciones ? layout.agrupaciones.length : 0;
          
          // Calcular el total de facturas sumando las facturas de cada agrupación
          if (layout.agrupaciones && layout.agrupaciones.length > 0) {
            const agrupacionesConFacturas = await PaymentsByProvider.find({
              _id: { $in: layout.agrupaciones }
            }).select('facturas');
            
            cantidadFacturas = agrupacionesConFacturas.reduce((total, agrupacion) => {
              return total + (agrupacion.facturas ? agrupacion.facturas.length : 0);
            }, 0);
          }
        } else if (layout.tipoLayout === 'individual') {
          // Para layouts individuales, contar proveedores únicos de las facturas
          const rfcsUnicos = new Set();
          if (layout.facturasIndividuales && layout.facturasIndividuales.length > 0) {
            layout.facturasIndividuales.forEach(factura => {
              if (factura.rfcEmisor) {
                rfcsUnicos.add(factura.rfcEmisor);
              }
            });
          }
          cantidadProveedores = rfcsUnicos.size;
          cantidadFacturas = layout.facturasIndividuales ? layout.facturasIndividuales.length : 0;
        }

        return {
          _id: layout._id,
          layoutFolio: layout.layoutFolio,
          tipoLayout: layout.tipoLayout,
          descripcionTipo: layout.tipoLayout === 'grouped' ? 'Agrupado por Proveedor' : 'Facturas Individuales',
          fechaLayout: layout.fechaLayout,
          companyName: layout.companyName,
          companyRfc: layout.companyRfc,
          bankName: layout.bankName,
          bankAccountNumber: layout.bankAccountNumber,
          cantidadProveedores,
          cantidadFacturas,
          cantidadPaquetes: layout.totalPackages,
          totalAmount: layout.totalAmount,
          totalRegistros: layout.totalRegistros,
          estatus: layout.estatus,
          createdAt: layout.createdAt,
          updatedAt: layout.updatedAt
        };
      }));

      res.json({
        success: true,
        data: processedLayouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error obteniendo layouts bancarios:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener layouts bancarios",
        error: error.message,
      });
    }
  },

  generateIndividualInvoiceReferences: async (req, res) => {
    try {
      console.log("Iniciando generateIndividualInvoiceReferences con datos:", req.body);
      const { packageIds, bankAccountId, companyId } = req.body;

      if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
        console.log("Error: packageIds inválidos:", packageIds);
        return res.status(400).json({
          success: false,
          message: "Se requieren IDs de paquetes válidos",
        });
      }

      // Función para generar referencia con formato específico
      const generateReferenciaCode = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');  
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const randomDigits = String(Math.floor(Math.random() * 100)).padStart(2, '0');
        
        return `${day}${month}${year}${hours}${minutes}${seconds}${randomDigits}`;
      };

      // Obtener todos los paquetes con sus facturas
      let InvoicesPackage, ImportedInvoices;
      
      try {
        const invoicesPackageModule = await import("../models/InvoicesPackpage.js");
        const importedInvoicesModule = await import("../models/ImportedInvoices.js");
        InvoicesPackage = invoicesPackageModule.InvoicesPackage;
        ImportedInvoices = importedInvoicesModule.ImportedInvoices;
      } catch (importError) {
        console.error("Error importando modelos:", importError);
        return res.status(500).json({
          success: false,
          message: "Error interno del servidor al cargar modelos",
          error: importError.message,
        });
      }

      console.log("Buscando paquetes con IDs:", packageIds);
      const packages = await InvoicesPackage.find({ _id: { $in: packageIds } });

      console.log("Paquetes encontrados:", packages.length);

      if (packages.length === 0) {
        console.log("No se encontraron paquetes");
        return res.status(404).json({
          success: false,
          message: "No se encontraron paquetes",
        });
      }

      const updatedInvoicesCount = { total: 0, embedded: 0, original: 0 };

      for (const pkg of packages) {
        console.log(`Procesando paquete ${pkg.folio} con ${pkg.facturas.length} facturas`);
        
        // Actualizar facturas embebidas en el paquete
        let packageModified = false;
        for (let i = 0; i < pkg.facturas.length; i++) {
          const factura = pkg.facturas[i];
          
          // Solo procesar facturas que tienen importes válidos
          const importeAPagar = factura.importeAPagar && factura.importeAPagar.$numberDecimal
            ? parseFloat(factura.importeAPagar.$numberDecimal)
            : factura.importeAPagar || 0;
          const importePagado = factura.importePagado && factura.importePagado.$numberDecimal
            ? parseFloat(factura.importePagado.$numberDecimal)
            : factura.importePagado || 0;

          if ((importeAPagar > 0 || importePagado > 0) && factura.rfcEmisor) {
            // Generar nueva referencia para esta factura
            const nuevaReferencia = generateReferenciaCode();
            
            // Actualizar factura embebida en el paquete
            pkg.facturas[i].referencia = nuevaReferencia;
            packageModified = true;
            updatedInvoicesCount.embedded++;
            
            console.log(`Factura embebida ${factura.uuid} - Nueva referencia: ${nuevaReferencia}`);
            
            // Actualizar factura original en ImportedInvoices
            try {
              const result = await ImportedInvoices.updateOne(
                { _id: factura._id },
                { $set: { referencia: nuevaReferencia } }
              );
              
              if (result.modifiedCount > 0) {
                updatedInvoicesCount.original++;
                console.log(`Factura original ${factura._id} actualizada con referencia: ${nuevaReferencia}`);
              } else {
                console.log(`No se pudo actualizar factura original ${factura._id}`);
              }
            } catch (error) {
              console.error(`Error actualizando factura original ${factura._id}:`, error);
            }
          }
        }
        
        // Guardar paquete si se modificó
        if (packageModified) {
          await pkg.save();
          updatedInvoicesCount.total++;
          console.log(`Paquete ${pkg.folio} actualizado`);
        }
      }

      console.log("Referencias generadas:", updatedInvoicesCount);

      // Crear registro de layout para facturas individuales
      let layoutRecord = null;
      if (updatedInvoicesCount.embedded > 0) {
        try {
          // Obtener información de la cuenta bancaria y empresa si se proporcionaron
          let bankAccount = null;
          let company = null;

          if (bankAccountId) {
            try {
              const bankAccountModule = await import("../models/BankAccount.js");
              const BankAccount = bankAccountModule.BankAccount;
              bankAccount = await BankAccount.findById(bankAccountId).populate("bank");
            } catch (error) {
              console.error("Error obteniendo cuenta bancaria:", error);
            }
          }

          if (companyId) {
            try {
              const companyModule = await import("../models/Company.js");
              const Company = companyModule.Company;
              company = await Company.findById(companyId);
            } catch (error) {
              console.error("Error obteniendo empresa:", error);
            }
          }

          // Recopilar información de todas las facturas procesadas
          const facturasIndividuales = [];
          let totalLayoutAmount = 0;

          for (const pkg of packages) {
            for (const factura of pkg.facturas) {
              const importeAPagar = factura.importeAPagar && factura.importeAPagar.$numberDecimal
                ? parseFloat(factura.importeAPagar.$numberDecimal)
                : factura.importeAPagar || 0;
              const importePagado = factura.importePagado && factura.importePagado.$numberDecimal
                ? parseFloat(factura.importePagado.$numberDecimal)
                : factura.importePagado || 0;

              if ((importeAPagar > 0 || importePagado > 0) && factura.rfcEmisor && factura.referencia) {
                const importeFactura = importePagado > 0 ? importePagado : importeAPagar;
                
                facturasIndividuales.push({
                  facturaId: factura._id,
                  packageId: pkg._id,
                  uuid: factura.uuid,
                  rfcEmisor: factura.rfcEmisor,
                  nombreEmisor: factura.nombreEmisor,
                  importe: importeFactura,
                  referencia: factura.referencia,
                  folio: factura.folio
                });

                totalLayoutAmount += importeFactura;
              }
            }
          }

          if (facturasIndividuales.length > 0) {
            layoutRecord = new BankLayout({
              tipoLayout: 'individual',
              companyId: companyId || null,
              companyName: company ? company.name : 'Layout Individual',
              companyRfc: company ? company.rfc : 'INDIVIDUAL',
              bankAccountId: bankAccountId || null,
              bankAccountNumber: bankAccount ? bankAccount.accountNumber : 'Individual',
              bankName: bankAccount ? (bankAccount.bank?.name || 'Banco desconocido') : 'Layout Individual',
              packageIds: packageIds,
              facturasIndividuales: facturasIndividuales,
              totalAmount: totalLayoutAmount,
              totalRegistros: facturasIndividuales.length,
              totalPackages: packageIds.length,
              metadatos: {
                registrosExcel: facturasIndividuales.length,
                tiempoProcesamiento: 0,
                version: '1.0'
              }
            });

            await layoutRecord.save();
            console.log(`Layout individual ${layoutRecord.layoutFolio} creado con ${facturasIndividuales.length} facturas`);
          }

        } catch (layoutError) {
          console.error("Error creando registro de layout individual:", layoutError);
          // No fallar la operación principal si falla la creación del layout
        }
      }

      let message = `Referencias individuales generadas exitosamente para ${updatedInvoicesCount.embedded} facturas en ${updatedInvoicesCount.total} paquetes`;
      if (layoutRecord) {
        message += ` - Layout ${layoutRecord.layoutFolio} generado`;
      }

      res.json({
        success: true,
        message: message,
        data: {
          packagesProcessed: updatedInvoicesCount.total,
          embeddedInvoicesUpdated: updatedInvoicesCount.embedded,
          originalInvoicesUpdated: updatedInvoicesCount.original,
        },
        layout: layoutRecord ? {
          id: layoutRecord._id,
          folio: layoutRecord.layoutFolio,
          tipo: layoutRecord.tipoLayout,
          totalAmount: layoutRecord.totalAmount,
          totalRegistros: layoutRecord.totalRegistros
        } : null,
      });
    } catch (error) {
      console.error("Error en generateIndividualInvoiceReferences:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar referencias individuales",
        error: error.message,
      });
    }
  },

  revertBankLayout: async (req, res) => {
    try {
      console.log("Iniciando revertBankLayout con layoutId:", req.params.layoutId);
      const { layoutId } = req.params;

      if (!layoutId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere ID de layout",
        });
      }

      // Obtener el layout bancario
      const layout = await BankLayout.findById(layoutId);
      if (!layout) {
        return res.status(404).json({
          success: false,
          message: "Layout bancario no encontrado",
        });
      }

      console.log(`Layout encontrado: ${layout.layoutFolio} - Tipo: ${layout.tipoLayout}`);

      // Importar modelos necesarios
      let InvoicesPackage;
      try {
        const invoicesPackageModule = await import("../models/InvoicesPackpage.js");
        InvoicesPackage = invoicesPackageModule.InvoicesPackage;
      } catch (importError) {
        console.error("Error importando modelo InvoicesPackage:", importError);
        return res.status(500).json({
          success: false,
          message: "Error interno del servidor al cargar modelos",
          error: importError.message,
        });
      }

      // Obtener todos los paquetes relacionados con el layout
      const packages = await InvoicesPackage.find({ _id: { $in: layout.packageIds } });
      console.log(`Paquetes encontrados: ${packages.length}`);

      // Validar que se puede revertir el layout
      const packagesWithIssues = [];
      for (const pkg of packages) {
        // Verificar si el paquete está en estatus que no permite reversión
        if (pkg.estatus === "Pagado") {
          packagesWithIssues.push({
            folio: pkg.folio,
            issue: `Paquete en estatus "${pkg.estatus}"`
          });
          continue;
        }

        // Verificar facturas conciliadas
        const facturasConcialiadas = pkg.facturas.filter(factura => factura.coinciliado === true);
        if (facturasConcialiadas.length > 0) {
          packagesWithIssues.push({
            folio: pkg.folio,
            issue: `Contiene ${facturasConcialiadas.length} facturas conciliadas`
          });
        }
      }

      // Si hay paquetes con problemas, no permitir la reversión
      if (packagesWithIssues.length > 0) {
        // Determinar el tipo de error para mostrar mensaje específico
        const hasPagadoIssues = packagesWithIssues.some(issue => 
          issue.issue.includes('estatus "Pagado"')
        );
        const hasConciliadoIssues = packagesWithIssues.some(issue => 
          issue.issue.includes('conciliadas')
        );

        let errorMessage = "";
        if (hasPagadoIssues && hasConciliadoIssues) {
          errorMessage = "No se puede eliminar un layout con paquetes pagados y facturas conciliadas";
        } else if (hasPagadoIssues) {
          errorMessage = "No se puede eliminar un layout con paquetes pagados";
        } else if (hasConciliadoIssues) {
          errorMessage = "No se puede eliminar un layout con facturas conciliadas";
        } else {
          errorMessage = "No se puede eliminar el layout. Algunos paquetes tienen restricciones";
        }


        return res.status(400).json({
          success: false,
          message: errorMessage,
          issues: packagesWithIssues
        });
      }

      // Proceder con la reversión
      console.log("Iniciando proceso de reversión...");

      // Para layouts agrupados, eliminar registros de PaymentsByProvider
      if (layout.tipoLayout === 'grouped' && layout.agrupaciones && layout.agrupaciones.length > 0) {
        console.log(`Eliminando ${layout.agrupaciones.length} agrupaciones de PaymentsByProvider`);
        const deleteResult = await PaymentsByProvider.deleteMany({ 
          _id: { $in: layout.agrupaciones } 
        });
        console.log(`Agrupaciones eliminadas: ${deleteResult.deletedCount}`);
      }

      // Cambiar estatus de paquetes de "Generado" a "Programado"
      const packagesToUpdate = packages.filter(pkg => pkg.estatus === "Generado");
      console.log(`Paquetes a actualizar: ${packagesToUpdate.length}`);

      const packageUpdatePromises = packagesToUpdate.map(pkg => {
        console.log(`Cambiando estatus del paquete ${pkg.folio}: ${pkg.estatus} → Programado`);
        return InvoicesPackage.findByIdAndUpdate(
          pkg._id,
          { $set: { estatus: "Programado" } },
          { new: true }
        );
      });

      const updatedPackages = await Promise.all(packageUpdatePromises);
      console.log(`Paquetes actualizados exitosamente: ${updatedPackages.length}`);

      // Para layouts individuales, limpiar referencias de facturas si es necesario
      if (layout.tipoLayout === 'individual') {
        // Limpiar referencias de facturas en los paquetes
        for (const pkg of packages) {
          let packageModified = false;
          for (let i = 0; i < pkg.facturas.length; i++) {
            if (pkg.facturas[i].referencia) {
              pkg.facturas[i].referencia = null;
              packageModified = true;
            }
          }
          
          if (packageModified) {
            await pkg.save();
            console.log(`Referencias limpiadas en paquete ${pkg.folio}`);
          }
        }

        // También limpiar en la colección original ImportedInvoices
        try {
          const importedInvoicesModule = await import("../models/ImportedInvoices.js");
          const ImportedInvoices = importedInvoicesModule.ImportedInvoices;
          
          // Obtener todas las facturas de los paquetes
          const allFacturaIds = packages.flatMap(pkg => pkg.facturas.map(f => f._id));
          
          if (allFacturaIds.length > 0) {
            const clearReferencesResult = await ImportedInvoices.updateMany(
              { _id: { $in: allFacturaIds } },
              { $unset: { referencia: "" } }
            );
            console.log(`Referencias limpiadas en ImportedInvoices: ${clearReferencesResult.modifiedCount}`);
          }
        } catch (error) {
          console.error("Error limpiando referencias en ImportedInvoices:", error);
          // No fallar la operación por esto
        }
      }

      // Finalmente, eliminar el registro de layout
      await BankLayout.findByIdAndDelete(layoutId);
      console.log(`Layout ${layout.layoutFolio} eliminado exitosamente`);

      res.json({
        success: true,
        message: `Layout ${layout.layoutFolio} revertido exitosamente. ${updatedPackages.length} paquetes regresaron a estatus "Programado"`,
        data: {
          layoutFolio: layout.layoutFolio,
          tipoLayout: layout.tipoLayout,
          packagesReverted: updatedPackages.length,
          paymentsDeleted: layout.tipoLayout === 'grouped' ? layout.agrupaciones.length : 0
        }
      });
    } catch (error) {
      console.error("Error en revertBankLayout:", error);
      res.status(500).json({
        success: false,
        message: "Error al revertir layout bancario",
        error: error.message,
      });
    }
  },
}; 
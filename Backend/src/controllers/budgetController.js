import mongoose from "mongoose";
import { Budget } from "../models/Budget.js";
import { Branch } from "../models/Branch.js";

export const createBudget = async (req, res) => {
  try {
    const budgetData = req.body;

    if (!/^\d{4}-\d{2}$/.test(budgetData.month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    if (!budgetData.assignedAmount || budgetData.assignedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Assigned amount must be greater than 0",
      });
    }

    try {
      await Budget.validateBudgetData(budgetData);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    const Category = mongoose.model("cc_category");
    const category = await Category.findById(budgetData.categoryId);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    const searchFilter = {
      brandId: budgetData.brandId,
      companyId: budgetData.companyId,
      categoryId: budgetData.categoryId,
      expenseConceptId: budgetData.expenseConceptId,
      month: budgetData.month,
    };

    if (category.hasRoutes) {
      searchFilter.routeId = budgetData.routeId;
    } else {
      searchFilter.branchId = budgetData.branchId;
    }

    const existingBudget = await Budget.findOne(searchFilter);

    if (existingBudget) {
      existingBudget.assignedAmount = budgetData.assignedAmount;
      await existingBudget.save();

      const populatedBudget = await Budget.findById(existingBudget._id)
        .populate("routeId")
        .populate("brandId")
        .populate("companyId")
        .populate("branchId")
        .populate("categoryId")
        .populate({
          path: "expenseConceptId",
          populate: {
            path: "categoryId",
            model: "cc_expense_concept_category",
          },
        });

      return res.json({
        success: true,
        data: populatedBudget,
        message: "Budget updated successfully",
      });
    }

    const newBudgetData = {
      brandId: budgetData.brandId,
      companyId: budgetData.companyId,
      categoryId: budgetData.categoryId,
      expenseConceptId: budgetData.expenseConceptId,
      assignedAmount: budgetData.assignedAmount,
      month: budgetData.month,
    };

    if (category.hasRoutes) {
      newBudgetData.routeId = budgetData.routeId;
      if (budgetData.routeId) {
        const Route = mongoose.model("cc_route");
        const route = await Route.findById(budgetData.routeId);
        if (route && route.branchId) {
          newBudgetData.branchId = route.branchId;
        } else {
          return res.status(400).json({
            success: false,
            message: "Route not found or route does not have a branch assigned",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "RouteId is required for categories with routes",
        });
      }
    } else {
      newBudgetData.branchId = budgetData.branchId;
      newBudgetData.routeId = null;
    }

    const newBudget = new Budget(newBudgetData);
    await newBudget.save();

    const populatedBudget = await Budget.findById(newBudget._id)
      .populate("routeId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId")
      .populate("categoryId")
      .populate({
        path: "expenseConceptId",
        populate: {
          path: "categoryId",
          model: "cc_expense_concept_category",
        },
      });

    res.status(201).json({
      success: true,
      data: populatedBudget,
      message: "Budget created successfully",
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({
      success: false,
      message: "Error creating budget",
      error: error.message,
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.month && !/^\d{4}-\d{2}$/.test(updateData.month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Use YYYY-MM",
      });
    }

    if (
      updateData.assignedAmount !== undefined &&
      updateData.assignedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Assigned amount must be greater than 0",
      });
    }

    const currentBudget = await Budget.findById(id);
    if (!currentBudget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    if (
      updateData.categoryId ||
      updateData.routeId !== undefined ||
      updateData.branchId !== undefined
    ) {
      const validationData = {
        categoryId: updateData.categoryId || currentBudget.categoryId,
        routeId:
          updateData.routeId !== undefined
            ? updateData.routeId
            : currentBudget.routeId,
        brandId: updateData.brandId || currentBudget.brandId,
        companyId: updateData.companyId || currentBudget.companyId,
        branchId:
          updateData.branchId !== undefined
            ? updateData.branchId
            : currentBudget.branchId,
        expenseConceptId:
          updateData.expenseConceptId || currentBudget.expenseConceptId,
      };

      try {
        await Budget.validateBudgetData(validationData);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message,
        });
      }
    }

    const budget = await Budget.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("routeId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId")
      .populate("categoryId")
      .populate({
        path: "expenseConceptId",
        populate: {
          path: "categoryId",
          model: "cc_expense_concept_category",
        },
      });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.json({
      success: true,
      data: budget,
      message: "Budget updated successfully",
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({
      success: false,
      message: "Error updating budget",
      error: error.message,
    });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findByIdAndDelete(id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting budget",
      error: error.message,
    });
  }
};

export const getBudgetTree = async (req, res) => {
  try {
    const { month, userId } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month parameter required. Use YYYY-MM format",
      });
    }

    const Category = mongoose.model("cc_category");
    const Company = mongoose.model("cc_companies");
    const Brand = mongoose.model("cc_brand");
    const Branch = mongoose.model("cc_branch");
    const Route = mongoose.model("cc_route");
    const RoleVisibility = mongoose.model("ac_user_visibility");
    const ExpenseConcept = mongoose.model("cc_expense_concept");

    let visibility = null;
    if (userId) {
      visibility = await RoleVisibility.findOne({ userId });
    }

    const categories = await Category.find({ isActive: true });
    const expenseConcepts = await ExpenseConcept.find({
      isActive: true,
    }).populate({
      path: "categoryId",
      model: "cc_expense_concept_category",
    });
    const budgets = await Budget.find({ month })
      .populate("categoryId")
      .populate("companyId")
      .populate("brandId")
      .populate("branchId")
      .populate("routeId")
      .populate({
        path: "expenseConceptId",
        populate: {
          path: "categoryId",
          model: "cc_expense_concept_category",
        },
      });

    const budgetMap = new Map();
    budgets.forEach((budget) => {
      const key = budget.routeId
        ? `route_${budget.routeId._id}_expense_${budget.expenseConceptId._id}`
        : `branch_${budget.branchId._id}_expense_${budget.expenseConceptId._id}`;
      budgetMap.set(key, budget);
    });

    const tree = [];

    for (const category of categories) {
      const categoryNode = {
        id: `category_${category._id}`,
        text: category.name,
        type: "category",
        hasRoutes: category.hasRoutes,
        total: 0,
        children: [],
      };

      const companyBrandRelations = await mongoose
        .model("rs_company_brand")
        .find()
        .populate("companyId")
        .populate({
          path: "brandId",
          populate: {
            path: "categoryId",
            model: "cc_category",
          },
        });

      const relevantRelations = companyBrandRelations.filter(
        (rel) =>
          rel.brandId?.categoryId?._id.toString() === category._id.toString()
      );

      const companyMap = new Map();

      for (const relation of relevantRelations) {
        const company = relation.companyId;
        const brand = relation.brandId;

        if (!company || !brand) continue;

        if (visibility) {
          if (!visibility.hasAccessToCompany(company._id)) continue;
          if (!visibility.hasAccessToBrand(company._id, brand._id)) continue;
        }

        if (!companyMap.has(company._id.toString())) {
          companyMap.set(company._id.toString(), {
            id: `company_${company._id}`,
            text: company.name,
            type: "company",
            total: 0,
            children: [],
          });
        }

        const companyNode = companyMap.get(company._id.toString());

        if (category.hasRoutes) {
          const branchBrandRelations = await mongoose
            .model("rs_branch_brand")
            .find({
              brandId: brand._id,
            })
            .populate("branchId");

          const relevantBranches = branchBrandRelations.filter(
            (rel) =>
              rel.branchId?.companyId?.toString() === company._id.toString()
          );

          for (const branchRelation of relevantBranches) {
            const branch = branchRelation.branchId;

            if (!branch || !branch.isActive) continue;

            if (
              visibility &&
              !visibility.hasAccessToBranch(company._id, brand._id, branch._id)
            ) {
              continue;
            }

            let branchNode = companyNode.children.find(
              (child) => child.id === `branch_${branch._id}`
            );

            if (!branchNode) {
              branchNode = {
                id: `branch_${branch._id}`,
                text: branch.name,
                type: "branch",
                total: 0,
                children: [],
              };
              companyNode.children.push(branchNode);
            }

            let brandNode = branchNode.children.find(
              (child) => child.id === `brand_${brand._id}`
            );

            if (!brandNode) {
              brandNode = {
                id: `brand_${brand._id}`,
                text: brand.name,
                type: "brand",
                total: 0,
                children: [],
              };
              branchNode.children.push(brandNode);
            }

            const routes = await Route.find({
              categoryId: category._id,
              companyId: company._id,
              brandId: brand._id,
              branchId: branch._id,
              status: true,
            });

            for (const route of routes) {
              const routeNode = {
                id: `route_${route._id}`,
                text: route.name,
                type: "route",
                total: 0,
                children: [],
              };

              // Agregar conceptos de gasto como hijos de cada ruta
              for (const expenseConcept of expenseConcepts) {
                const budget = budgetMap.get(
                  `route_${route._id}_expense_${expenseConcept._id}`
                );
                const expenseConceptNode = {
                  id: `route_${route._id}_expense_${expenseConcept._id}`,
                  text: `${expenseConcept.categoryId.name} - ${expenseConcept.name}`,
                  type: "expense_concept",
                  budgetAmount: budget ? budget.assignedAmount : 0,
                  canAssignBudget: true,
                  entityIds: {
                    categoryId: category._id,
                    companyId: company._id,
                    brandId: brand._id,
                    branchId: branch._id,
                    routeId: route._id,
                    expenseConceptId: expenseConcept._id,
                  },
                };
                routeNode.children.push(expenseConceptNode);
              }

              routeNode.total = routeNode.children.reduce(
                (sum, child) => sum + (child.budgetAmount || 0),
                0
              );

              brandNode.children.push(routeNode);
            }
            brandNode.total = brandNode.children.reduce(
              (sum, child) => sum + (child.total || 0),
              0
            );
            branchNode.total = branchNode.children.reduce(
              (sum, child) => sum + (child.total || 0),
              0
            );
          }
          companyNode.total = companyNode.children.reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
        } else {
          let brandNode = companyNode.children.find(
            (child) => child.id === `brand_${brand._id}`
          );

          if (!brandNode) {
            brandNode = {
              id: `brand_${brand._id}`,
              text: brand.name,
              type: "brand",
              total: 0,
              children: [],
            };
            companyNode.children.push(brandNode);
          }

          const branchBrandRelations = await mongoose
            .model("rs_branch_brand")
            .find({
              brandId: brand._id,
            })
            .populate("branchId");

          const relevantBranches = branchBrandRelations.filter(
            (rel) =>
              rel.branchId?.companyId?.toString() === company._id.toString()
          );

          for (const branchRelation of relevantBranches) {
            const branch = branchRelation.branchId;

            if (!branch || !branch.isActive) continue;

            if (
              visibility &&
              !visibility.hasAccessToBranch(company._id, brand._id, branch._id)
            ) {
              continue;
            }

            const branchNode = {
              id: `branch_${branch._id}`,
              text: branch.name,
              type: "branch",
              total: 0,
              children: [],
            };

            // Agregar conceptos de gasto como hijos de cada sucursal (para categorías sin rutas)
            for (const expenseConcept of expenseConcepts) {
              const budget = budgetMap.get(
                `branch_${branch._id}_expense_${expenseConcept._id}`
              );
              const expenseConceptNode = {
                id: `branch_${branch._id}_expense_${expenseConcept._id}`,
                text: `${expenseConcept.categoryId.name} - ${expenseConcept.name}`,
                type: "expense_concept",
                budgetAmount: budget ? budget.assignedAmount : 0,
                canAssignBudget: true,
                entityIds: {
                  categoryId: category._id,
                  companyId: company._id,
                  brandId: brand._id,
                  branchId: branch._id,
                  expenseConceptId: expenseConcept._id,
                },
              };
              branchNode.children.push(expenseConceptNode);
            }

            branchNode.total = branchNode.children.reduce(
              (sum, child) => sum + (child.budgetAmount || 0),
              0
            );

            brandNode.children.push(branchNode);
          }
          brandNode.total = brandNode.children.reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
          companyNode.total = companyNode.children.reduce(
            (sum, child) => sum + (child.total || 0),
            0
          );
        }
      }

      categoryNode.children = Array.from(companyMap.values());
      categoryNode.total = categoryNode.children.reduce(
        (sum, child) => sum + (child.total || 0),
        0
      );

      delete categoryNode.total;

      if (categoryNode.children.length > 0) {
        tree.push(categoryNode);
      }
    }

    res.json({
      success: true,
      data: tree,
      message: "Budget tree retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting budget tree:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving budget tree",
      error: error.message,
    });
  }
};

// Nuevo endpoint: obtener presupuesto asignado por sucursal (o todas) para un mes
export const getBudgetByBranch = async (req, res) => {
  try {
    const { companyId, branchId, month } = req.query;
    if (!companyId || !month) {
      return res
        .status(400)
        .json({ success: false, message: "companyId y month son requeridos" });
    }
    const filter = { companyId, month };
    if (branchId) {
      filter.branchId = branchId;
    }
    // Sumar todos los presupuestos asignados para la(s) sucursal(es) y mes
    const budgets = await Budget.find(filter);
    const assignedAmount = budgets.reduce(
      (sum, b) => sum + (b.assignedAmount || 0),
      0
    );
    res.status(200).json({ success: true, data: { assignedAmount } });
  } catch (error) {
    console.error("Error en getBudgetByBranch:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nuevo endpoint: validar presupuesto por concepto de gasto para un paquete
export const validatePackageBudgetByExpenseConcept = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "packageId es requerido",
      });
    }

    // Obtener el paquete con toda su información
    const InvoicesPackage = mongoose.model("cc_invoices_package");
    const InvoicesPackageCompany = mongoose.model(
      "rs_invoices_packages_companies"
    );
    const ImportedInvoices = mongoose.model("cc_imported_invoices");
    const CashPayment = mongoose.model("cc_cash_payment");
    const ExpenseConcept = mongoose.model("cc_expense_concept");

    const packageData = await InvoicesPackage.findById(packageId);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Paquete no encontrado",
      });
    }

    // Obtener la información de compañía/marca/sucursal del paquete
    const packageCompanyInfo = await InvoicesPackageCompany.findByPackageId(
      packageId
    );

    if (!packageCompanyInfo) {
      return res.status(404).json({
        success: false,
        message: "Información de compañía del paquete no encontrada",
      });
    }

    // Obtener el mes del paquete
    const fechaPago = new Date(packageData.fechaPago);
    const year = fechaPago.getFullYear();
    const month = String(fechaPago.getMonth() + 1).padStart(2, "0");
    const monthFormatted = `${year}-${month}`;

    console.log(`🗓️ DEBUG - Fecha pago del paquete: ${packageData.fechaPago}`);
    console.log(`🗓️ DEBUG - Mes formateado para búsqueda: ${monthFormatted}`);

    // Obtener los presupuestos del mes para esta compañía/marca/sucursal/ruta
    const Budget = mongoose.model("cc_budget");
    let budgetFilter = {
      companyId: packageCompanyInfo.companyId._id,
      brandId: packageCompanyInfo.brandId._id,
      branchId: packageCompanyInfo.branchId._id,
      month: monthFormatted,
    };

    // Si el paquete tiene routeId asignado, filtrar por ruta específica
    if (packageCompanyInfo.routeId) {
      budgetFilter.routeId = packageCompanyInfo.routeId._id;
      console.log(`🔍 Utilizando filtro por ruta específica: ${packageCompanyInfo.routeId.name} (${packageCompanyInfo.routeId._id})`);
    } else {
      // Si no hay ruta específica, usar lógica original (por sucursal)
      budgetFilter.routeId = null;
      console.log(`🔍 Utilizando filtro por sucursal (sin ruta específica)`);
    }

    console.log(`🔍 DEBUG - Filtro de presupuesto aplicado:`, budgetFilter);

    const budgetData = await Budget.find(budgetFilter).populate("expenseConceptId");

    console.log(`📊 DEBUG - Presupuestos obtenidos para validación: ${budgetData.length} conceptos`);
    budgetData.forEach(budget => {
      console.log(`  - Concepto: ${budget.expenseConceptId?.name || 'N/A'}, Monto: $${budget.assignedAmount}`);
    });

    // Obtener todas las facturas del paquete con sus conceptos de gasto
    // También obtener las facturas originales de la BD para comparar pagos previos
    const facturasIds = packageData.facturas.map((f) => f._id);
    
    console.log(`💳 DEBUG - Facturas en el paquete: ${facturasIds.length}`);
    packageData.facturas.forEach((factura, index) => {
      console.log(`  Factura ${index + 1}: ${factura._id}, Concepto embebido: ${factura.conceptoGasto?.id || 'N/A'} - ${factura.conceptoGasto?.name || 'N/A'}`);
    });

    const facturasOriginales = await ImportedInvoices.find({
      _id: { $in: facturasIds },
    }).populate("conceptoGasto");

    console.log(`💳 DEBUG - Facturas originales obtenidas de BD: ${facturasOriginales.length}`);
    facturasOriginales.forEach((factura, index) => {
      console.log(`  Factura orig. ${index + 1}: ${factura._id}, Concepto de BD: ${factura.conceptoGasto?._id || 'N/A'} - ${factura.conceptoGasto?.name || 'N/A'}`);
    });

    // Crear un mapa de facturas embebidas del paquete para acceso rápido
    const facturasEmbebidas = new Map();
    packageData.facturas.forEach((factura) => {
      facturasEmbebidas.set(factura._id.toString(), factura);
    });

    // Obtener todos los pagos en efectivo del paquete con sus conceptos de gasto
    const pagosEfectivoIds = (packageData.pagosEfectivo || []).map((p) => p._id);
    
    console.log(`💰 DEBUG - Pagos en efectivo en el paquete: ${pagosEfectivoIds.length}`);
    (packageData.pagosEfectivo || []).forEach((pago, index) => {
      console.log(`  Pago ${index + 1}: ${pago._id}, Concepto embebido: ${pago.expenseConcept || 'N/A'}`);
    });

    const pagosEfectivoOriginales = pagosEfectivoIds.length > 0 
      ? await CashPayment.find({
          _id: { $in: pagosEfectivoIds },
        }).populate("expenseConcept")
      : [];

    console.log(`💰 DEBUG - Pagos en efectivo originales obtenidos de BD: ${pagosEfectivoOriginales.length}`);
    pagosEfectivoOriginales.forEach((pago, index) => {
      console.log(`  Pago orig. ${index + 1}: ${pago._id}, Concepto de BD: ${pago.expenseConcept?._id || 'N/A'} - ${pago.expenseConcept?.name || 'N/A'}`);
    });

    // Crear un mapa de pagos en efectivo embebidos del paquete para acceso rápido
    const pagosEfectivoEmbebidos = new Map();
    (packageData.pagosEfectivo || []).forEach((pago) => {
      pagosEfectivoEmbebidos.set(pago._id.toString(), pago);
    });

    // Agrupar pagos por concepto de gasto
    const pagosPorConcepto = new Map();

    console.log(`🔄 DEBUG - Iniciando agrupación de pagos por concepto de gasto`);

    // Procesar facturas - USAR CONCEPTOS EMBEBIDOS EN EL PAQUETE
    packageData.facturas.forEach((facturaEmbebida) => {
      if (facturaEmbebida.conceptoGasto && facturaEmbebida.conceptoGasto.id) {
        const conceptoId = facturaEmbebida.conceptoGasto.id.toString();
        
        console.log(`🔍 DEBUG - Procesando factura ${facturaEmbebida._id} con concepto embebido ${facturaEmbebida.conceptoGasto.name} (ID: ${conceptoId})`);
        
        // Solo procesar si la factura está autorizada EN EL PAQUETE o si no está rechazada
        if (facturaEmbebida.autorizada !== false) {
          if (!pagosPorConcepto.has(conceptoId)) {
            pagosPorConcepto.set(conceptoId, {
              concepto: {
                _id: facturaEmbebida.conceptoGasto.id,
                name: facturaEmbebida.conceptoGasto.name,
                description: facturaEmbebida.conceptoGasto.descripcion || '',
              },
              totalPagado: 0,
              pagos: [],
            });
            console.log(`  ✅ DEBUG - Nuevo concepto agregado: ${facturaEmbebida.conceptoGasto.name}`);
          }
          
          const conceptoData = pagosPorConcepto.get(conceptoId);
          
          // Usar el importePagado de la factura embebida
          const montoPagado = facturaEmbebida.importePagado || 0;
          
          conceptoData.totalPagado += montoPagado;
          conceptoData.pagos.push({
            tipo: "factura",
            id: facturaEmbebida._id,
            monto: montoPagado,
            descripcion: facturaEmbebida.nombreEmisor || 'Factura',
          });
          
          console.log(`  💰 DEBUG - Monto agregado: $${montoPagado}, Total acumulado: $${conceptoData.totalPagado}`);
        } else {
          console.log(`  ❌ DEBUG - Factura no autorizada o rechazada, saltando (autorizada: ${facturaEmbebida.autorizada})`);
        }
      } else {
        console.log(`⚠️ DEBUG - Factura ${facturaEmbebida._id} sin concepto de gasto embebido`);
      }
    });

    console.log(`🔄 DEBUG - Conceptos encontrados en facturas: ${pagosPorConcepto.size}`);

    // Procesar pagos en efectivo - USAR CONCEPTOS EMBEBIDOS EN EL PAQUETE
    (packageData.pagosEfectivo || []).forEach((pagoEmbebido) => {
      if (pagoEmbebido.expenseConcept) {
        const conceptoId = pagoEmbebido.expenseConcept.toString();
        
        console.log(`🔍 DEBUG - Procesando pago en efectivo ${pagoEmbebido._id} con concepto embebido (ID: ${conceptoId})`);
        
        // Solo procesar si el pago está autorizado EN EL PAQUETE o si no está rechazado
        if (pagoEmbebido.autorizada !== false) {
          if (!pagosPorConcepto.has(conceptoId)) {
            // Para pagos en efectivo, necesitamos obtener el nombre del concepto de la BD
            const ExpenseConcept = mongoose.model("cc_expense_concept");
            ExpenseConcept.findById(conceptoId).then(concepto => {
              pagosPorConcepto.set(conceptoId, {
                concepto: {
                  _id: conceptoId,
                  name: concepto?.name || 'Concepto desconocido',
                  description: concepto?.description || '',
                },
                totalPagado: 0,
                pagos: [],
              });
              console.log(`  ✅ DEBUG - Nuevo concepto agregado desde efectivo: ${concepto?.name || 'Concepto desconocido'}`);
            });
          }
          
          if (pagosPorConcepto.has(conceptoId)) {
            const conceptoData = pagosPorConcepto.get(conceptoId);
            
            // Usar el importeAPagar del pago embebido (los pagos en efectivo usan importeAPagar, no importePagado)
            const montoPagado = pagoEmbebido.importeAPagar || 0;
            
            conceptoData.totalPagado += montoPagado;
            conceptoData.pagos.push({
              tipo: "efectivo",
              id: pagoEmbebido._id,
              monto: montoPagado,
              descripcion: pagoEmbebido.description || "Pago en efectivo",
            });
            
            console.log(`  💰 DEBUG - Monto efectivo agregado: $${montoPagado}, Total acumulado: $${conceptoData.totalPagado}`);
          }
        } else {
          console.log(`  ❌ DEBUG - Pago en efectivo no autorizado o rechazado, saltando (autorizada: ${pagoEmbebido.autorizada})`);
        }
      } else {
        console.log(`⚠️ DEBUG - Pago en efectivo ${pagoEmbebido._id} sin concepto de gasto embebido`);
      }
    });

    // Validar cada concepto contra su presupuesto
    const validaciones = [];
    let requiereAutorizacion = false;

    for (const [conceptoId, data] of pagosPorConcepto) {
      console.log(`🔍 DEBUG - Validando concepto ${conceptoId}: ${data.concepto.name}`);
      console.log(`  💳 Total pagos paquete actual: $${data.totalPagado}`);

      // Buscar el presupuesto asignado para este concepto
      let presupuesto = 0;
      const presupuestoConcepto = budgetData.find(budget => 
        budget.expenseConceptId && 
        budget.expenseConceptId._id.toString() === conceptoId
      );
      
      if (presupuestoConcepto) {
        presupuesto = presupuestoConcepto.assignedAmount || 0;
        console.log(`  💰 Presupuesto asignado: $${presupuesto}`);
      } else {
        console.log(`  ⚠️ NO se encontró presupuesto para concepto ${conceptoId}`);
      }

      // CALCULAR TOTAL GASTADO EN EL MES (TODOS LOS PAQUETES DEL MISMO MES/COMPANY/BRAND/BRANCH/ROUTE)
      let totalPagadoEnElMes = 0;

      // Buscar TODOS los paquetes del mes con el mismo filtro de compañía/marca/sucursal/ruta
      const todosPaquetesDelMes = await InvoicesPackage.find({
        fechaPago: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0, 23, 59, 59)
        },
        estatus: { $ne: "Cancelado" } // Incluir todos los estados excepto cancelado
      });

      console.log(`  📦 Paquetes encontrados en el mes ${monthFormatted}: ${todosPaquetesDelMes.length}`);

      // Procesar cada paquete para encontrar pagos con este concepto
      for (const paquete of todosPaquetesDelMes) {
        // Verificar que el paquete sea de la misma compañía/marca/sucursal/ruta
        const paqueteCompanyInfo = await InvoicesPackageCompany.findByPackageId(paquete._id);
        
        if (!paqueteCompanyInfo) continue;

        // Verificar coincidencia de company/brand/branch
        const companyMatches = paqueteCompanyInfo.companyId._id.toString() === packageCompanyInfo.companyId._id.toString();
        const brandMatches = paqueteCompanyInfo.brandId._id.toString() === packageCompanyInfo.brandId._id.toString();
        const branchMatches = paqueteCompanyInfo.branchId._id.toString() === packageCompanyInfo.branchId._id.toString();
        
        // Verificar coincidencia de ruta si aplica
        let routeMatches = true;
        if (packageCompanyInfo.routeId) {
          routeMatches = paqueteCompanyInfo.routeId && 
                        paqueteCompanyInfo.routeId._id.toString() === packageCompanyInfo.routeId._id.toString();
        } else {
          routeMatches = !paqueteCompanyInfo.routeId;
        }

        if (companyMatches && brandMatches && branchMatches && routeMatches) {
          let montoPaquete = 0;

          // Procesar facturas del paquete con este concepto
          if (paquete.facturas && Array.isArray(paquete.facturas)) {
            paquete.facturas.forEach(facturaEmbebida => {
              if (facturaEmbebida.conceptoGasto && 
                  facturaEmbebida.conceptoGasto.id &&
                  facturaEmbebida.conceptoGasto.id.toString() === conceptoId &&
                  facturaEmbebida.autorizada !== false) {
                const monto = facturaEmbebida.importePagado || 0;
                montoPaquete += monto;
                totalPagadoEnElMes += monto;
              }
            });
          }

          // Procesar pagos en efectivo del paquete con este concepto
          if (paquete.pagosEfectivo && Array.isArray(paquete.pagosEfectivo)) {
            paquete.pagosEfectivo.forEach(pagoEmbebido => {
              if (pagoEmbebido.expenseConcept && 
                  pagoEmbebido.expenseConcept.toString() === conceptoId &&
                  pagoEmbebido.autorizada !== false) {
                const monto = pagoEmbebido.importeAPagar || 0;
                montoPaquete += monto;
                totalPagadoEnElMes += monto;
              }
            });
          }

          if (montoPaquete > 0) {
            console.log(`    📦 Paquete ${paquete.folio} (${paquete.estatus}): $${montoPaquete}`);
          }
        }
      }

      console.log(`  📊 TOTAL gastado en el mes: $${totalPagadoEnElMes}`);
      console.log(`  💸 Disponible: $${presupuesto - totalPagadoEnElMes}`);
      
      const excede = totalPagadoEnElMes > presupuesto;
      if (excede) {
        requiereAutorizacion = true;
        console.log(`  🚨 EXCEDE PRESUPUESTO por: $${totalPagadoEnElMes - presupuesto}`);
      } else {
        console.log(`  ✅ Dentro del presupuesto`);
      }

      validaciones.push({
        concepto: {
          _id: data.concepto._id,
          name: data.concepto.name,
          categoryName: "N/A", // No tenemos esta información en los embebidos
        },
        presupuestoAsignado: presupuesto,
        totalPagado: totalPagadoEnElMes,
        totalPaqueteActual: data.totalPagado,
        diferencia: totalPagadoEnElMes - presupuesto,
        excede: excede,
        pagos: data.pagos,
      });
    }

    // CALCULAR PRESUPUESTO DISPONIBLE GENERAL
    const presupuestoTotalMes = budgetData.reduce((sum, budget) => sum + (budget.assignedAmount || 0), 0);
    
    // CORREGIR: Calcular total gastado en el mes de TODOS los conceptos de TODOS los paquetes
    let totalGastadoMes = 0;
    
    console.log(`🔄 Calculando total gastado en el mes de TODOS los conceptos...`);
    
    // Buscar TODOS los paquetes del mes
    const todosPaquetesDelMes = await InvoicesPackage.find({
      fechaPago: {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59)
      },
      estatus: { $ne: "Cancelado" }
    });

    // Para cada concepto de gasto que tiene presupuesto asignado
    for (const budget of budgetData) {
      const conceptoId = budget.expenseConceptId._id.toString();
      let totalConcepto = 0;

      console.log(`  🔍 Calculando total del concepto: ${budget.expenseConceptId.name} (${conceptoId})`);

      // Buscar en todos los paquetes del mes
      for (const paquete of todosPaquetesDelMes) {
        const paqueteCompanyInfo = await InvoicesPackageCompany.findByPackageId(paquete._id);
        
        if (!paqueteCompanyInfo) continue;

        // Verificar que sea del mismo company/brand/branch/route
        const companyMatches = paqueteCompanyInfo.companyId._id.toString() === packageCompanyInfo.companyId._id.toString();
        const brandMatches = paqueteCompanyInfo.brandId._id.toString() === packageCompanyInfo.brandId._id.toString();
        const branchMatches = paqueteCompanyInfo.branchId._id.toString() === packageCompanyInfo.branchId._id.toString();
        
        let routeMatches = true;
        if (packageCompanyInfo.routeId) {
          routeMatches = paqueteCompanyInfo.routeId && 
                        paqueteCompanyInfo.routeId._id.toString() === packageCompanyInfo.routeId._id.toString();
        } else {
          routeMatches = !paqueteCompanyInfo.routeId;
        }

        if (companyMatches && brandMatches && branchMatches && routeMatches) {
          // Sumar facturas con este concepto
          if (paquete.facturas && Array.isArray(paquete.facturas)) {
            paquete.facturas.forEach(facturaEmbebida => {
              if (facturaEmbebida.conceptoGasto && 
                  facturaEmbebida.conceptoGasto.id &&
                  facturaEmbebida.conceptoGasto.id.toString() === conceptoId &&
                  facturaEmbebida.autorizada !== false) {
                const monto = facturaEmbebida.importePagado || 0;
                totalConcepto += monto;
              }
            });
          }

          // Sumar pagos en efectivo con este concepto
          if (paquete.pagosEfectivo && Array.isArray(paquete.pagosEfectivo)) {
            paquete.pagosEfectivo.forEach(pagoEmbebido => {
              if (pagoEmbebido.expenseConcept && 
                  pagoEmbebido.expenseConcept.toString() === conceptoId &&
                  pagoEmbebido.autorizada !== false) {
                const monto = pagoEmbebido.importeAPagar || 0;
                totalConcepto += monto;
              }
            });
          }
        }
      }

      console.log(`    💰 Total gastado en ${budget.expenseConceptId.name}: $${totalConcepto}`);
      totalGastadoMes += totalConcepto;
    }

    console.log(`  🎯 TOTAL GASTADO EN EL MES (TODOS LOS CONCEPTOS): $${totalGastadoMes}`);
    
    const presupuestoDisponible = presupuestoTotalMes - totalGastadoMes;

    console.log(`📊 RESUMEN PRESUPUESTAL DEL MES ${monthFormatted}:`);
    console.log(`  💰 Presupuesto total asignado: $${presupuestoTotalMes.toLocaleString()}`);
    console.log(`  📉 Total gastado en el mes: $${totalGastadoMes.toLocaleString()}`);
    console.log(`  💸 Presupuesto disponible: $${presupuestoDisponible.toLocaleString()}`);
    console.log(`  🎯 Estado: ${presupuestoDisponible >= 0 ? '✅ Presupuesto suficiente' : '🚨 Presupuesto excedido'}`);

    res.json({
      success: true,
      data: {
        packageId: packageId,
        month: monthFormatted,
        requiereAutorizacion,
        validaciones,
        presupuestoGeneral: {
          presupuestoTotalMes,
          totalGastadoMes,
          presupuestoDisponible,
          excedido: presupuestoDisponible < 0
        },
        resumen: {
          conceptosValidados: validaciones.length,
          conceptosExcedidos: validaciones.filter((v) => v.excede).length,
          totalExceso: validaciones
            .filter((v) => v.excede)
            .reduce((sum, v) => sum + v.diferencia, 0),
        },
      },
      message: requiereAutorizacion
        ? "Algunos conceptos exceden su presupuesto asignado"
        : "Todos los conceptos están dentro del presupuesto",
    });
  } catch (error) {
    console.error("Error en validatePackageBudgetByExpenseConcept:", error);
    res.status(500).json({
      success: false,
      message: "Error al validar presupuesto por concepto de gasto",
      error: error.message,
    });
  }
};

// Nuevo endpoint: obtener presupuestos por sucursal para una compañía específica
export const getBudgetByCompanyForBranches = async (req, res) => {
  try {
    const { companyId, brandIds, month, userId } = req.query;

    if (!companyId || !brandIds || !month) {
      return res.status(400).json({
        success: false,
        message: "companyId, brandIds y month son requeridos",
      });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Formato de mes inválido. Use YYYY-MM",
      });
    }

    const Category = mongoose.model("cc_category");
    const Brand = mongoose.model("cc_brand");
    const Branch = mongoose.model("cc_branch");
    const Route = mongoose.model("cc_route");
    const RoleVisibility = mongoose.model("ac_user_visibility");

    // Obtener visibilidad del usuario si se proporciona
    let visibility = null;
    if (userId) {
      visibility = await RoleVisibility.findOne({ userId });
    }

    // Convertir brandIds de string a array
    const brandIdsArray = brandIds.split(",");

    // Array para almacenar cada combinación sucursal-marca como elemento separado
    const branchBudgetResults = [];

    // Procesar cada marca
    for (const brandId of brandIdsArray) {
      // Obtener la marca específica
      const brand = await Brand.findById(brandId).populate("categoryId");
      if (!brand) {
        console.warn(`Marca no encontrada: ${brandId}`);
        continue;
      }

      // Obtener la categoría de la marca
      const category = brand.categoryId;
      if (!category) {
        console.warn(`La marca ${brand.name} no tiene categoría asignada`);
        continue;
      }

      // Verificar visibilidad del usuario para la marca
      if (visibility) {
        if (!visibility.hasAccessToBrand(companyId, brandId)) {
          console.warn(`Usuario no tiene acceso a la marca: ${brand.name}`);
          continue;
        }
      }
      // Obtener relaciones branch-brand para esta marca específica
      const branchBrandRelations = await mongoose
        .model("rs_branch_brand")
        .find({
          brandId: brand._id,
        })
        .populate("branchId");

      // Filtrar sucursales que pertenezcan a la compañía
      const relevantBranches = branchBrandRelations.filter(
        (rel) => rel.branchId?.companyId?.toString() === companyId
      );

      // Procesar cada sucursal
      for (const branchRelation of relevantBranches) {
        const branch = branchRelation.branchId;

        if (!branch || !branch.isActive) continue;

        // Verificar visibilidad de la sucursal
        if (
          visibility &&
          !visibility.hasAccessToBranch(companyId, brandId, branch._id)
        ) {
          continue;
        }

        let branchAmount = 0;

        if (category.hasRoutes) {
          // Si la categoría maneja rutas, obtener todas las rutas de esta sucursal-marca
          const routes = await Route.find({
            categoryId: category._id,
            companyId: companyId,
            brandId: brand._id,
            branchId: branch._id,
            status: true,
          });

          // Sumar presupuestos de todas las rutas
          for (const route of routes) {
            const budget = await Budget.findOne({
              routeId: route._id,
              month: month,
            });

            if (budget) {
              branchAmount += budget.assignedAmount || 0;
            }
          }
        } else {
          // Si no maneja rutas, obtener presupuesto directo de la sucursal
          const budget = await Budget.findOne({
            companyId: companyId,
            brandId: brand._id,
            branchId: branch._id,
            categoryId: category._id,
            month: month,
            routeId: null,
          });

          if (budget) {
            branchAmount = budget.assignedAmount || 0;
          }
        }

        // Agregar cada combinación sucursal-marca como elemento separado
        if (branchAmount > 0) {
          branchBudgetResults.push({
            branchId: {
              _id: branch._id.toString(),
              name: branch.name,
            },
            brandId: {
              _id: brandId,
              name: brand.name,
            },
            assignedAmount: branchAmount,
            hasRoutes: category.hasRoutes,
          });
        }
      }
    }

    res.json({
      success: true,
      data: branchBudgetResults,
      message: "Presupuestos por sucursal obtenidos exitosamente",
    });
  } catch (error) {
    console.error("Error obteniendo presupuestos por sucursal:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo presupuestos por sucursal",
      error: error.message,
    });
  }
};

export const getBudgetByExpenseConcept = async (req, res) => {
  try {
    const { 
      expenseConceptId, 
      companyId, 
      brandId, 
      branchId, 
      month,
      routeId
    } = req.query;

    if (!expenseConceptId || !companyId || !brandId || !branchId || !month) {
      return res.status(400).json({
        success: false,
        message: "expenseConceptId, companyId, brandId, branchId y month son requeridos",
      });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Formato de mes inválido. Use YYYY-MM",
      });
    }

    const ExpenseConcept = mongoose.model("cc_expense_concept");

    const expenseConcept = await ExpenseConcept.findById(expenseConceptId).populate('categoryId');
    
    if (!expenseConcept) {
      return res.status(404).json({
        success: false,
        message: "Concepto de gasto no encontrado",
      });
    }

    let totalBudget = 0;
    let budgetDetails = [];

    // Si se proporciona routeId, buscar solo el presupuesto de esa ruta específica
    if (routeId) {
      const budget = await Budget.findOne({
        companyId: companyId,
        brandId: brandId,
        branchId: branchId,
        expenseConceptId: expenseConceptId,
        month: month,
        routeId: routeId
      }).populate('routeId');

      if (budget) {
        totalBudget = budget.assignedAmount || 0;
        budgetDetails.push({
          routeId: budget.routeId._id,
          routeName: budget.routeId.name,
          assignedAmount: budget.assignedAmount || 0,
        });
      }
    } else {
      // Si no se proporciona routeId, mantener lógica original (sumar todas las rutas o buscar por sucursal)
      let budgets = await Budget.find({
        companyId: companyId,
        brandId: brandId,
        branchId: branchId,
        expenseConceptId: expenseConceptId,
        month: month,
        routeId: { $ne: null }
      }).populate('routeId');

      if (budgets.length > 0) {
        for (const budget of budgets) {
          totalBudget += budget.assignedAmount || 0;
          budgetDetails.push({
            routeId: budget.routeId._id,
            routeName: budget.routeId.name,
            assignedAmount: budget.assignedAmount || 0,
          });
        }
      } else {
        const budget = await Budget.findOne({
          companyId: companyId,
          brandId: brandId,
          branchId: branchId,
          expenseConceptId: expenseConceptId,
          month: month,
          routeId: null,
        });

        if (budget) {
          totalBudget = budget.assignedAmount || 0;
          budgetDetails.push({
            branchId: branchId,
            assignedAmount: budget.assignedAmount || 0,
          });
        }
      }
    }

    const InvoicesPackage = mongoose.model("cc_invoices_package");
    
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    let totalSpent = 0;

    const InvoicesPackageCompany = mongoose.model("rs_invoices_packages_companies");
    const packagesByMonth = await InvoicesPackage.find({
      fechaPago: {
        $gte: startDate,
        $lte: endDate
      },
      estatus: { $ne: "Cancelado" }
    });

    for (const packageData of packagesByMonth) {
      const packageCompanyInfo = await InvoicesPackageCompany.findByPackageId(packageData._id);
      
      if (packageCompanyInfo && 
          packageCompanyInfo.companyId._id.toString() === companyId.toString() &&
          packageCompanyInfo.brandId._id.toString() === brandId.toString() &&
          packageCompanyInfo.branchId._id.toString() === branchId.toString()) {
        
        // Si se proporciona routeId, también verificar que el paquete sea de la misma ruta
        if (routeId && packageCompanyInfo.routeId && 
            packageCompanyInfo.routeId._id.toString() !== routeId.toString()) {
          continue; // Saltar este paquete si no es de la ruta especificada
        }
        
        if (packageData.facturas && Array.isArray(packageData.facturas)) {
          for (const facturaEmbebida of packageData.facturas) {
            if (facturaEmbebida.conceptoGasto && 
                facturaEmbebida.conceptoGasto.id && 
                facturaEmbebida.conceptoGasto.id.toString() === expenseConceptId) {
              
              if (facturaEmbebida.autorizada !== false) {
                const importePagado = facturaEmbebida.importePagado || 0;
                totalSpent += importePagado;
              }
            }
          }
        }

        if (packageData.pagosEfectivo && Array.isArray(packageData.pagosEfectivo)) {
          for (const pagoEmbebido of packageData.pagosEfectivo) {
            if (pagoEmbebido.expenseConcept && 
                pagoEmbebido.expenseConcept._id &&
                pagoEmbebido.expenseConcept._id.toString() === expenseConceptId) {
              
              if (pagoEmbebido.autorizada !== false) {
                const importeAPagar = pagoEmbebido.importeAPagar || 0;
                totalSpent += importeAPagar;
              }
            }
          }
        }
      }
    }

    const availableBudget = Math.max(0, totalBudget - totalSpent);

    res.json({
      success: true,
      data: {
        expenseConceptId: expenseConceptId,
        expenseConceptName: expenseConcept.name,
        categoryId: expenseConcept.categoryId._id,
        categoryName: expenseConcept.categoryId.name,
        hasRoutes: routeId ? true : budgetDetails.some(detail => detail.routeId),
        month: month,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        availableBudget: availableBudget,
        budgetDetails: budgetDetails,
      },
      message: "Presupuesto del concepto de gasto obtenido exitosamente",
    });
  } catch (error) {
    console.error("Error obteniendo presupuesto por concepto de gasto:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo presupuesto por concepto de gasto",
      error: error.message,
    });
  }
};

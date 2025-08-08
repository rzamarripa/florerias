import mongoose from "mongoose";

export const fixBudgetIndexes = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("cc_budgets");

    // Listar índices existentes
    const existingIndexes = await collection.listIndexes().toArray();

    const indexesList = existingIndexes.map((index) => ({
      name: index.name,
      key: index.key,
      partialFilter: index.partialFilterExpression || null,
    }));

    console.log("=== ÍNDICES EXISTENTES ===");
    indexesList.forEach((index) => {
      console.log(`${index.name}: ${JSON.stringify(index.key)}`);
      if (index.partialFilter) {
        console.log(`  - Filtro: ${JSON.stringify(index.partialFilter)}`);
      }
    });

    // Eliminar índices problemáticos (mantener solo _id_)
    const indexesToDrop = existingIndexes.filter(
      (index) =>
        index.name !== "_id_" &&
        (index.name.includes("routeId") || index.name.includes("brandId"))
    );

    const droppedIndexes = [];
    for (const index of indexesToDrop) {
      try {
        await collection.dropIndex(index.name);
        droppedIndexes.push(index.name);
        console.log(`✅ Índice eliminado: ${index.name}`);
      } catch (error) {
        console.log(`❌ Error eliminando índice ${index.name}:`, error.message);
      }
    }

    console.log("=== CREANDO ÍNDICES CORRECTOS ===");

    const createdIndexes = [];

    // Crear índice para categorías con rutas
    try {
      await collection.createIndex(
        {
          routeId: 1,
          brandId: 1,
          companyId: 1,
          categoryId: 1,
          expenseConceptId: 1,
          month: 1,
        },
        {
          unique: true,
          partialFilterExpression: { routeId: { $exists: true, $ne: null } },
          name: "budget_with_routes_unique",
        }
      );
      createdIndexes.push("budget_with_routes_unique");
      console.log("✅ Índice para categorías con rutas creado");
    } catch (error) {
      console.log(
        "❌ Error creando índice para categorías con rutas:",
        error.message
      );
    }

    // Crear índice para categorías sin rutas
    try {
      await collection.createIndex(
        {
          brandId: 1,
          companyId: 1,
          branchId: 1,
          categoryId: 1,
          expenseConceptId: 1,
          month: 1,
        },
        {
          unique: true,
          partialFilterExpression: { routeId: null },
          name: "budget_without_routes_unique",
        }
      );
      createdIndexes.push("budget_without_routes_unique");
      console.log("✅ Índice para categorías sin rutas creado");
    } catch (error) {
      console.log(
        "❌ Error creando índice para categorías sin rutas:",
        error.message
      );
    }

    // Verificar índices finales
    const finalIndexes = await collection.listIndexes().toArray();
    const finalIndexesList = finalIndexes.map((index) => ({
      name: index.name,
      key: index.key,
      partialFilter: index.partialFilterExpression || null,
    }));

    console.log("=== ÍNDICES FINALES ===");
    finalIndexesList.forEach((index) => {
      console.log(`${index.name}: ${JSON.stringify(index.key)}`);
      if (index.partialFilter) {
        console.log(`  - Filtro: ${JSON.stringify(index.partialFilter)}`);
      }
    });

    res.json({
      success: true,
      message: "Índices corregidos exitosamente",
      data: {
        existingIndexes: indexesList,
        droppedIndexes,
        createdIndexes,
        finalIndexes: finalIndexesList,
      },
    });
  } catch (error) {
    console.error("❌ Error corrigiendo índices:", error);
    res.status(500).json({
      success: false,
      message: "Error corrigiendo índices",
      error: error.message,
    });
  }
};

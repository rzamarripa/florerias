export const fixBudgetIndexes = async (req, res) => {
  try {
    // Simplificado - colecciones eliminadas
    console.log("=== ÍNDICES EXISTENTES ===");
    console.log("No hay colecciones para procesar");
    
    const droppedIndexes = [];
    const createdIndexes = [];

    res.json({
      success: true,
      message: "Índices corregidos exitosamente",
      data: {
        existingIndexes: [],
        droppedIndexes,
        createdIndexes,
        finalIndexes: [],
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
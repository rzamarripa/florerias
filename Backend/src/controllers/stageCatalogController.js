import { StageCatalog } from "../models/StageCatalog.js";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { Branch } from "../models/Branch.js";

// Crear nueva etapa
export const createStageCatalog = async (req, res) => {
  try {
    const { name, abreviation, stageNumber, color, boardType } = req.body;

    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar permisos según el rol
    if (userRole !== "Super Admin" && userRole !== "Administrador") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear etapas",
      });
    }

    let companyId;
    let administratorId;

    if (userRole === "Super Admin") {
      // Super Admin debe proporcionar el ID de la empresa
      if (!req.body.company) {
        return res.status(400).json({
          success: false,
          message: "Debes proporcionar el ID de la empresa",
        });
      }

      const company = await Company.findById(req.body.company);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Empresa no encontrada",
        });
      }

      companyId = company._id;
      administratorId = company.administrator;
    } else if (userRole === "Administrador") {
      // Buscar la empresa del administrador
      const company = await Company.findOne({
        administrator: req.user._id,
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No tienes una empresa asignada",
        });
      }

      companyId = company._id;
      administratorId = req.user._id;
    }

    // Verificar que no exista una etapa con el mismo nombre, tipo de tablero en la empresa
    const existingStageByName = await StageCatalog.findOne({
      company: companyId,
      name: name,
      boardType: boardType,
    });

    if (existingStageByName) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una etapa con este nombre y tipo de tablero en la empresa",
      });
    }

    // Verificar que no exista una etapa con el mismo número y tipo de tablero en la empresa
    const existingStageByNumber = await StageCatalog.findOne({
      company: companyId,
      stageNumber: stageNumber,
      boardType: boardType,
    });

    if (existingStageByNumber) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una etapa con este número y tipo de tablero en la empresa",
      });
    }

    const stageCatalog = await StageCatalog.create({
      administrator: administratorId,
      company: companyId,
      name,
      abreviation,
      stageNumber,
      color,
      boardType,
    });

    // Popular los datos para la respuesta
    await stageCatalog.populate([
      { path: "administrator", select: "name email" },
      { path: "company", select: "legalName tradeName" },
    ]);

    res.status(201).json({
      success: true,
      message: "Etapa creada exitosamente",
      data: stageCatalog,
    });
  } catch (error) {
    // Manejar error de duplicado por índice único
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una etapa con este nombre o número y tipo de tablero en la empresa",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener todas las etapas
export const getAllStageCatalogs = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Filtrado por rol
    if (userRole === "Super Admin") {
      // Super Admin puede ver todas las etapas
      // Si envía companyId como filtro, aplicarlo
      if (req.query.company) {
        filters.company = req.query.company;
      }
    } else if (userRole === "Administrador") {
      // Administrador solo ve etapas de su empresa
      const userCompany = await Company.findOne({
        administrator: req.user._id,
      });

      if (!userCompany) {
        return res.status(403).json({
          success: false,
          message: "No tienes una empresa asignada",
        });
      }

      filters.company = userCompany._id;
    } else {
      // Otros roles no tienen acceso
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver etapas",
      });
    }

    // Filtros opcionales
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === "true";
    }

    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { abreviation: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const stageCatalogs = await StageCatalog.find(filters)
      .populate("administrator", "name email")
      .populate("company", "legalName tradeName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await StageCatalog.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: stageCatalogs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: stageCatalogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener etapa por ID
export const getStageCatalogById = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    const stageCatalog = await StageCatalog.findById(req.params.id)
      .populate("administrator", "name email")
      .populate("company", "legalName tradeName");

    if (!stageCatalog) {
      return res.status(404).json({
        success: false,
        message: "Etapa no encontrada",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      if (userRole === "Administrador") {
        if (stageCatalog.administrator._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver esta etapa",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para ver esta etapa",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: stageCatalog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Actualizar etapa
export const updateStageCatalog = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que la etapa existe
    const existingStage = await StageCatalog.findById(req.params.id).populate("company");

    if (!existingStage) {
      return res.status(404).json({
        success: false,
        message: "Etapa no encontrada",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      if (userRole === "Administrador") {
        if (existingStage.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para actualizar esta etapa",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para actualizar esta etapa",
        });
      }
    }

    const { name, abreviation, stageNumber, color, boardType } = req.body;

    // Determinar el tipo de tablero a usar para validaciones
    const targetBoardType = boardType || existingStage.boardType;

    // Si se está actualizando el nombre o boardType, verificar que no exista otra etapa con esa combinación
    if ((name && name !== existingStage.name) || (boardType && boardType !== existingStage.boardType)) {
      const targetName = name || existingStage.name;
      const duplicateStage = await StageCatalog.findOne({
        company: existingStage.company._id,
        name: targetName,
        boardType: targetBoardType,
        _id: { $ne: req.params.id },
      });

      if (duplicateStage) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una etapa con este nombre y tipo de tablero en la empresa",
        });
      }
    }

    // Si se está actualizando el número o boardType, verificar que no exista otra etapa con esa combinación
    if ((stageNumber && stageNumber !== existingStage.stageNumber) || (boardType && boardType !== existingStage.boardType)) {
      const targetStageNumber = stageNumber || existingStage.stageNumber;
      const duplicateStageNumber = await StageCatalog.findOne({
        company: existingStage.company._id,
        stageNumber: targetStageNumber,
        boardType: targetBoardType,
        _id: { $ne: req.params.id },
      });

      if (duplicateStageNumber) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una etapa con este número y tipo de tablero en la empresa",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (abreviation) updateData.abreviation = abreviation;
    if (stageNumber) updateData.stageNumber = stageNumber;
    if (color) updateData.color = color;
    if (boardType) updateData.boardType = boardType;

    const stageCatalog = await StageCatalog.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("administrator", "name email")
      .populate("company", "legalName tradeName");

    res.status(200).json({
      success: true,
      message: "Etapa actualizada exitosamente",
      data: stageCatalog,
    });
  } catch (error) {
    // Manejar error de duplicado por índice único
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una etapa con este nombre o número y tipo de tablero en la empresa",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Desactivar etapa
export const deactivateStageCatalog = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que la etapa existe
    const existingStage = await StageCatalog.findById(req.params.id).populate("company");

    if (!existingStage) {
      return res.status(404).json({
        success: false,
        message: "Etapa no encontrada",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      if (userRole === "Administrador") {
        if (existingStage.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para desactivar esta etapa",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para desactivar esta etapa",
        });
      }
    }

    const stageCatalog = await StageCatalog.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate("administrator", "name email")
      .populate("company", "legalName tradeName");

    res.status(200).json({
      success: true,
      message: "Etapa desactivada exitosamente",
      data: stageCatalog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activar etapa
export const activateStageCatalog = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que la etapa existe
    const existingStage = await StageCatalog.findById(req.params.id).populate("company");

    if (!existingStage) {
      return res.status(404).json({
        success: false,
        message: "Etapa no encontrada",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      if (userRole === "Administrador") {
        if (existingStage.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para activar esta etapa",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para activar esta etapa",
        });
      }
    }

    const stageCatalog = await StageCatalog.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )
      .populate("administrator", "name email")
      .populate("company", "legalName tradeName");

    res.status(200).json({
      success: true,
      message: "Etapa activada exitosamente",
      data: stageCatalog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Eliminar etapa (físicamente)
export const deleteStageCatalog = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;

    // Verificar que la etapa existe
    const existingStage = await StageCatalog.findById(req.params.id).populate("company");

    if (!existingStage) {
      return res.status(404).json({
        success: false,
        message: "Etapa no encontrada",
      });
    }

    // Verificar permisos según el rol
    if (userRole !== "Super Admin") {
      if (userRole === "Administrador") {
        if (existingStage.administrator.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar esta etapa",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para eliminar esta etapa",
        });
      }
    }

    const stageCatalog = await StageCatalog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Etapa eliminada exitosamente",
      data: stageCatalog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Obtener etapas del usuario según su rol (para Pizarrón de Ventas)
export const getUserStages = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Obtener el rol del usuario
    const currentUser = await User.findById(req.user._id).populate("role");

    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: "Usuario sin rol asignado",
      });
    }

    const userRole = currentUser.role.name;
    let companyId = null;

    // Obtener la empresa según el rol
    if (userRole === "Administrador") {
      // Buscar empresa por campo administrator
      const company = await Company.findOne({
        administrator: req.user._id,
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "No tienes una empresa asignada",
        });
      }

      companyId = company._id;
    } else if (userRole === "Gerente") {
      // Buscar branch por campo manager
      const branch = await Branch.findOne({
        manager: req.user._id,
      }).populate("companyId");

      if (!branch || !branch.companyId) {
        return res.status(404).json({
          success: false,
          message: "No tienes una sucursal asignada o la sucursal no tiene empresa asociada",
        });
      }

      companyId = branch.companyId._id;
    } else {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver las etapas. Solo Administradores y Gerentes pueden acceder al pizarrón de ventas.",
      });
    }

    // Construir filtros
    const filters = {
      company: companyId,
      isActive: true, // Solo etapas activas
    };

    // Filtrar por tipo de tablero si se especifica
    if (req.query.boardType) {
      filters.boardType = req.query.boardType;
    }

    // Obtener etapas ordenadas por stageNumber ascendente
    const stages = await StageCatalog.find(filters)
      .populate("administrator", "name email")
      .populate("company", "legalName tradeName")
      .sort({ stageNumber: 1 }); // Orden ascendente por número de etapa

    res.status(200).json({
      success: true,
      count: stages.length,
      data: stages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

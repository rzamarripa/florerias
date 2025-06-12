import { Role } from '../models/Roles.js';
import { Page } from '../models/Page.js';

// Middleware para verificar acceso a páginas específicas
const authorizePageAccess = (pagePath) => {
  return async (req, res, next) => {
    try {
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'User has no role assigned'
        });
      }

      // Buscar el role del usuario
      const userRole = await Role.findOne({ name: req.user.role });
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'User role not found'
        });
      }

      // Verificar si el role tiene acceso a la página
      const hasPageAccess = userRole.pages.some(page => 
        page.path === pagePath || page.path === `/${pagePath}` || page.path === pagePath.replace('/', '')
      );

      if (!hasPageAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied to page: ${pagePath}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Middleware para verificar acceso a módulos específicos
const authorizeModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'User has no role assigned'
        });
      }

      // Buscar el role del usuario
      const userRole = await Role.findOne({ name: req.user.role });
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'User role not found'
        });
      }

      // Verificar acceso através de las páginas del role
      let hasModuleAccess = false;
      
      for (const rolePage of userRole.pages) {
        // Buscar la página completa en la base de datos
        const fullPage = await Page.findOne({ path: rolePage.path })
          .populate('modules.moduleId');
        
        if (fullPage) {
          // Verificar si alguno de los módulos de la página coincide
          const moduleExists = fullPage.modules.some(module => 
            module.nombre.toLowerCase() === moduleName.toLowerCase() ||
            (module.moduleId && module.moduleId.name.toLowerCase() === moduleName.toLowerCase())
          );
          
          if (moduleExists) {
            hasModuleAccess = true;
            break;
          }
        }
      }

      if (!hasModuleAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied to module: ${moduleName}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Middleware para verificar si el usuario puede ver páginas activas únicamente
const filterActivePages = () => {
  return async (req, res, next) => {
    try {
      // Agregar filtro para páginas activas en las consultas
      if (!req.query.status) {
        req.query.status = 'true'; // Solo páginas activas por defecto
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Middleware para verificar si el usuario puede ver módulos activos únicamente
const filterActiveModules = () => {
  return async (req, res, next) => {
    try {
      // Agregar filtro para módulos activos en las consultas
      if (!req.query.status) {
        req.query.status = 'true'; // Solo módulos activos por defecto
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

// Función utilitaria para obtener páginas accesibles por un usuario
const getUserAccessiblePages = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.role) {
      return [];
    }

    const userRole = await Role.findOne({ name: user.role });
    if (!userRole) {
      return [];
    }

    // Obtener las páginas completas que el usuario puede acceder
    const accessiblePages = [];
    for (const rolePage of userRole.pages) {
      const fullPage = await Page.findOne({ 
        path: rolePage.path,
        status: true 
      }).populate('modules.moduleId');
      
      if (fullPage) {
        accessiblePages.push(fullPage);
      }
    }

    return accessiblePages;
  } catch (error) {
    console.error('Error getting user accessible pages:', error);
    return [];
  }
};

// Función utilitaria para obtener módulos accesibles por un usuario
const getUserAccessibleModules = async (userId) => {
  try {
    const accessiblePages = await getUserAccessiblePages(userId);
    const accessibleModules = [];

    for (const page of accessiblePages) {
      for (const pageModule of page.modules) {
        if (pageModule.moduleId && pageModule.moduleId.status) {
          accessibleModules.push({
            ...pageModule.moduleId.toObject(),
            page: {
              _id: page._id,
              name: page.name,
              path: page.path
            }
          });
        }
      }
    }

    return accessibleModules;
  } catch (error) {
    console.error('Error getting user accessible modules:', error);
    return [];
  }
};

export {
  authorizePageAccess,
  authorizeModuleAccess,
  filterActivePages,
  filterActiveModules,
  getUserAccessiblePages,
  getUserAccessibleModules
};
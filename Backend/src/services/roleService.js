import { Role } from "../models/Roles.js";
import { Module } from "../models/Module.js";
import {User} from "../models/User.js";

export const roleService = {
  /**
   * Crea un nuevo rol con validaciones
   * @param {Object} roleData - Datos del rol a crear
   * @param {string} roleData.name - Nombre del rol
   * @param {Array} roleData.modules - Array de IDs de módulos
   * @returns {Promise<Object>} - Rol creado
   */
  createRole: async (roleData) => {
    const { name, modules } = roleData;

    // Validar que el nombre no esté vacío
    if (!name || !name.trim()) {
      throw new Error("El nombre del rol es requerido");
    }

    // Verificar si el rol ya existe
    const roleExists = await Role.findOne({ name: name.trim() });
    if (roleExists) {
      throw new Error("Ya existe un rol con este nombre");
    }

    // Validar que los módulos sean IDs válidos si se proporcionan
    let validModules = [];
    if (modules && Array.isArray(modules)) {
      // Si modules es un array de strings (IDs), validar que existan
      const moduleIds = modules.map(module => 
        typeof module === 'string' ? module : module._id || module
      );
      
      // Verificar que todos los módulos existan
      const existingModules = await Module.find({ _id: { $in: moduleIds } });
      if (existingModules.length !== moduleIds.length) {
        throw new Error("Algunos módulos no existen");
      }
      
      validModules = moduleIds;
    }

    const role = await Role.create({
      name: name.trim(),
      description: "",
      modules: validModules,
    });

    return role;
  },

  /**
   * Obtiene todos los roles
   * @returns {Promise<Array>} - Lista de roles
   */
  getAllRoles: async () => {
    return await Role.find()
      .select("name description estatus modules createdAt")
      .sort({ createdAt: -1 });
  },

  /**
   * Obtiene un rol por ID
   * @param {string} id - ID del rol
   * @returns {Promise<Object>} - Rol encontrado
   */
  getRoleById: async (id) => {
    const role = await Role.findById(id).select(
      "name description estatus modules createdAt"
    );
    
    if (!role) {
      throw new Error("Rol no encontrado");
    }
    
    return role;
  },

  /**
   * Actualiza un rol
   * @param {string} id - ID del rol
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Rol actualizado
   */
  updateRole: async (id, updateData) => {
    const { name, description, modules } = updateData;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description;
    if (modules !== undefined) {
      // Validar módulos si se proporcionan
      if (Array.isArray(modules)) {
        const moduleIds = modules.map(module => 
          typeof module === 'string' ? module : module._id || module
        );
        
        const existingModules = await Module.find({ _id: { $in: moduleIds } });
        if (existingModules.length !== moduleIds.length) {
          throw new Error("Algunos módulos no existen");
        }
        
        updateFields.modules = moduleIds;
      } else {
        updateFields.modules = [];
      }
    }

    const role = await Role.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!role) {
      throw new Error("Rol no encontrado");
    }

    return role;
  },

  /**
   * Elimina un rol (cambia estatus a false)
   * @param {string} id - ID del rol
   * @returns {Promise<Object>} - Rol eliminado
   */
  deleteRole: async (id) => {
    const role = await Role.findByIdAndUpdate(
      id,
      { estatus: false },
      { new: true }
    );

    if (!role) {
      throw new Error("Rol no encontrado");
    }

    return role;
  },
};

export const setUserRole = async (userId, role) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const roleId = role._id || role;
    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
      await user.save();
    }

    return user;
  } catch (error) {
    throw new Error(`Error setting user role: ${error.message}`);
  }
};

export const getUserRoles = async (userId) => {
  try {
    const user = await User.findById(userId).populate("roles");
    return user ? user.roles : [];
  } catch (error) {
    throw new Error(`Error getting user roles: ${error.message}`);
  }
};

export const userHasRole = async (userId, roleName) => {
  try {
    const user = await User.findById(userId).populate("roles");
    if (!user) return false;

    return user.roles.some((role) => role.name === roleName);
  } catch (error) {
    throw new Error(`Error checking user role: ${error.message}`);
  }
};

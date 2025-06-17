import { Role } from "../models/Roles.js";

const createRole = async (req, res) => {
  try {
    const { name, modules } = req.body;

    const roleExists = await Role.findOne({ name: name });
    if (roleExists) {
      return res.status(400).json({
        success: false,
        message: "Role already exists with this name",
      });
    }

    const role = await Role.create({
      name,
      description: "",
      modules: modules || [],
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: {
        _id: role._id,
        name: role.name,
        description: role.description,
        estatus: role.estatus,
        createdAt: role.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .select("name description estatus modules createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).select(
      "name description estatus createdAt"
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRoleModules = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate({
      path: "ac_module",
      populate: {
        path: "ac_page",
        select: "name path",
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    let modulesByPage = [];
    if (role.modules && role.modules.length > 0) {
      const grouped = {};
      role.modules.forEach((module) => {
        const pageKey = module.page._id.toString();
        if (!grouped[pageKey]) {
          grouped[pageKey] = {
            page: module.page.name,
            pageId: module.page._id,
            path: module.page.path,
            modules: [],
          };
        }
        grouped[pageKey].modules.push({
          name: module.name,
          _id: module._id,
        });
      });
      modulesByPage = Object.values(grouped);
    }

    res.status(200).json({
      success: true,
      data: {
        roleId: role._id,
        roleName: role.name,
        modulesByPage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, description, modules } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (modules !== undefined) updateData.modules = modules;

    const role = await Role.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: {
        _id: role._id,
        name: role.name,
        description: role.description,
        estatus: role.estatus,
        createdAt: role.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { estatus: false },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  getRoleModules,
  updateRole,
};

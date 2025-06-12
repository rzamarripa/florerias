import { Module } from "../models/Module.js";
import { Page } from "../models/Page.js";
import { Role } from "../models/Roles.js";
import { User } from "../models/User.js";

export const validateRolePageAccess = async (roleName, pagePath) => {
  try {
    const role = await Role.findOne({ name: roleName });
    if (!role) return false;

    return role.pages.some(
      (page) =>
        page.path === pagePath ||
        page.path === `/${pagePath}` ||
        page.path === pagePath.replace("/", "")
    );
  } catch (error) {
    console.error("Error validating role page access:", error);
    return false;
  }
};

export const getActivePages = async () => {
  try {
    return await Page.find({ status: true })
      .populate("modules.moduleId", "name description status")
      .sort({ name: 1 });
  } catch (error) {
    console.error("Error getting active pages:", error);
    return [];
  }
};

export const getActiveModules = async () => {
  try {
    return await Module.find({ status: true })
      .populate("page", "name description path status")
      .sort({ name: 1 });
  } catch (error) {
    console.error("Error getting active modules:", error);
    return [];
  }
};

export const syncRolePagesWithDatabase = async () => {
  try {
    const roles = await Role.find({});
    const allPages = await Page.find({ status: true });

    for (const role of roles) {
      const validPages = [];

      for (const rolePage of role.pages) {
        const pageExists = allPages.find((p) => p.path === rolePage.path);
        if (pageExists) {
          validPages.push({
            name: pageExists.name,
            path: pageExists.path,
          });
        }
      }

      if (validPages.length !== role.pages.length) {
        role.pages = validPages;
        await role.save();
        console.log(
          `Updated role ${role.name} with ${validPages.length} valid pages`
        );
      }
    }

    return { success: true, message: "Roles synchronized with database pages" };
  } catch (error) {
    console.error("Error syncing roles with pages:", error);
    return { success: false, message: error.message };
  }
};

export const getSystemStats = async () => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalPages,
      activePages,
      totalModules,
      activeModules,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ "profile.estatus": true }),
      Role.countDocuments(),
      Page.countDocuments(),
      Page.countDocuments({ status: true }),
      Module.countDocuments(),
      Module.countDocuments({ status: true }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      roles: {
        total: totalRoles,
      },
      pages: {
        total: totalPages,
        active: activePages,
        inactive: totalPages - activePages,
      },
      modules: {
        total: totalModules,
        active: activeModules,
        inactive: totalModules - activeModules,
      },
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    return null;
  }
};

export const validatePageData = (pageData) => {
  const errors = [];

  if (!pageData.name || pageData.name.trim().length === 0) {
    errors.push("Page name is required");
  }

  if (!pageData.path || pageData.path.trim().length === 0) {
    errors.push("Page path is required");
  }

  if (pageData.path && !pageData.path.startsWith("/")) {
    errors.push('Page path must start with "/"');
  }

  if (pageData.modules && Array.isArray(pageData.modules)) {
    pageData.modules.forEach((module, index) => {
      if (!module.moduleId) {
        errors.push(`Module at index ${index} must have a moduleId`);
      }
      if (!module.nombre || module.nombre.trim().length === 0) {
        errors.push(`Module at index ${index} must have a nombre`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateModuleData = (moduleData) => {
  const errors = [];

  if (!moduleData.name || moduleData.name.trim().length === 0) {
    errors.push("Module name is required");
  }

  if (!moduleData.page) {
    errors.push("Page reference is required for module");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizePageData = (pageData) => {
  return {
    ...pageData,
    name: pageData.name?.trim(),
    description: pageData.description?.trim(),
    path: pageData.path?.trim(),
    modules: pageData.modules?.map((module) => ({
      ...module,
      nombre: module.nombre?.trim(),
      description: module.description?.trim(),
    })),
  };
};

export const sanitizeModuleData = (moduleData) => {
  return {
    ...moduleData,
    name: moduleData.name?.trim(),
    description: moduleData.description?.trim(),
  };
};

export const searchPages = async (searchCriteria) => {
  try {
    const {
      name,
      path,
      status,
      hasModules,
      moduleCount,
      page = 1,
      limit = 10,
    } = searchCriteria;

    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (path) {
      query.path = { $regex: path, $options: "i" };
    }

    if (status !== undefined) {
      query.status = status;
    }

    if (hasModules !== undefined) {
      if (hasModules) {
        query["modules.0"] = { $exists: true };
      } else {
        query.modules = { $size: 0 };
      }
    }

    if (moduleCount !== undefined) {
      query.modules = { $size: parseInt(moduleCount) };
    }

    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      Page.find(query)
        .populate("modules.moduleId", "name description status")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Page.countDocuments(query),
    ]);

    return {
      pages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error searching pages:", error);
    return { pages: [], pagination: {} };
  }
};

export const searchModules = async (searchCriteria) => {
  try {
    const {
      name,
      pageId,
      pageName,
      status,
      page = 1,
      limit = 10,
    } = searchCriteria;

    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (pageId) {
      query.page = pageId;
    }

    if (status !== undefined) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    let modules, total;

    if (pageName) {
      const aggregationPipeline = [
        {
          $lookup: {
            from: "pages",
            localField: "page",
            foreignField: "_id",
            as: "pageInfo",
          },
        },
        {
          $match: {
            ...query,
            "pageInfo.name": { $regex: pageName, $options: "i" },
          },
        },
        { $skip: skip },
        { $limit: limit },
        { $sort: { createdAt: -1 } },
      ];

      modules = await Module.aggregate(aggregationPipeline);

      await Module.populate(modules, {
        path: "page",
        select: "name description path status",
      });

      total = await Module.aggregate([
        {
          $lookup: {
            from: "pages",
            localField: "page",
            foreignField: "_id",
            as: "pageInfo",
          },
        },
        {
          $match: {
            ...query,
            "pageInfo.name": { $regex: pageName, $options: "i" },
          },
        },
        { $count: "total" },
      ]);

      total = total[0]?.total || 0;
    } else {
      [modules, total] = await Promise.all([
        Module.find(query)
          .populate("page", "name description path status")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Module.countDocuments(query),
      ]);
    }

    return {
      modules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error searching modules:", error);
    return { modules: [], pagination: {} };
  }
};

import jwt from "jsonwebtoken";
import { Role } from "../models/Roles.js";
import { User } from "../models/User.js";
import { getAllCompanies } from "./companyController.js";
import { Company } from "../models/Company.js";
import { Branch } from "../models/Branch.js";

export const generateToken = (userId, role, branchIds = []) => {
  return jwt.sign(
    {
      id: userId,        // Mantener compatibilidad con código existente
      userId,            // Campo explícito para sockets
      role,
      branchIds          // Array de sucursales que administra el usuario
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

export const registerUser = async (req, res) => {
  try {
    let userData;

    if (req.body.userData) {
      userData = JSON.parse(req.body.userData);
    } else {
      userData = req.body;
    }

    const { username, email, phone, password, profile, role } =
      userData;

    // Validación case-insensitive para username y email
    const userExists = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ],
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message:
          userExists.username.toLowerCase() === username.toLowerCase()
            ? "User already exists with this username"
            : "User already exists with this email",
      });
    }

    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      // Validación: Solo Super Admin puede crear usuarios con rol Distribuidor
      if (roleExists.name === "Distribuidor") {
        if (!req.user || !req.user._id) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const creatorUser = await User.findById(req.user._id).populate("role");

        if (!creatorUser || !creatorUser.role || creatorUser.role.name !== "Super Admin") {
          return res.status(403).json({
            success: false,
            message: "Solo usuarios con rol Super Admin pueden crear usuarios con rol Distribuidor",
          });
        }
      }
    }

    const newUserData = {
      username,
      email,
      phone,
      password,
      profile: {
        name: profile?.name || "",
        lastName: profile?.lastName || "",
        fullName: profile?.fullName || "",
        path: profile?.path || "",
        estatus: profile?.estatus !== undefined ? profile.estatus : true,
      },
      role: role || null,
    };

    if (req.file) {
      newUserData.profile.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const user = await User.create(newUserData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          profile: user.profile,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password",
      });
    }

    const user = await User.findOne({ username })
      .select("+password")
      .populate({
        path: "role",
        populate: {
          path: "modules",
          populate: {
            path: "page",
            select: "name path",
          },
        },
      });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (!user.profile.estatus) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    let allowedModules = [];
    if (user.role && user.role.modules) {
      const modulesByPage = {};

      user.role.modules.forEach((module) => {
        const pageKey = module.page._id.toString();
        if (!modulesByPage[pageKey]) {
          modulesByPage[pageKey] = {
            page: module.page.name,
            pageId: module.page._id,
            path: module.page.path,
            modules: [],
          };
        }
        modulesByPage[pageKey].modules.push({
          name: module.name,
          _id: module._id,
        });
      });

      allowedModules = Object.values(modulesByPage);
    }

    // Obtener las sucursales que administra el usuario
    const userBranches = await Branch.find({ administrator: user._id }).select('_id');
    const branchIds = userBranches.map(branch => branch._id.toString());

    console.log(`\n👤 [Login] Usuario: ${user.username} (${user._id})`);
    console.log(`   Sucursales encontradas: ${userBranches.length}`);
    console.log(`   branchIds:`, branchIds);

    const token = generateToken(user._id, user.role?.name || null, branchIds);
    console.log(`   Token generado con branchIds incluidos\n`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.getPublicProfile(),
        role: user.role?.name || null,
        allowedModules,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filters = {};
    const branchId = req.query.branchId;

    if (req.query.estatus !== undefined) {
      filters["profile.estatus"] = req.query.estatus === "true";
    }
    if (req.query.username) {
      filters.username = { $regex: req.query.username, $options: "i" };
    }
    const currentUser = req.user;
    const userRole = currentUser.role.name;

        if (userRole === "Distribuidor") {
          const companies = await Company.find({
            distributor: currentUser._id,
          });
        const administrators = companies.map((company) => company.administrator);
        filters._id = { $in: administrators };
        }
    if (userRole === "Administrador") {
      let branchQuery = {
        administrator: currentUser._id
      };

      // Si se proporciona un branchId específico, filtrar solo por esa sucursal
      if (branchId) {
        branchQuery._id = branchId;
      }

      const branches = await Branch.find(branchQuery);

      // Obtener todos los empleados y managers de las sucursales filtradas
      const userIds = branches.reduce((acc, branch) => {
        // Agregar el manager
        if (branch.manager) {
          acc.push(branch.manager);
        }
        // Agregar todos los empleados
        return acc.concat(branch.employees);
      }, []);
      filters._id = { $in: userIds };
    }

    const users = await User.find(filters)
      .populate("role", "name description")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filters);

    const transformedUsers = users.map((user) => {
      const userObj = user.toObject();

      if (userObj.role) {
        userObj.role = {
          _id: userObj.role._id,
          name: userObj.role.name,
        };
      }

      return userObj;
    });

    res.status(200).json({
      success: true,
      count: transformedUsers.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: transformedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "role",
      "name description"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    let userData;

    if (req.body.userData) {
      userData = JSON.parse(req.body.userData);
    } else {
      userData = req.body;
    }

    const { username, email, phone, profile, role } = userData;

    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    if (profile) {
      updateData.profile = {
        name: profile.name,
        lastName: profile.lastName,
        fullName: profile.fullName,
        path: profile.path,
        estatus: profile.estatus,
      };
      const existingUser = await User.findById(req.params.id);
      if (existingUser && existingUser.profile.image) {
        updateData.profile.image = existingUser.profile.image;
      }
    }

    if (req.file) {
      if (!updateData.profile) {
        updateData.profile = {};
      }
      updateData.profile.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      // Validación: Solo Super Admin puede asignar rol Distribuidor
      if (roleExists.name === "Distribuidor") {
        if (!req.user || !req.user._id) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado",
          });
        }

        const creatorUser = await User.findById(req.user._id).populate("role");

        if (!creatorUser || !creatorUser.role || creatorUser.role.name !== "Super Admin") {
          return res.status(403).json({
            success: false,
            message: "Solo usuarios con rol Super Admin pueden crear usuarios con rol Distribuidor",
          });
        }
      }

      updateData.role = role;
    }

    // Verificar si el email o username ya existe en otro usuario (case-insensitive)
    if (email || username) {
      const orConditions = [];

      if (email) {
        orConditions.push({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      }

      if (username) {
        orConditions.push({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      }

      const existingUser = await User.findOne({
        $or: orConditions,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            email && existingUser.email.toLowerCase() === email.toLowerCase()
              ? "Email already exists"
              : "Username already exists",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("role", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          profile: user.profile,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { "profile.estatus": false },
      { new: true }
    ).populate("role", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { "profile.estatus": true },
      { new: true }
    ).populate("role", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    const user = await User.findById(req.params.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignRoles = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Please provide a role ID",
      });
    }

    const roleExists = await Role.findById(role);

    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).populate("role", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role assigned successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Nueva función para actualizar solo la portada (profile.path)
export const updateUserCover = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res
        .status(400)
        .json({ success: false, message: "Falta el campo path" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { "profile.path": path },
      { new: true, runValidators: true }
    ).populate("role", "name description");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: "Portada actualizada correctamente",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

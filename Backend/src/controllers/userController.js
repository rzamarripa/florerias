import jwt from "jsonwebtoken";
import multer from "multer";
import { Role } from "../models/Roles.js";
import { User } from "../models/User.js";

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const registerUser = async (req, res) => {
  try {
    console.log("Registering user with data:", req.body);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Has file:", !!req.file);
    
    let userData;
    
    // Verificar si se envió como FormData o JSON
    if (req.body.userData) {
      // Datos enviados como FormData
      console.log("Processing as FormData");
      userData = JSON.parse(req.body.userData);
    } else {
      // Datos enviados como JSON
      console.log("Processing as JSON");
      userData = req.body;
    }
    
    console.log("Final userData:", userData);
    
    const { username, password, department, profile, role } = userData;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username",
      });
    }
    
    console.log('role: ', role);
    if (role) {
      const roleExists = await Role.findById(role);
      console.log(roleExists);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }
    }

    const newUserData = {
      username,
      password,
      department,
      profile: {
        nombre: profile?.nombre || "",
        nombreCompleto: profile?.nombreCompleto || "",
        path: profile?.path || "",
        estatus: profile?.estatus !== undefined ? profile.estatus : true,
      },
      role: role || null,
    };

    // Agregar imagen si se subió
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
          profile: user.profile,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password",
      });
    }
    console.log("user: ", username, password)
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
      console.log("user", user)

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

    const token = generateToken(user._id);

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

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.estatus !== undefined) {
      filters["profile.estatus"] = req.query.estatus === "true";
    }
    if (req.query.username) {
      filters.username = { $regex: req.query.username, $options: "i" };
    }

    const users = await User.find(filters)
      .populate("role", "name description")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
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

const updateUser = async (req, res) => {
  try {
    let userData;
    
    // Verificar si se envió como FormData o JSON
    if (req.body.userData) {
      // Datos enviados como FormData
      userData = JSON.parse(req.body.userData);
    } else {
      // Datos enviados como JSON
      userData = req.body;
    }
    
    const { username, department, profile, role } = userData;

    const updateData = {};

    if (username) updateData.username = username;
    if (department) updateData.department = department;

    if (profile) {
      updateData.profile = {
        nombre: profile.nombre,
        nombreCompleto: profile.nombreCompleto,
        path: profile.path,
        estatus: profile.estatus,
      };
      
      // Mantener la imagen existente si no se sube una nueva
      const existingUser = await User.findById(req.params.id);
      if (existingUser && existingUser.profile.image) {
        updateData.profile.image = existingUser.profile.image;
      }
    }

    // Agregar nueva imagen si se subió
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
      updateData.role = role;
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
      data: user,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changePassword = async (req, res) => {
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

const deleteUser = async (req, res) => {
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

const activateUser = async (req, res) => {
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

const assignRoles = async (req, res) => {
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

// Exportar el middleware de multer junto con las funciones
export {
  activateUser,
  assignRoles,
  changePassword,
  deleteUser,
  getAllUsers,
  getUserById,
  loginUser,
  registerUser,
  updateUser,
  upload,
};
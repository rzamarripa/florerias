import jwt from "jsonwebtoken";
import { Role } from "../models/Roles.js";
import { RsUserProvider } from "../models/UserProviders.js";
import { User } from "../models/User.js";

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const registerUser = async (req, res) => {
  try {
    let userData;

    if (req.body.userData) {
      userData = JSON.parse(req.body.userData);
    } else {
      userData = req.body;
    }

    const { username, password, department, profile, role } = userData;
    console.log(profile);

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username",
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
    }

    const newUserData = {
      username,
      password,
      department,
      profile: {
        name: profile?.name || "",
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
          path: "ac_module",
          populate: {
            path: "ac_page",
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

export const getAllUsers = async (req, res) => {
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

    const { username, department, profile, role } = userData;

    const updateData = {};

    if (username) updateData.username = username;
    if (department) updateData.department = department;

    if (profile) {
      updateData.profile = {
        name: profile.name,
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

export const getUserProviders = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userProviders = await RsUserProvider.getProvidersByUser(userId);
    res.status(200).json({
      success: true,
      data: userProviders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignProviders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { providerIds } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await RsUserProvider.deleteMany({ userId });

    const relations = await Promise.all(
      providerIds.map((providerId) =>
        RsUserProvider.createRelation(userId, providerId)
      )
    );

    const populatedRelations = await RsUserProvider.find({
      _id: { $in: relations.map((r) => r._id) },
    }).populate("providerId");

    res.status(200).json({
      success: true,
      message: "Providers assigned successfully",
      data: populatedRelations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeProvider = async (req, res) => {
  try {
    const { userId, providerId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await RsUserProvider.removeRelation(userId, providerId);

    res.status(200).json({
      success: true,
      message: "Provider removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

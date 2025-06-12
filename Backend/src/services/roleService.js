import Role from "../models/Roles.js";
import User from "../models/User.js";

export const createRole = async (
  roleName,
  description = "",
  permissions = []
) => {
  try {
    const role = new Role({
      name: roleName,
      description,
      permissions,
    });
    return await role.save();
  } catch (error) {
    throw new Error(`Error creating role: ${error.message}`);
  }
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

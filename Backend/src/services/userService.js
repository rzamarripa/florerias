import User from '../models/User.js';

// Función para crear usuario (equivalente a Accounts.createUser)
export const createUser = async (userData) => {
  try {
    const user = new User(userData);
    const savedUser = await user.save();
    return savedUser._id;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// Función para obtener usuario por ID
export const getUserById = async (userId) => {
  try {
    return await User.findById(userId).populate('roles');
  } catch (error) {
    throw new Error(`Error getting user: ${error.message}`);
  }
};

// Función para obtener usuario por username
export const getUserByUsername = async (username) => {
  try {
    return await User.findOne({ username }).populate('roles');
  } catch (error) {
    throw new Error(`Error getting user by username: ${error.message}`);
  }
};

// Función para actualizar perfil de usuario
export const updateUserProfile = async (userId, profileData) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profile: profileData } },
      { new: true, runValidators: true }
    );
    return user;
  } catch (error) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

// Función para contar usuarios
export const getUserCount = async () => {
  try {
    return await User.countDocuments();
  } catch (error) {
    throw new Error(`Error counting users: ${error.message}`);
  }
};
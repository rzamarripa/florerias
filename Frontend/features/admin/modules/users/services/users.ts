import { apiCall } from "@/utils/api";

export interface User {
  _id: string;
  username: string;
  department?: string;
  profile: {
    nombre: string;
    nombreCompleto: string;
    path: string;
    estatus: boolean;
  };
  role?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  department?: string;
  profile: {
    nombre: string;
    nombreCompleto: string;
    estatus?: boolean;
  };
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  department?: string;
  profile?: Partial<{
    nombre: string;
    nombreCompleto: string;
    estatus: boolean;
  }>;
  role?: string;
}

export const usersService = {
  getAllUsers: async (
    params: {
      page?: number;
      limit?: number;
      username?: string;
      estatus?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, username, estatus } = params;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(username && { username }),
      ...(estatus && { estatus }),
    });

    const response = await apiCall<User[]>(`/users?${searchParams}`);
    return response;
  },

  createUser: async (userData: CreateUserData) => {
    const response = await apiCall<{ user: User }>("/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return response;
  },

  updateUser: async (userId: string, userData: UpdateUserData) => {
    const response = await apiCall<User>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return response;
  },

  activateUser: async (userId: string) => {
    const response = await apiCall<User>(`/users/${userId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  assignRole: async (userId: string, roleId: string) => {
    const response = await apiCall<User>(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: roleId }),
    });
    return response;
  },

  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const response = await apiCall(`/users/${userId}/password`, {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  },

  deleteUser: async (userId: string) => {
    const response = await apiCall<User>(`/users/${userId}`, {
      method: "DELETE",
    });
    return response;
  },
};

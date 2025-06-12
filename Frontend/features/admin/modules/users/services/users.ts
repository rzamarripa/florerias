import { env } from "@/config/env";

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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getTokenFromSessionStore = () => {
  if (typeof window === "undefined") return null;

  try {
    const persistedState = localStorage.getItem("user-session");
    if (!persistedState) return null;

    const parsed = JSON.parse(persistedState);
    return parsed?.state?.token || null;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getTokenFromSessionStore();

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: getAuthHeaders(),
    ...options,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error en la operación");
  return data;
};

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

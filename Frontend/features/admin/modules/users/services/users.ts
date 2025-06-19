import { apiCall } from "@/utils/api";
import {
  CreateUserData,
  CreateUserResponseData,
  Role,
  UpdateUserData,
  User,
  UserProvider,
} from "../types";

const createFormData = (
  userData: CreateUserData | UpdateUserData,
  image?: File | null
) => {
  const formData = new FormData();
  formData.append("userData", JSON.stringify(userData));
  if (image) {
    formData.append("image", image);
  }
  return formData;
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

  getAllRoles: async (
    params: { page?: number; limit?: number; name?: string } = {}
  ) => {
    const { page = 1, limit = 10, name } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(name && { name }),
    });
    return await apiCall<Role[]>(`/roles?${searchParams}`);
  },

  createUser: async (userData: CreateUserData, image?: File | null) => {
    if (image && image instanceof File) {
      const formData = createFormData(userData, image);
      const response = await apiCall<CreateUserResponseData>(
        "/users/register",
        {
          method: "POST",
          body: formData,
        }
      );
      return response;
    } else {
      const response = await apiCall<CreateUserResponseData>(
        "/users/register",
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );
      return response;
    }
  },

  updateUser: async (
    userId: string,
    userData: UpdateUserData,
    image?: File | null
  ) => {
    if (image && image instanceof File) {
      const formData = createFormData(userData, image);
      const response = await apiCall<CreateUserResponseData>(
        `/users/${userId}`,
        {
          method: "PUT",
          body: formData,
        }
      );
      return response;
    } else {
      const response = await apiCall<CreateUserResponseData>(
        `/users/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(userData),
        }
      );
      return response;
    }
  },

  activateUser: async (userId: string) => {
    const response = await apiCall<CreateUserResponseData>(
      `/users/${userId}/activate`,
      {
        method: "PUT",
      }
    );
    return response;
  },

  assignRole: async (userId: string, roleId: string) => {
    const response = await apiCall<CreateUserResponseData>(
      `/users/${userId}/assign-role`,
      {
        method: "PUT",
        body: JSON.stringify({ role: roleId }),
      }
    );
    return response;
  },

  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const response = await apiCall<void>(`/users/${userId}/change-password`, {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  },

  deleteUser: async (userId: string) => {
    const response = await apiCall<CreateUserResponseData>(`/users/${userId}`, {
      method: "DELETE",
    });
    return response;
  },

  getUserProviders: async (
    userId: string,
    params: { page?: number; limit?: number } = {}
  ) => {
    try {
      const { page = 1, limit = 10 } = params;
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await apiCall<UserProvider[]>(
        `/users/${userId}/providers?${searchParams}`
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },

  assignProviders: async (userId: string, providerIds: string[]) => {
    try {
      const response = await apiCall<UserProvider[]>(
        `/users/${userId}/providers`,
        {
          method: "PUT",
          body: JSON.stringify({ providerIds }),
        }
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },

  removeProvider: async (userId: string, providerId: string) => {
    try {
      const response = await apiCall<void>(
        `/users/${userId}/providers/${providerId}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
};

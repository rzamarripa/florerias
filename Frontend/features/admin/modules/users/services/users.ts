import { apiCall } from "@/utils/api";
import {
  CreateUserData,
  CreateUserResponseData,
  Role,
  UpdateUserData,
  User,
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
      return response.data!;
    } else {
      const response = await apiCall<CreateUserResponseData>(
        "/users/register",
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );
      return response.data!;
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
      return response.data!;
    } else {
      const response = await apiCall<CreateUserResponseData>(
        `/users/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(userData),
        }
      );
      return response.data!;
    }
  },

  activateUser: async (userId: string) => {
    const response = await apiCall<CreateUserResponseData>(
      `/users/${userId}/activate`,
      {
        method: "PUT",
      }
    );
    return response.data!;
  },

  assignRole: async (userId: string, roleId: string) => {
    const response = await apiCall<CreateUserResponseData>(
      `/users/${userId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role: roleId }),
      }
    );
    return response.data!;
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
    const response = await apiCall<CreateUserResponseData>(`/users/${userId}`, {
      method: "DELETE",
    });
    return response.data!;
  },
};

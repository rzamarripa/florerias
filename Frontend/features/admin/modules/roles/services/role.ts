import { env } from "@/config/env";

export interface Role {
  _id: string;
  name: string;
  description?: string;
  estatus: boolean;
  createdAt: string;
  modules?: Array<{
    _id: string;
    name: string;
    page: {
      _id: string;
      name: string;
      path: string;
    };
  }>;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  modules?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  modules?: string[];
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

const getTokenFromSessionStore = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const persisted = localStorage.getItem("user-session");
    if (!persisted) return null;
    const parsed = JSON.parse(persisted);
    return parsed?.state?.token || null;
  } catch {
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
  if (!response.ok) throw new Error(data.message || "API error");
  return data;
};

export const rolesService = {
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

  createRole: async (roleData: CreateRoleData) => {
    return await apiCall<{ role: Role }>("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  },

  getRoleById: async (roleId: string) => {
    return await apiCall<Role>(`/roles/${roleId}`);
  },

  getRoleModules: async (roleId: string) => {
    return await apiCall<{ roleId: string; roleName: string; modulesByPage: any[] }>(
      `/roles/${roleId}/modules`
    );
  },

  updateRole: async (roleId: string, roleData: UpdateRoleData) => {
    return await apiCall<Role>(`/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  },

  deleteRole: async (roleId: string) => {
    return await apiCall<Role>(`/roles/${roleId}`, {
      method: "DELETE",
    });
  },
};

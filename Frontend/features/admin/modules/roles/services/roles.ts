import { apiCall } from "@/utils/api";
import { Page, Role } from "../types";

export const rolesService = {
  getAllRoles: async () => {
    const response = await apiCall<Role[]>("/roles");
    return response;
  },

  getPages: async () => {
    const response = await apiCall<Page[]>(`/pages`);
    return response;
  },

  updateRoleModules: async (roleId: string, moduleIds: string[]) => {
    const response = await apiCall(`/roles/${roleId}/modules`, {
      method: "PUT",
      body: JSON.stringify({ modules: moduleIds }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  },

  createRole: async (roleData: {
    name: string;
    description: string;
    modules: string[];
  }) => {
    const response = await apiCall("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  },

  deleteRole: async (roleId: string) => {
    const response = await apiCall(`/roles/${roleId}`, {
      method: "DELETE",
    });
    return response;
  },
};

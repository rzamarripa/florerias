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

  createRole: async (roleData: { name: string; modules: string[] }) => {
    const response = await apiCall<Role[]>("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
    return response;
  },

  updateRole: async (roleId: string, modules: string[]) => {
    const response = await apiCall<Role>(`/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify({ modules }),
    });
    return response;
  },
};

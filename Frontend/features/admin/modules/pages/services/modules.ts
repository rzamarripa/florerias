import { apiCall } from "@/utils/api";

export interface Module {
  _id: string;
  name: string;
  description?: string;
  page: {
    _id: string;
    name: string;
    description?: string;
    path: string;
    status: boolean;
  };
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleData {
  name: string;
  description?: string;
  page: string;
}

export interface UpdateModuleData {
  name?: string;
  description?: string;
  page?: string;
}

export const modulesService = {
  getAllModules: async (
    params: {
      page?: number;
      limit?: number;
      name?: string;
      pageId?: string;
      status?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, name, pageId, status } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(name && { name }),
      ...(pageId && { pageId }),
      ...(status && { status }),
    });
    const response = await apiCall<Module[]>(`/modules?${searchParams}`);
    return response;
  },

  getModuleById: async (moduleId: string) => {
    const response = await apiCall<Module>(`/modules/${moduleId}`);
    return response;
  },

  getModulesByPage: async (
    pageId: string,
    params: {
      page?: number;
      limit?: number;
      name?: string;
      status?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, name, status } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(name && { name }),
      ...(status && { status }),
    });
    const response = await apiCall<Module[]>(
      `/modules/page/${pageId}?${searchParams}`
    );
    return response;
  },

  createModule: async (moduleData: CreateModuleData) => {
    const response = await apiCall<Module>("/modules", {
      method: "POST",
      body: JSON.stringify(moduleData),
    });
    return response;
  },

  updateModule: async (moduleId: string, moduleData: UpdateModuleData) => {
    const response = await apiCall<Module>(`/modules/${moduleId}`, {
      method: "PUT",
      body: JSON.stringify(moduleData),
    });
    return response;
  },

  deleteModule: async (moduleId: string) => {
    const response = await apiCall<Module>(`/modules/${moduleId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateModule: async (moduleId: string) => {
    const response = await apiCall<Module>(`/modules/${moduleId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deleteModulePermanently: async (moduleId: string) => {
    const response = await apiCall(`/modules/${moduleId}/permanent`, {
      method: "DELETE",
    });
    return response;
  },
};

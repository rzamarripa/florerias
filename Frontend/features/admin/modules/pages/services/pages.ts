import { apiCall } from "@/utils/api";

export interface Page {
  _id: string;
  name: string;
  description?: string;
  path: string;
  modules: Array<{
    _id: string;
    name: string;
    description: string;
    status: boolean;
  }>;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageData {
  name: string;
  description?: string;
  path: string;
  modules?: Array<{
    moduleId: string;
    nombre?: string;
    description?: string;
  }>;
}

export interface UpdatePageData {
  name?: string;
  description?: string;
  path?: string;
  modules?: Array<{
    moduleId: string;
    nombre?: string;
    description?: string;
  }>;
}

export interface ModuleToPageData {
  moduleId: string;
  nombre?: string;
  description?: string;
}

export const pagesService = {
  getAllPages: async (
    params: {
      page?: number;
      limit?: number;
      name?: string;
      path?: string;
      status?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, name, path, status } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(name && { name }),
      ...(path && { path }),
      ...(status && { status }),
    });
    const response = await apiCall<Page[]>(`/pages?${searchParams}`);
    return response;
  },

  getPageById: async (pageId: string) => {
    const response = await apiCall<Page>(`/pages/${pageId}`);
    return response;
  },

  createPage: async (pageData: CreatePageData) => {
    const response = await apiCall<Page>("/pages", {
      method: "POST",
      body: JSON.stringify(pageData),
    });
    return response;
  },

  updatePage: async (pageId: string, pageData: UpdatePageData) => {
    const response = await apiCall<Page>(`/pages/${pageId}`, {
      method: "PUT",
      body: JSON.stringify(pageData),
    });
    return response;
  },

  deletePage: async (pageId: string) => {
    const response = await apiCall<Page>(`/pages/${pageId}`, {
      method: "DELETE",
    });
    return response;
  },

  activatePage: async (pageId: string) => {
    const response = await apiCall<Page>(`/pages/${pageId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  addModuleToPage: async (pageId: string, moduleData: ModuleToPageData) => {
    const response = await apiCall<Page>(`/pages/${pageId}/modules`, {
      method: "POST",
      body: JSON.stringify(moduleData),
    });
    return response;
  },

  removeModuleFromPage: async (pageId: string, moduleId: string) => {
    console.log("llamando al delete odule from page");
    console.log(pageId, moduleId);
    const response = await apiCall<Page>(
      `/pages/${pageId}/modules/${moduleId}`,
      {
        method: "DELETE",
      }
    );
    return response;
  },
};

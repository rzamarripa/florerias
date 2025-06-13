import { env } from "@/config/env";

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
    console.log('llamando al delete odule from page')
    console.log(pageId, moduleId)
    const response = await apiCall<Page>(`/pages/${pageId}/modules/${moduleId}`, {
      method: "DELETE",
    });
    return response;
  },
};
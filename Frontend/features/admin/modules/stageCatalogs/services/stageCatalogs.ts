import { apiCall } from "@/utils/api";
import { StageCatalog, CreateStageCatalogData, UpdateStageCatalogData } from "../types";

export interface StageCatalogFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  company?: string;
}

export interface GetStageCatalogsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: StageCatalog[];
}

export const stageCatalogsService = {
  getAllStageCatalogs: async (filters: StageCatalogFilters = {}): Promise<GetStageCatalogsResponse> => {
    const { page = 1, limit = 10, search, isActive, company } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());
    if (company) searchParams.append('company', company);

    const response = await apiCall<GetStageCatalogsResponse>(`/stage-catalogs?${searchParams}`);
    return response;
  },

  getStageCatalogById: async (stageId: string): Promise<{ success: boolean; data: StageCatalog }> => {
    const response = await apiCall<{ success: boolean; data: StageCatalog }>(`/stage-catalogs/${stageId}`);
    return response;
  },

  createStageCatalog: async (stageData: CreateStageCatalogData): Promise<{ success: boolean; data: StageCatalog; message: string }> => {
    const response = await apiCall<StageCatalog>("/stage-catalogs", {
      method: "POST",
      body: JSON.stringify(stageData),
    });

    // Si la respuesta no fue exitosa, lanzar error
    if (!response.success) {
      throw new Error(response.message || "Error al crear la etapa");
    }

    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  },

  updateStageCatalog: async (
    stageId: string,
    stageData: UpdateStageCatalogData
  ): Promise<{ success: boolean; data: StageCatalog; message: string }> => {
    const response = await apiCall<StageCatalog>(`/stage-catalogs/${stageId}`, {
      method: "PUT",
      body: JSON.stringify(stageData),
    });

    // Si la respuesta no fue exitosa, lanzar error
    if (!response.success) {
      throw new Error(response.message || "Error al actualizar la etapa");
    }

    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  },

  activateStageCatalog: async (stageId: string): Promise<{ success: boolean; data: StageCatalog; message: string }> => {
    const response = await apiCall<StageCatalog>(`/stage-catalogs/${stageId}/activate`, {
      method: "PUT",
    });

    // Si la respuesta no fue exitosa, lanzar error
    if (!response.success) {
      throw new Error(response.message || "Error al activar la etapa");
    }

    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  },

  deactivateStageCatalog: async (stageId: string): Promise<{ success: boolean; data: StageCatalog; message: string }> => {
    const response = await apiCall<StageCatalog>(`/stage-catalogs/${stageId}/deactivate`, {
      method: "PUT",
    });

    // Si la respuesta no fue exitosa, lanzar error
    if (!response.success) {
      throw new Error(response.message || "Error al desactivar la etapa");
    }

    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  },

  deleteStageCatalog: async (stageId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/stage-catalogs/${stageId}`, {
      method: "DELETE",
    });
    return response;
  },

  // Obtener etapas del usuario para el pizarrón de ventas
  getUserStages: async (boardType?: 'Produccion' | 'Envio'): Promise<{ success: boolean; count: number; data: StageCatalog[] }> => {
    const searchParams = new URLSearchParams();
    if (boardType) searchParams.append('boardType', boardType);

    const url = `/stage-catalogs/user/stages${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await apiCall<{ success: boolean; count: number; data: StageCatalog[] }>(url);
    return response;
  },
};

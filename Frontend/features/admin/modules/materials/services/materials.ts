import { apiCall } from "@/utils/api";
import {
  Material,
  MaterialFilters,
  CreateMaterialData,
  GetMaterialsResponse,
  UpdateMaterialData,
} from "../types";

export const materialsService = {
  getAllMaterials: async (filters: MaterialFilters = {}): Promise<GetMaterialsResponse> => {
    const { page = 1, limit = 10, name, unitId, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (name) searchParams.append('name', name);
    if (unitId) searchParams.append('unitId', unitId);
    if (status !== undefined) searchParams.append('status', status.toString());

    const response = await apiCall<GetMaterialsResponse>(`/materials?${searchParams}`);
    return response;
  },

  getMaterialById: async (materialId: string): Promise<{ success: boolean; data: Material }> => {
    const response = await apiCall<{ success: boolean; data: Material }>(`/materials/${materialId}`);
    return response;
  },

  createMaterial: async (materialData: CreateMaterialData): Promise<{ success: boolean; data: Material; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Material; message: string }>("/materials", {
      method: "POST",
      body: JSON.stringify(materialData),
    });
    return response;
  },

  updateMaterial: async (
    materialId: string,
    materialData: UpdateMaterialData
  ): Promise<{ success: boolean; data: Material; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Material; message: string }>(`/materials/${materialId}`, {
      method: "PUT",
      body: JSON.stringify(materialData),
    });
    return response;
  },

  updateMaterialStatus: async (
    materialId: string,
    status: boolean
  ): Promise<{ success: boolean; data: Material; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Material; message: string }>(`/materials/${materialId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response;
  },

  deleteMaterial: async (materialId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/materials/${materialId}`, {
      method: "DELETE",
    });
    return response;
  },
};

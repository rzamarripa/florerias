import { apiCall } from "@/utils/api";
import {
  Unit,
  UnitFilters,
  CreateUnitData,
  GetUnitsResponse,
  UpdateUnitData,
} from "../types";

export const unitsService = {
  getAllUnits: async (filters: UnitFilters = {}): Promise<GetUnitsResponse> => {
    const { page = 1, limit = 1000, name, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (name) searchParams.append('name', name);
    if (status !== undefined) searchParams.append('status', status.toString());

    const response = await apiCall<GetUnitsResponse>(`/units?${searchParams}`);
    return response;
  },

  getUnitById: async (unitId: string): Promise<{ success: boolean; data: Unit }> => {
    const response = await apiCall<{ success: boolean; data: Unit }>(`/units/${unitId}`);
    return response;
  },

  createUnit: async (unitData: CreateUnitData): Promise<{ success: boolean; data: Unit; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Unit; message: string }>("/units", {
      method: "POST",
      body: JSON.stringify(unitData),
    });
    return response;
  },

  updateUnit: async (
    unitId: string,
    unitData: UpdateUnitData
  ): Promise<{ success: boolean; data: Unit; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Unit; message: string }>(`/units/${unitId}`, {
      method: "PUT",
      body: JSON.stringify(unitData),
    });
    return response;
  },

  updateUnitStatus: async (
    unitId: string,
    status: boolean
  ): Promise<{ success: boolean; data: Unit; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Unit; message: string }>(`/units/${unitId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response;
  },

  deleteUnit: async (unitId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/units/${unitId}`, {
      method: "DELETE",
    });
    return response;
  },
};

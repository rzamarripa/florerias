import { apiCall } from "@/utils/api";
import {
  Manager,
  ManagerFilters,
  CreateManagerData,
  CreateManagerResponseData,
  GetManagerResponse,
  UpdateManagerData,
} from "../types";

export const managersService = {
  getAllManagers: async (filters: ManagerFilters = {}): Promise<GetManagerResponse> => {
    const { page = 1, limit = 10, nombre, apellidoPaterno, usuario, correo, telefono, estatus, companyId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (nombre) searchParams.append('nombre', nombre);
    if (apellidoPaterno) searchParams.append('apellidoPaterno', apellidoPaterno);
    if (usuario) searchParams.append('usuario', usuario);
    if (correo) searchParams.append('correo', correo);
    if (telefono) searchParams.append('telefono', telefono);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());
    if (companyId) searchParams.append('companyId', companyId);

    const response = await apiCall<GetManagerResponse>(`/managers?${searchParams}`);
    return response;
  },

  getManagerById: async (managerId: string): Promise<{ success: boolean; data: Manager }> => {
    const response = await apiCall<{ success: boolean; data: Manager }>(`/managers/${managerId}`);
    return response;
  },

  createManager: async (managerData: CreateManagerData): Promise<CreateManagerResponseData> => {
    const response = await apiCall<CreateManagerResponseData>("/managers", {
      method: "POST",
      body: JSON.stringify(managerData),
    });
    return response;
  },

  updateManager: async (
    managerId: string,
    managerData: UpdateManagerData
  ): Promise<CreateManagerResponseData> => {
    const response = await apiCall<CreateManagerResponseData>(`/managers/${managerId}`, {
      method: "PUT",
      body: JSON.stringify(managerData),
    });
    return response;
  },

  deleteManager: async (managerId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/managers/${managerId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateManager: async (managerId: string): Promise<CreateManagerResponseData> => {
    const response = await apiCall<CreateManagerResponseData>(`/managers/${managerId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateManager: async (managerId: string): Promise<CreateManagerResponseData> => {
    const response = await apiCall<CreateManagerResponseData>(`/managers/${managerId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },
};
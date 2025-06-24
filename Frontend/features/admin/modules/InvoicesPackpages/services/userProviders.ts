import { apiCall } from "@/utils/api";
import { UserProvider, GetUserProvidersResponse } from "../types";

export const userProvidersService = {
  getUserProviders: async (
    userId: string,
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<GetUserProvidersResponse> => {
    const { page = 1, limit = 10 } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await apiCall<UserProvider[]>(`/users/${userId}/providers?${searchParams}`);
    return response;
  },

  getCurrentUserProviders: async (
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<GetUserProvidersResponse> => {
    // Importamos el store dinámicamente para evitar problemas de SSR
    const { useUserSessionStore } = await import("@/stores/userSessionStore");
    const userId = useUserSessionStore.getState().getUserId();
    
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }
    
    return userProvidersService.getUserProviders(userId, params);
  },
}; 
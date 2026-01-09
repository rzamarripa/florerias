import { apiCall } from "@/utils/api";
import type {
  EcommerceConfig,
  EcommerceConfigHeader,
  EcommerceConfigColors,
  EcommerceConfigTypography,
  EcommerceConfigFeaturedElements,
  ManagerConfigResponse
} from "../types";

class EcommerceConfigService {
  /**
   * Obtener configuración del gerente actual
   */
  async getManagerConfig(): Promise<ManagerConfigResponse> {
    return apiCall<ManagerConfigResponse>("/ecommerce-config/manager", "GET");
  }

  /**
   * Obtener configuración por sucursal
   */
  async getConfigByBranch(branchId: string): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>(`/ecommerce-config/branch/${branchId}`, "GET");
  }

  /**
   * Crear nueva configuración
   */
  async createConfig(data: Partial<EcommerceConfig>): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>("/ecommerce-config", "POST", data);
  }

  /**
   * Actualizar encabezado
   */
  async updateHeader(id: string, header: EcommerceConfigHeader): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/header`,
      "PATCH",
      { header }
    );
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(id: string, template: string): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/template`,
      "PATCH",
      { template }
    );
  }

  /**
   * Actualizar colores
   */
  async updateColors(id: string, colors: EcommerceConfigColors): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/colors`,
      "PATCH",
      { colors }
    );
  }

  /**
   * Actualizar tipografías
   */
  async updateTypography(id: string, typography: EcommerceConfigTypography): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/typography`,
      "PATCH",
      { typography }
    );
  }

  /**
   * Actualizar elementos destacados
   */
  async updateFeaturedElements(id: string, featuredElements: EcommerceConfigFeaturedElements): Promise<EcommerceConfig> {
    return apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/featured`,
      "PATCH",
      { featuredElements }
    );
  }
}

export const ecommerceConfigService = new EcommerceConfigService();
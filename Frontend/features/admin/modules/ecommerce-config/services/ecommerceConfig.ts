import { apiCall } from "@/utils/api";
import type {
  EcommerceConfig,
  EcommerceConfigHeader,
  EcommerceConfigColors,
  EcommerceConfigTypography,
  EcommerceConfigFeaturedElements,
  ManagerConfigResponse,
  StockItem
} from "../types";

class EcommerceConfigService {
  /**
   * Obtener configuración del gerente actual
   */
  async getManagerConfig(): Promise<ManagerConfigResponse> {
    const response = await apiCall<ManagerConfigResponse>("/ecommerce-config/manager");
    return response as any;
  }

  /**
   * Obtener configuración por sucursal
   */
  async getConfigByBranch(branchId: string): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(`/ecommerce-config/branch/${branchId}`);
    return response as any;
  }

  /**
   * Crear nueva configuración
   */
  async createConfig(data: Partial<EcommerceConfig>): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>("/ecommerce-config", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return response as any;
  }

  /**
   * Actualizar encabezado
   */
  async updateHeader(id: string, header: EcommerceConfigHeader): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/header`,
      {
        method: "PATCH",
        body: JSON.stringify({ header })
      }
    );
    return response as any;
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(id: string, template: string): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/template`,
      {
        method: "PATCH",
        body: JSON.stringify({ template })
      }
    );
    return response as any;
  }

  /**
   * Actualizar colores
   */
  async updateColors(id: string, colors: EcommerceConfigColors): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/colors`,
      {
        method: "PATCH",
        body: JSON.stringify({ colors })
      }
    );
    return response as any;
  }

  /**
   * Actualizar tipografías
   */
  async updateTypography(id: string, typography: EcommerceConfigTypography): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/typography`,
      {
        method: "PATCH",
        body: JSON.stringify({ typography })
      }
    );
    return response as any;
  }

  /**
   * Actualizar elementos destacados
   */
  async updateFeaturedElements(id: string, featuredElements: EcommerceConfigFeaturedElements): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/featured`,
      {
        method: "PATCH",
        body: JSON.stringify({ featuredElements })
      }
    );
    return response as any;
  }

  /**
   * Actualizar items de stock
   */
  async updateItemsStock(
    id: string, 
    itemsStock: StockItem[], 
    deductFromStorage: boolean = false,
    transferAll: boolean = false
  ): Promise<EcommerceConfig> {
    const response = await apiCall<EcommerceConfig>(
      `/ecommerce-config/${id}/items-stock`,
      {
        method: "PATCH",
        body: JSON.stringify({ itemsStock, deductFromStorage, transferAll })
      }
    );
    return response as any;
  }
}

export const ecommerceConfigService = new EcommerceConfigService();
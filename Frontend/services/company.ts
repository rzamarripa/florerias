import { apiCall } from "@/utils/api";

export interface UserCompany {
  _id: string;
  legalName: string;
  tradeName: string;
  rfc: string;
}

export const companyService = {
  /**
   * Obtiene la empresa del usuario autenticado
   * - Para Administrador: busca en Company.administrator o Branch.administrator
   * - Para Gerente: busca en Branch.manager y retorna su empresa
   */
  getUserCompany: async (): Promise<{ success: boolean; data: UserCompany }> => {
    const response = await apiCall<{ success: boolean; data: UserCompany }>('/companies/user-company', {
      method: 'GET',
    });
    return response;
  },
};

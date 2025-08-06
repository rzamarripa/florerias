import { apiCall, ApiResponse } from "@/utils/api";

export interface AuthorizationFolio {
  _id: string;
  paquete_id: string;
  motivo: string;
  usuario_id: string;
  fecha: string;
  estatus: 'pendiente' | 'autorizado' | 'rechazado';
  fechaFolioAutorizacion: string;
  folio: string;
  createdAt: string;
  updatedAt: string;
  // Información adicional del usuario que solicitó el folio
  usuario?: {
    _id: string;
    profile: {
      fullName: string;
    };
  };
  // Información adicional del paquete
  paquete?: {
    _id: string;
    folio: number;
    departamento: string;
    comentario?: string;
  };
}

export interface AuthorizationFoliosResponse {
  success: boolean;
  data: AuthorizationFolio[];
  message?: string;
}

export interface AuthorizationFolioResponse {
  success: boolean;
  data: AuthorizationFolio;
  message?: string;
}

// Obtener todos los folios de autorización pendientes
export const getPendingAuthorizationFolios = async (): Promise<ApiResponse<AuthorizationFoliosResponse>> => {
  try {
    const response = await apiCall<AuthorizationFoliosResponse>('/authorization-folios/pending');
    return response;
  } catch (error) {
    console.error('Error al obtener folios pendientes:', error);
    throw error;
  }
};

// Autorizar un folio
export const authorizeFolio = async (folioId: string): Promise<ApiResponse<AuthorizationFolioResponse>> => {
  try {
    const response = await apiCall<AuthorizationFolioResponse>(`/authorization-folios/${folioId}/authorize`, {
      method: 'PUT'
    });
    return response;
  } catch (error) {
    console.error('Error al autorizar folio:', error);
    throw error;
  }
};

// Rechazar un folio
export const rejectFolio = async (folioId: string): Promise<ApiResponse<AuthorizationFolioResponse>> => {
  try {
    const response = await apiCall<AuthorizationFolioResponse>(`/authorization-folios/${folioId}/reject`, {
      method: 'PUT'
    });
    return response;
  } catch (error) {
    console.error('Error al rechazar folio:', error);
    throw error;
  }
};

// Obtener folios por usuario (para mostrar información del solicitante)
export const getAuthorizationFoliosWithUserInfo = async (): Promise<ApiResponse<AuthorizationFoliosResponse>> => {
  try {
    const response = await apiCall<AuthorizationFoliosResponse>('/authorization-folios/pending-with-user-info', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('📡 Respuesta del servidor:', response);
    return response;
  } catch (error) {
    console.error('Error al obtener folios con información de usuario:', error);
    return { success: false, data: { success: false, data: [], message: 'Error al obtener folios' }, message: 'Error al obtener folios' };
  }
}; 
import { apiCall } from "@/utils/api";
import {
  GetFacturasResponse,
  GetMovimientosResponse,
  ConciliacionAutomaticaRequest,
  ConciliacionAutomaticaResponse,
  ConciliacionManualRequest,
  CerrarConciliacionRequest,
  CerrarConciliacionResponse,
} from "../types";

export const conciliacionService = {
  getFacturasParaConciliacion: async (
    companyId: string,
    bankAccountId: string,
    fecha: string
  ): Promise<GetFacturasResponse> => {
    const response = await apiCall<GetFacturasResponse["data"]>(
      `/conciliacion/facturas?companyId=${companyId}&bankAccountId=${bankAccountId}&fecha=${fecha}`
    );
    return response;
  },

  getMovimientosParaConciliacion: async (
    companyId: string,
    bankAccountId: string,
    fecha: string
  ): Promise<GetMovimientosResponse> => {
    const response = await apiCall<GetMovimientosResponse["data"]>(
      `/conciliacion/movimientos?companyId=${companyId}&bankAccountId=${bankAccountId}&fecha=${fecha}`
    );
    return response;
  },

  conciliacionAutomatica: async (
    data: ConciliacionAutomaticaRequest
  ): Promise<{ success: boolean; data: ConciliacionAutomaticaResponse; message: string }> => {
    const response = await apiCall<ConciliacionAutomaticaResponse>(
      "/conciliacion/automatica",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response;
  },

  conciliacionManual: async (
    data: ConciliacionManualRequest
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await apiCall<any>("/conciliacion/manual", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },

  cerrarConciliacion: async (
    data: CerrarConciliacionRequest
  ): Promise<CerrarConciliacionResponse> => {
    const response = await apiCall<CerrarConciliacionResponse["data"]>(
      "/conciliacion/cerrar",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response;
  },
}; 
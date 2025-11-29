import { apiCall } from "@/utils/api";

export interface DiscountAuth {
  _id: string;
  message: string;
  managerId: {
    _id: string;
    username: string;
    email: string;
    profile?: {
      fullName: string;
    };
  };
  requestedBy: {
    _id: string;
    username: string;
    email: string;
    profile?: {
      fullName: string;
    };
  };
  branchId: {
    _id: string;
    branchName: string;
    branchCode: string;
  };
  orderId?: {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
  } | null;
  orderTotal: number;
  discountValue: number;
  discountType: 'porcentaje' | 'cantidad';
  discountAmount: number;
  isAuth: boolean | null;
  authFolio: string | null;
  isRedeemed: boolean;
  createdAt: string;
  approvedAt: string | null;
}

export interface RequestDiscountAuthData {
  message: string;
  branchId: string;
  discountValue: number;
  discountType: 'porcentaje' | 'cantidad';
}

export interface RedeemFolioData {
  authFolio: string;
  branchId: string;
}

export interface CreateDiscountAuthForOrderData {
  message: string;
  branchId: string;
  orderId: string;
  orderTotal: number;
  discountValue: number;
  discountType: 'porcentaje' | 'cantidad';
  discountAmount: number;
}

export interface ApproveRejectDiscountAuthData {
  isApproved: boolean;
}

export interface DiscountAuthFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  isAuth?: 'null' | 'true' | 'false';
  managerId?: string;
  requestedBy?: string;
}

export interface GetDiscountAuthsResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: DiscountAuth[];
}

export const discountAuthService = {
  requestDiscountAuth: async (data: RequestDiscountAuthData): Promise<{ success: boolean; data: DiscountAuth; message: string }> => {
    const response = await apiCall<{ success: boolean; data: DiscountAuth; message: string }>("/discount-auth/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response as any;
  },

  approveRejectDiscountAuth: async (
    discountAuthId: string,
    data: ApproveRejectDiscountAuthData
  ): Promise<{ success: boolean; data: DiscountAuth; message: string }> => {
    const response = await apiCall<{ success: boolean; data: DiscountAuth; message: string }>(
      `/discount-auth/${discountAuthId}/approve-reject`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  getAllDiscountAuths: async (filters: DiscountAuthFilters = {}): Promise<GetDiscountAuthsResponse> => {
    const { page = 1, limit = 10, branchId, isAuth, managerId, requestedBy } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (branchId) searchParams.append('branchId', branchId);
    if (isAuth !== undefined) searchParams.append('isAuth', isAuth);
    if (managerId) searchParams.append('managerId', managerId);
    if (requestedBy) searchParams.append('requestedBy', requestedBy);

    const response = await apiCall<GetDiscountAuthsResponse>(`/discount-auth?${searchParams}`);
    return response as any;
  },

  getDiscountAuthById: async (discountAuthId: string): Promise<{ success: boolean; data: DiscountAuth }> => {
    const response = await apiCall<{ success: boolean; data: DiscountAuth }>(`/discount-auth/${discountAuthId}`);
    return response as any;
  },

  redeemFolio: async (data: RedeemFolioData): Promise<{ success: boolean; data: { discountValue: number; discountType: string; authFolio: string }; message: string }> => {
    const response = await apiCall<{ success: boolean; data: { discountValue: number; discountType: string; authFolio: string }; message: string }>(
      "/discount-auth/redeem",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  createDiscountAuthForOrder: async (data: CreateDiscountAuthForOrderData): Promise<{ success: boolean; data: DiscountAuth; message: string }> => {
    const response = await apiCall<{ success: boolean; data: DiscountAuth; message: string }>(
      "/discount-auth/create-for-order",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  redeemAuthorizationForOrder: async (orderId: string, authFolio: string): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await apiCall<{ success: boolean; data: any; message: string }>(
      "/discount-auth/redeem-for-order",
      {
        method: "POST",
        body: JSON.stringify({ orderId, authFolio }),
      }
    );
    return response as any;
  },
};

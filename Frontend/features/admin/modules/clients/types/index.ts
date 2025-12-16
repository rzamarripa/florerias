export interface ClientComment {
  _id?: string;
  comentario: string;
  tipo: 'positive' | 'negative';
  usuario: string;
  fechaCreacion: string;
}

export interface Client {
  _id: string;
  name: string;
  lastName: string;
  fullName: string;
  clientNumber: string;
  phoneNumber: string;
  email: string;
  points: number;
  status: boolean;
  branch: string;
  purchases: string[];
  comentarios: ClientComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  points?: number;
  status?: boolean;
  branch: string;
}

export interface UpdateClientData {
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  points?: number;
  status?: boolean;
}

export interface CreateClientResponseData {
  client: Client;
}

export interface GetClientsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Client[];
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  name?: string;
  lastName?: string;
  clientNumber?: string;
  phoneNumber?: string;
  status?: boolean;
  branchId?: string;
}

export type FilterType = 'name' | 'lastName' | 'clientNumber' | 'phoneNumber';

export interface FilterOption {
  value: FilterType;
  label: string;
}

export interface AddCommentData {
  comentario: string;
  tipo: 'positive' | 'negative';
  usuario: string;
}

export interface AddCommentResponse {
  success: boolean;
  message: string;
  data: {
    client: Client;
  };
}

// Client Points History types
export type PointsHistoryType = 'earned' | 'redeemed';

export type PointsHistoryReason =
  | 'purchase_amount'
  | 'accumulated_purchases'
  | 'first_purchase'
  | 'client_registration'
  | 'branch_visit'
  | 'redemption'
  | 'manual_adjustment'
  | 'expiration';

export interface ClientPointsHistory {
  _id: string;
  clientId: string;
  orderId: {
    _id: string;
    orderNumber: string;
    total: number;
  } | null;
  points: number;
  type: PointsHistoryType;
  reason: PointsHistoryReason;
  description: string;
  branchId: {
    _id: string;
    branchName: string;
  } | null;
  balanceBefore: number;
  balanceAfter: number;
  registeredBy: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetClientPointsHistoryResponse {
  success: boolean;
  data: ClientPointsHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  clientPoints: number;
}

export interface ClientPointsHistoryFilters {
  page?: number;
  limit?: number;
  type?: PointsHistoryType;
  branchId?: string;
}

// Reward Redemption types
export interface RedeemRewardData {
  rewardId: string;
  branchId: string;
}

export interface RedeemRewardResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    reward: {
      _id: string;
      name: string;
      rewardValue: number;
      isPercentage: boolean;
      pointsRequired: number;
    };
    newBalance: number;
  };
}

// Verify Reward Code types
export interface VerifyRewardCodeData {
  code: string;
}

export interface VerifyRewardCodeResponse {
  success: boolean;
  message: string;
  data: {
    rewardEntryId: string;
    code: string;
    reward: {
      _id: string;
      name: string;
      rewardValue: number;
      isPercentage: boolean;
      pointsRequired: number;
    };
  };
}

export interface AppliedReward {
  rewardEntryId: string;
  code: string;
  rewardId: string;
  name: string;
  rewardValue: number;
  isPercentage: boolean;
}

// Available Reward types (rewards the client has redeemed but not used yet)
export interface AvailableRewardItem {
  _id: string;
  code: string;
  redeemedAt: string;
  reward: {
    _id: string;
    name: string;
    description: string;
    rewardValue: number;
    isPercentage: boolean;
    pointsRequired: number;
    validFrom: string | null;
    validUntil: string | null;
    rewardType: 'discount' | 'product' | 'service' | 'other';
    isProducto: boolean;
    productId: {
      _id: string;
      nombre: string;
      precio: number;
      imagen?: string;
      productCategory?: string;
    } | null;
    productQuantity: number;
  };
}

export interface GetAvailableRewardsResponse {
  success: boolean;
  count: number;
  data: AvailableRewardItem[];
}
export interface PointsPerPurchaseAmount {
  enabled: boolean;
  amount: number;
  points: number;
}

export interface PointsPerAccumulatedPurchases {
  enabled: boolean;
  purchasesRequired: number;
  points: number;
}

export interface PointsForFirstPurchase {
  enabled: boolean;
  points: number;
}

export interface PointsForClientRegistration {
  enabled: boolean;
  points: number;
}

export interface PointsForBranchVisit {
  enabled: boolean;
  points: number;
  maxVisitsPerDay: number;
}

export interface BranchInfo {
  _id: string;
  name: string;
  address?: string;
}

export interface PointsConfig {
  _id: string;
  pointsPerPurchaseAmount: PointsPerPurchaseAmount;
  pointsPerAccumulatedPurchases: PointsPerAccumulatedPurchases;
  pointsForFirstPurchase: PointsForFirstPurchase;
  pointsForClientRegistration: PointsForClientRegistration;
  pointsForBranchVisit: PointsForBranchVisit;
  branch: BranchInfo | string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePointsConfigData {
  pointsPerPurchaseAmount?: PointsPerPurchaseAmount;
  pointsPerAccumulatedPurchases?: PointsPerAccumulatedPurchases;
  pointsForFirstPurchase?: PointsForFirstPurchase;
  pointsForClientRegistration?: PointsForClientRegistration;
  pointsForBranchVisit?: PointsForBranchVisit;
  branch: string;
  status?: boolean;
}

export interface UpdatePointsConfigData {
  pointsPerPurchaseAmount?: PointsPerPurchaseAmount;
  pointsPerAccumulatedPurchases?: PointsPerAccumulatedPurchases;
  pointsForFirstPurchase?: PointsForFirstPurchase;
  pointsForClientRegistration?: PointsForClientRegistration;
  pointsForBranchVisit?: PointsForBranchVisit;
  status?: boolean;
}

export interface GetPointsConfigsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: PointsConfig[];
}

export interface PointsConfigFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  status?: boolean;
}

export interface PointsConfigResponse {
  success: boolean;
  message?: string;
  data: PointsConfig;
}

// PointsReward types
export type RewardType = "discount" | "product" | "service" | "other";

export interface ProductInfo {
  _id: string;
  nombre: string;
  imagen?: string;
  totalVenta?: number;
  descripcion?: string;
}

export interface PointsReward {
  _id: string;
  name: string;
  description: string;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;
  isProducto: boolean;
  productId: ProductInfo | string | null;
  productQuantity: number;
  isPercentage: boolean;
  maxRedemptionsPerClient: number;
  totalRedemptions: number;
  maxTotalRedemptions: number;
  validFrom: string | null;
  validUntil: string | null;
  branch: BranchInfo | string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePointsRewardData {
  name: string;
  description?: string;
  pointsRequired: number;
  rewardType?: RewardType;
  rewardValue?: number;
  isProducto?: boolean;
  productId?: string | null;
  productQuantity?: number;
  isPercentage?: boolean;
  maxRedemptionsPerClient?: number;
  maxTotalRedemptions?: number;
  validFrom?: string | null;
  validUntil?: string | null;
  branch: string;
  status?: boolean;
}

export interface UpdatePointsRewardData {
  name?: string;
  description?: string;
  pointsRequired?: number;
  rewardType?: RewardType;
  rewardValue?: number;
  isProducto?: boolean;
  productId?: string | null;
  productQuantity?: number;
  isPercentage?: boolean;
  maxRedemptionsPerClient?: number;
  maxTotalRedemptions?: number;
  validFrom?: string | null;
  validUntil?: string | null;
  status?: boolean;
}

export interface GetPointsRewardsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: PointsReward[];
}

export interface PointsRewardFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  status?: boolean;
  rewardType?: RewardType;
}

export interface PointsRewardResponse {
  success: boolean;
  message?: string;
  data: PointsReward;
}

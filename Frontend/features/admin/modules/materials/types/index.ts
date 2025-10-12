import { Unit } from "../../units/types";

export interface Material {
  _id: string;
  name: string;
  unit: Unit;
  price: number;
  cost: number;
  piecesPerPackage: number;
  description: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialData {
  name: string;
  unit: string; // ObjectId as string
  price: number;
  cost: number;
  piecesPerPackage: number;
  description?: string;
  status?: boolean;
}

export interface UpdateMaterialData {
  name?: string;
  unit?: string;
  price?: number;
  cost?: number;
  piecesPerPackage?: number;
  description?: string;
  status?: boolean;
}

export interface GetMaterialsResponse {
  success: boolean;
  data: Material[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MaterialFilters {
  page?: number;
  limit?: number;
  status?: boolean;
  name?: string;
  unitId?: string;
}

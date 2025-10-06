export interface Unit {
  _id: string;
  name: string;
  abbreviation: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitData {
  name: string;
  abbreviation: string;
  status?: boolean;
}

export interface UpdateUnitData {
  name?: string;
  abbreviation?: string;
  status?: boolean;
}

export interface GetUnitsResponse {
  success: boolean;
  data: Unit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UnitFilters {
  page?: number;
  limit?: number;
  status?: boolean;
  name?: string;
}

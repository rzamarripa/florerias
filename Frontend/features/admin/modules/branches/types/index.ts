export interface Branch {
  _id: string;
  companyId: { _id: string; name: string } | string;
  name: string;
  countryId: { _id: string; name: string } | string;
  stateId: { _id: string; name: string } | string;
  municipalityId: { _id: string; name: string } | string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  brands?: { _id: string; name: string }[]; // Marcas asociadas a la sucursal
}

export type CreateBranchRequest = Omit<
  Branch,
  | "_id"
  | "createdAt"
  | "updatedAt"
  | "isActive"
  | "companyId"
  | "countryId"
  | "stateId"
  | "municipalityId"
> & {
  companyId: string;
  countryId: string;
  stateId: string;
  municipalityId: string;
  rsBrands?: string[]; // Array de brandIds para la relación muchos a muchos
};

export type UpdateBranchRequest = Partial<CreateBranchRequest> & {
  _id: string;
};

export interface GetSucursalesParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: string;
  companyId?: string;
  ciudad?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

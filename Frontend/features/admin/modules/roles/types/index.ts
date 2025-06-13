export interface Role {
  estatus: boolean;
  _id: string;
  name: string;
  description: string;
  modules: Module[];
  createdAt: string;
}

export interface Module {
  _id: string;
  name: string;
  description: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Page {
  _id: string;
  name: string;
  description: string;
  path: string;
  modules: Module[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface RoleInfo {
  _id: string;
  name: string;
  description: string;
}

export interface ModulesByRoleData {
  role: RoleInfo;
  pages: Page[];
  totalPages: number;
  totalModules: number;
  includeInactive?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SelectedModules {
  [key: string]: boolean;
}

export interface FormData {
  name: string;
  description: string;
  path: string;
  modules: string[];
}

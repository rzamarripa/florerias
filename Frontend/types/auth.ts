export interface User {
  _id: string;
  username: string;
  profile: {
    estatus: boolean;
    nombre: string;
    nombreCompleto: string;
    path: string;
  };
  role?: Role;
  createdAt: string;
  [key: string]: any;
}

export interface ModuleInfo {
  name: string;
  _id: string;
}

export interface PageModules {
  page: string;
  pageId: string;
  path: string;
  modules: ModuleInfo[];
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  modules: ModuleInfo[];
  createdAt: string;
  [key: string]: any;
}

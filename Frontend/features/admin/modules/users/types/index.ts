export interface User {
  _id: string;
  username: string;
  department?: string;
  profile: {
    nombre: string;
    nombreCompleto: string;
    path: string;
    estatus: boolean;
    image?: string;
  };
  role?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  department?: string;
  profile: {
    nombre: string;
    nombreCompleto: string;
    estatus?: boolean;
  };
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  department?: string;
  profile?: Partial<{
    nombre: string;
    nombreCompleto: string;
    estatus: boolean;
  }>;
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  department?: string;
  profile?: Partial<{
    nombre: string;
    nombreCompleto: string;
    estatus: boolean;
  }>;
  role?: string;
}

export interface CreateUserResponseData {
  data: User;
}

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

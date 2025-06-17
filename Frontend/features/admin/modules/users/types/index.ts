

export interface Role {
  _id: string;
  name: string;
  description?: string;
  modules?: any[]; 
}

export interface UserProfile {
  name: string;      
  fullName: string;   
  path?: string;
  estatus: boolean;
  image?: string
}

export interface User {
  _id: string;
  username: string;
  profile: UserProfile;
  department?: string;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  department?: string;
  profile: {
    name: string;        
    fullName: string;    
    estatus: boolean;
  };
  role?: string;
}

export interface UpdateUserData {
  username: string;
  department?: string;
  profile: {
    name: string;        
    fullName: string;    
    estatus: boolean;
  };
  role?: string;
}

export interface CreateUserResponseData {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface GetUsersResponse {
  success: boolean;
  count: number
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: User[];
}

export interface GetRolesResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Role[];
}
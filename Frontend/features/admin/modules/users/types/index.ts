import type { Role } from "../../roles/types";
export type { Role } from "../../roles/types";

export interface UserProfile {
  name: string;
  fullName: string;
  path?: string;
  estatus: boolean;
  image?: {
    data: string;
    contentType: string;
  };
}

export interface User {
  _id: string;
  username: string;
  password?: string;
  department?: string;
  profile: UserProfile;
  role: Role | string;
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
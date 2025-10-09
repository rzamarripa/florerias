import type { Role } from "../../roles/types";
export type { Role } from "../../roles/types";

export interface UserProfile {
  name: string;
  lastName: string;
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
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
    path?: string;
    estatus: boolean;
    image?:
      | undefined
      | {
          data: string;
          contentType: string;
        };
  };
  role?: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
    path?: string;
    estatus?: boolean;
  };
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  phone?: string;
  profile?: {
    name: string;
    lastName: string;
    fullName: string;
    path?: string;
    estatus?: boolean;
  };
  role?: string;
}

export interface CreateUserResponseData {
  user: User;
}

export interface GetUsersResponse {
  success: boolean;
  count: number;
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

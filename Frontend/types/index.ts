import React from "react";

export type ChildrenType = Readonly<{ children: React.ReactNode }>;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

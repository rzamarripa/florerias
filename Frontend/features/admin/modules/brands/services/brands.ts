import { apiCall } from "@/utils/api";

export interface Brand {
  _id: string;
  logo?: string; // Base64 string after conversion
  category?: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  // For display purposes, we'll get company names from the relationships
  razonesSociales?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetBrandsResponse {
  success: boolean;
  data: Brand[];
  pagination: PaginationInfo;
}

export interface CreateBrandData {
  name: string;
  category?: string;
  description?: string;
  isActive?: boolean;
  rsCompanies?: string[]; // Array of company IDs
  logo?: File; // File object for logo upload
}

export interface UpdateBrandData {
  name?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
  rsCompanies?: string[]; // Array of company IDs
  logo?: File; // File object for logo upload
}

export const brandsService = {
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, search } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return await apiCall<GetBrandsResponse>(
      `/brands?${searchParams}`
    );
  },

  create: async (data: CreateBrandData) => {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append text fields
    formData.append('name', data.name);
    if (data.category) formData.append('category', data.category);
    if (data.description) formData.append('description', data.description);
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    
    // Handle rsCompanies array
    if (data.rsCompanies && data.rsCompanies.length > 0) {
      formData.append('rsCompanies', JSON.stringify(data.rsCompanies));
    }
    
    // Append logo file if provided
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    return await apiCall<{ success: boolean; data: Brand; message: string }>(
      "/brands",
      {
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it with boundary
      }
    );
  },

  update: async (id: string, data: UpdateBrandData) => {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append text fields only if they exist
    if (data.name) formData.append('name', data.name);
    if (data.category) formData.append('category', data.category);
    if (data.description) formData.append('description', data.description);
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    
    // Handle rsCompanies array
    if (data.rsCompanies !== undefined) {
      formData.append('rsCompanies', JSON.stringify(data.rsCompanies));
    }
    
    // Append logo file if provided
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    return await apiCall<{ success: boolean; data: Brand; message: string }>(
      `/brands/${id}`,
      {
        method: "PUT",
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it with boundary
      }
    );
  },

  activate: async (id: string) => {
    return await apiCall<{ success: boolean; message: string }>(
      `/brands/${id}/active`,
      {
        method: "PUT",
      }
    );
  },

  delete: async (id: string) => {
    return await apiCall<{ success: boolean; message: string }>(
      `/brands/${id}/delete`,
      {
        method: "DELETE",
      }
    );
  },
};

// Utility function to create a File object from base64 string if needed
export const base64ToFile = (base64String: string, filename: string): File => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};
import { apiCall } from "@/utils/api";
import { ImportStatusItem } from "../types";

export const getImportStatus = async () => {
  try {
    const response = await apiCall<ImportStatusItem[]>(
      "/dashboard/import-status"
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching import status:", error);
    return { success: false, data: [], message: error.message };
  }
};

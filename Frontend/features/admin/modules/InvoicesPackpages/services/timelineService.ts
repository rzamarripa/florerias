import { apiCall, ApiResponse } from '@/utils/api';

export interface TimelineItem {
    _id: string;
    userId: {
        _id: string;
        username: string;
        profile: {
            fullName: string;
            image?: string;
        };
    };
    packageId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const timelineService = {
    // Obtener el timeline de un paquete específico
    getPackageTimeline: async (packageId: string): Promise<TimelineItem[]> => {
        try {
            const response = await apiCall<TimelineItem[]>(`/invoices-package/timeline/${packageId}`, {
                method: 'GET',
            });

            return response.data;
        } catch (error) {
            console.error('Error al obtener timeline del paquete:', error);
            return [];
        }
    },

    // Crear un registro en el timeline (opcional, por si lo necesitas en el futuro)
    createTimelineEntry: async (packageId: string, status: string): Promise<boolean> => {
        try {
            const response = await apiCall<any>('/invoices-package/timeline', {
                method: 'POST',
                body: JSON.stringify({
                    packageId,
                    status
                }),
            });

            return response.success;
        } catch (error) {
            console.error('Error al crear entrada de timeline:', error);
            return false;
        }
    }
};

export default timelineService; 
import PackageTimeline from '../models/PackageTimeline.js';

const timelineService = {
    /**
     * Registra un cambio de estatus en el timeline del paquete
     * @param {string} userId - ID del usuario que realizó el cambio
     * @param {string} packageId - ID del paquete
     * @param {string} status - Nuevo estatus del paquete
     */
    registerStatusChange: async (userId, packageId, status) => {
        try {
            console.log('📝 TimelineService.registerStatusChange called:', { userId, packageId, status });

            // Validar que el status sea válido
            const validStatuses = ['borrador', 'enviado', 'programado', 'fondeado', 'generado', 'pagado', 'PorFondear', 'Fondeado', 'Generado'];
            if (!validStatuses.includes(status)) {
                console.warn(`Status no válido para timeline: ${status}`);
                return null;
            }

            // Crear el registro en el timeline
            const timelineEntry = new PackageTimeline({
                userId,
                packageId,
                status
            });

            const savedEntry = await timelineEntry.save();
            console.log(`✅ Timeline registrado: Paquete ${packageId} cambió a ${status} por usuario ${userId}`);

            return savedEntry;

        } catch (error) {
            console.error('❌ Error al registrar en timeline:', error);
            // No lanzamos el error para no afectar la lógica principal
            return null;
        }
    },

    /**
     * Obtiene el timeline completo de un paquete
     * @param {string} packageId - ID del paquete
     */
    getPackageTimeline: async (packageId) => {
        try {
            const timeline = await PackageTimeline.find({ packageId })
                .populate('userId', 'username profile.fullName profile.image')
                .sort({ createdAt: 1 });

            return timeline;

        } catch (error) {
            console.error('❌ Error al obtener timeline:', error);
            return [];
        }
    }
};

export default timelineService; 
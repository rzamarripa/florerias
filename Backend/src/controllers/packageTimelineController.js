import PackageTimeline from '../models/PackageTimeline.js';
import mongoose from 'mongoose';

const packageTimelineController = {
    // Crear un nuevo registro en el timeline
    createTimelineEntry: async (req, res) => {
        try {
            const { packageId, status } = req.body;
            const userId = req.user._id; // Usuario desde el middleware de autenticación

            // Validar datos requeridos
            if (!packageId || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'packageId y status son requeridos'
                });
            }

            // Validar que el status sea válido
            const validStatuses = ['borrador', 'enviado', 'programado', 'fondeado', 'generado', 'pagado', 'PorFondear', 'Fondeado'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status no válido'
                });
            }

            // Crear el registro en el timeline
            const timelineEntry = new PackageTimeline({
                userId,
                packageId,
                status
            });

            await timelineEntry.save();

            res.status(201).json({
                success: true,
                message: 'Registro de timeline creado exitosamente',
                data: timelineEntry
            });

        } catch (error) {
            console.error('Error al crear registro de timeline:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Obtener el timeline de un paquete específico
    getPackageTimeline: async (req, res) => {
        try {
            const { packageId } = req.params;

            console.log('🔍 Buscando timeline para packageId:', packageId);

            if (!packageId) {
                return res.status(400).json({
                    success: false,
                    message: 'packageId es requerido'
                });
            }

            // Convertir packageId a ObjectId si es necesario
            let packageObjectId;
            try {
                packageObjectId = new mongoose.Types.ObjectId(packageId);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'packageId no es un ObjectId válido'
                });
            }

            console.log('🔍 Buscando con ObjectId:', packageObjectId);

            // Primero buscar sin populate para debug
            const rawTimeline = await PackageTimeline.find({ packageId: packageObjectId });
            console.log('🔍 Registros sin populate:', rawTimeline.length);

            // Obtener el timeline del paquete con información del usuario
            const timeline = await PackageTimeline.find({ packageId: packageObjectId })
                .populate('userId', 'username profile.fullName profile.image')
                .sort({ createdAt: 1 }); // Ordenar por fecha ascendente

            console.log('📊 Registros encontrados con populate:', timeline.length);
            if (timeline.length > 0) {
                console.log('📋 Primer registro:', JSON.stringify(timeline[0], null, 2));
            }

            res.status(200).json({
                success: true,
                data: timeline
            });

        } catch (error) {
            console.error('Error al obtener timeline del paquete:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // DEBUG: Obtener todos los registros del timeline
    getAllTimelineEntries: async (req, res) => {
        try {
            const allEntries = await PackageTimeline.find({})
                .populate('userId', 'username profile.fullName')
                .sort({ createdAt: -1 });

            console.log('🔍 Total de registros en timeline:', allEntries.length);

            res.status(200).json({
                success: true,
                data: allEntries,
                total: allEntries.length
            });

        } catch (error) {
            console.error('Error al obtener todos los registros de timeline:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
};

export default packageTimelineController; 
import { AuthorizationFolio } from '../models/AuthorizationFolio.js';
import { User } from '../models/User.js';
import { InvoicesPackage } from '../models/InvoicesPackpage.js';
import mongoose from 'mongoose';

// Create a new AuthorizationFolio
export const createAuthorizationFolio = async (req, res) => {
    try {
        const folioData = req.body;
        folioData.estatus = 'pendiente';
        
        const newFolio = await AuthorizationFolio.create(folioData);
        
        res.status(201).json({
            success: true,
            data: newFolio,
            message: 'Folio de autorización creado correctamente'
        });
    } catch (error) {
        console.error('❌ Error al crear folio:', error);
        res.status(400).json({ 
            success: false,
            message: 'Error al crear el folio de autorización', 
            error: error.message 
        });
    }
};

// Get all AuthorizationFolios
export const getAllAuthorizationFolios = async (req, res) => {
    try {
        const { folio } = req.query;
        let query = {};
        
        if (folio) {
            query.folio = folio;
        }
        
        const folios = await AuthorizationFolio.find(query)
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: folios,
            message: `${folios.length} folios encontrados`
        });
    } catch (error) {
        console.error('Error al obtener folios de autorización:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener los folios de autorización', 
            error: error.message,
            data: []
        });
    }
};

// Get one AuthorizationFolio by ID
export const getAuthorizationFolioById = async (req, res) => {
    try {
        const folio = await AuthorizationFolio.findById(req.params.id);
        if (!folio) {
            return res.status(404).json({ message: 'Folio de autorización no encontrado' });
        }
        res.json(folio);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el folio de autorización', error: error.message });
    }
};

// Update AuthorizationFolio
export const updateAuthorizationFolio = async (req, res) => {
    try {
        const updatedFolio = await AuthorizationFolio.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedFolio) {
            return res.status(404).json({ message: 'Folio de autorización no encontrado' });
        }
        res.json(updatedFolio);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el folio de autorización', error: error.message });
    }
};

// Delete AuthorizationFolio
export const deleteAuthorizationFolio = async (req, res) => {
    try {
        const deletedFolio = await AuthorizationFolio.findByIdAndDelete(req.params.id);
        if (!deletedFolio) {
            return res.status(404).json({ message: 'Folio de autorización no encontrado' });
        }
        res.json({ message: 'Folio de autorización eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el folio de autorización', error: error.message });
    }
};

// Authorize or Reject AuthorizationFolio
export const authorizeOrRejectFolio = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['autorizado', 'rechazado'].includes(status)) {
            return res.status(400).json({ message: 'Estatus inválido. Solo se permite "autorizado" o "rechazado".' });
        }
        const folio = await AuthorizationFolio.findById(req.params.id);
        if (!folio) {
            return res.status(404).json({ message: 'Folio de autorización no encontrado' });
        }
        if (folio.estatus !== 'pendiente') {
            return res.status(400).json({ message: 'Solo se puede autorizar o rechazar un folio en estatus pendiente.' });
        }
        folio.estatus = status;
        folio.fechaFolioAutorizacion = new Date();
        await folio.save();
        res.json(folio);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el estatus del folio', error: error.message });
    }
};

// Redeem (Canjear) AuthorizationFolio
export const redeemFolio = async (req, res) => {
    try {
        const folio = await AuthorizationFolio.findById(req.params.id);
        
        if (!folio) {
            return res.status(404).json({ 
                success: false,
                message: 'Folio de autorización no encontrado',
                data: null
            });
        }
        
        if (folio.estatus !== 'autorizado') {
            return res.status(400).json({ 
                success: false,
                message: 'Solo se puede canjear un folio en estatus autorizado.',
                data: null
            });
        }
        
        folio.estatus = 'canjeado';
        await folio.save();
        
        res.json({
            success: true,
            data: folio,
            message: 'Folio canjeado correctamente'
        });
    } catch (error) {
        console.error('❌ Error al canjear folio:', error);
        res.status(400).json({ 
            success: false,
            message: 'Error al canjear el folio', 
            error: error.message,
            data: null
        });
    }
};

// Get AuthorizationFolios by package ID
export const getAuthorizationFoliosByPackage = async (req, res) => {
    try {
        const { packageId } = req.params;
        
        // Validar que el packageId sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({ 
                success: false,
                message: 'ID de paquete inválido',
                data: []
            });
        }
        
        // Buscar folios
        const folios = await AuthorizationFolio.find({ paquete_id: packageId })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: folios,
            message: `${folios.length} folios encontrados para el paquete`
        });
    } catch (error) {
        console.error('Error al obtener folios del paquete:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener los folios del paquete', 
            error: error.message,
            data: []
        });
    }
};

// Get pending authorization folios
export const getPendingAuthorizationFolios = async (req, res) => {
    try {
        // Buscar folios pendientes y autorizados, excluyendo canjeados
        const folios = await AuthorizationFolio.find({ 
            estatus: { $in: ['pendiente', 'autorizado'] }
        }).sort({ createdAt: -1 });
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.json({
            success: true,
            data: folios,
            message: `${folios.length} folios encontrados (pendientes y autorizados)`
        });
    } catch (error) {
        console.error('Error al obtener folios:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener los folios', 
            error: error.message,
            data: []
        });
    }
};

// Get pending and authorized authorization folios with user and package info
export const getAuthorizationFoliosWithUserInfo = async (req, res) => {
    try {
        console.log('🔍 Buscando folios pendientes y autorizados...');
        
        // Primero buscar todos los folios para debug
        const allFolios = await AuthorizationFolio.find({});
        console.log(`📊 Total de folios en BD: ${allFolios.length}`);
        console.log('📋 Estatus de folios:', allFolios.map(f => ({ folio: f.folio, estatus: f.estatus })));
        
        // Buscar folios pendientes y autorizados, excluyendo canjeados
        const folios = await AuthorizationFolio.find({ 
            estatus: { $in: ['pendiente', 'autorizado'] }
        }).sort({ createdAt: -1 });
        
        console.log(`✅ Folios pendientes y autorizados encontrados: ${folios.length}`);
        
        // Populate user and package information
        const foliosWithInfo = await Promise.all(
            folios.map(async (folio) => {
                const folioObj = folio.toObject();
                
                // Get user info
                try {
                    const user = await User.findById(folio.usuario_id).select('profile');
                    folioObj.usuario = user;
                    console.log(`👤 Usuario encontrado para folio ${folio.folio}:`, user?.profile?.fullName || 'No encontrado');
                } catch (error) {
                    console.error('Error al obtener usuario:', error);
                    folioObj.usuario = null;
                }
                
                // Get package info
                try {
                    const packpage = await InvoicesPackage.findById(folio.paquete_id).select('folio departamento comentario');
                    folioObj.paquete = packpage;
                    console.log(`📦 Paquete encontrado para folio ${folio.folio}:`, packpage?.folio || 'No encontrado');
                } catch (error) {
                    console.error('Error al obtener paquete:', error);
                    folioObj.paquete = null;
                }
                
                return folioObj;
            })
        );
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.json({
            success: true,
            data: foliosWithInfo,
            message: `${foliosWithInfo.length} folios encontrados (pendientes y autorizados)`
        });
    } catch (error) {
        console.error('❌ Error al obtener folios con información de usuario:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener los folios con información de usuario', 
            error: error.message,
            data: []
        });
    }
};

// Authorize a folio
export const authorizeFolio = async (req, res) => {
    try {
        const folio = await AuthorizationFolio.findById(req.params.id);
        if (!folio) {
            return res.status(404).json({ 
                success: false,
                message: 'Folio de autorización no encontrado',
                data: null
            });
        }
        
        if (folio.estatus === 'canjeado') {
            return res.status(400).json({ 
                success: false,
                message: 'No se puede autorizar un folio que ya ha sido canjeado.',
                data: null
            });
        }
        
        folio.estatus = 'autorizado';
        folio.fechaFolioAutorizacion = new Date();
        await folio.save();
        
        res.json({
            success: true,
            data: folio,
            message: 'Folio autorizado correctamente'
        });
    } catch (error) {
        console.error('Error al autorizar folio:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al autorizar el folio', 
            error: error.message,
            data: null
        });
    }
};

// Reject a folio
export const rejectFolio = async (req, res) => {
    try {
        const folio = await AuthorizationFolio.findById(req.params.id);
        if (!folio) {
            return res.status(404).json({ 
                success: false,
                message: 'Folio de autorización no encontrado',
                data: null
            });
        }
        
        if (folio.estatus === 'canjeado') {
            return res.status(400).json({ 
                success: false,
                message: 'No se puede rechazar un folio que ya ha sido canjeado.',
                data: null
            });
        }
        
        folio.estatus = 'rechazado';
        folio.fechaFolioAutorizacion = new Date();
        await folio.save();
        
        res.json({
            success: true,
            data: folio,
            message: 'Folio rechazado correctamente'
        });
    } catch (error) {
        console.error('Error al rechazar folio:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al rechazar el folio', 
            error: error.message,
            data: null
        });
    }
}; 
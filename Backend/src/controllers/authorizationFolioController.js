import { AuthorizationFolio } from '../models/AuthorizationFolio.js';
import mongoose from 'mongoose';

// Create a new AuthorizationFolio
export const createAuthorizationFolio = async (req, res) => {
    try {
        const folioData = req.body;
        folioData.estatus = 'pendiente';
        const newFolio = await AuthorizationFolio.create(folioData);
        res.status(201).json(newFolio);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear el folio de autorización', error: error.message });
    }
};

// Get all AuthorizationFolios
export const getAllAuthorizationFolios = async (req, res) => {
    try {
        const folios = await AuthorizationFolio.find();
        res.json(folios);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los folios de autorización', error: error.message });
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
            return res.status(404).json({ message: 'Folio de autorización no encontrado' });
        }
        if (folio.estatus !== 'autorizado') {
            return res.status(400).json({ message: 'Solo se puede canjear un folio en estatus autorizado.' });
        }
        folio.estatus = 'canjeado';
        await folio.save();
        res.json(folio);
    } catch (error) {
        res.status(400).json({ message: 'Error al canjear el folio', error: error.message });
    }
}; 
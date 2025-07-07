import mongoose from 'mongoose';

const AuthorizationFolioSchema = new mongoose.Schema({
    paquete_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_invoices_package',
        required: true
    },
    motivo: {
        type: String,
        required: true
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_users',
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    estatus: {
        type: String,
        required: true
    },
    fechaFolioAutorizacion: {
        type: Date,
        required: true
    },
    folio: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true,
    collection: 'cc_authorization_folio'
});

const AuthorizationFolio = mongoose.model('cc_authorization_folio', AuthorizationFolioSchema);

export { AuthorizationFolio }; 
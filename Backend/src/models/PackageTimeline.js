import mongoose from 'mongoose';
import { User } from './User.js';
import { InvoicesPackage } from './InvoicesPackpage.js';

const packageTimelineSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cs_user',
        required: true
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_invoices_package',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['borrador', 'enviado', 'programado', 'fondeado', 'generado', 'pagado', 'PorFondear', 'Fondeado', 'Generado']
    }
}, {
    timestamps: true,
    collection: 'tr_log_invoices_package_timeline'
});

// Índices para mejorar las consultas
packageTimelineSchema.index({ packageId: 1, createdAt: -1 });
packageTimelineSchema.index({ userId: 1 });
packageTimelineSchema.index({ status: 1 });

const PackageTimeline = mongoose.model('PackageTimeline', packageTimelineSchema);

export default PackageTimeline; 
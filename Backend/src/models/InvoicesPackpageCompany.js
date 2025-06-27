import mongoose from 'mongoose';
const { Schema } = mongoose;

const invoicesPackpageCompanySchema = new Schema({
    // Referencia al paquete de facturas
    packpageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_invoices_packpage',
        required: true,
        index: true
    },

    // Referencia a la compañía (razón social)
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_companies',
        required: true,
        index: true
    },

    // Referencia a la marca
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_brand',
        required: false, // Opcional, puede ser null
        index: true
    },

    // Referencia a la sucursal
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_branch',
        required: false, // Opcional, puede ser null
        index: true
    },

    // Fecha de creación
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'rs_invoices_packpages_companies'
});

// Índices compuestos para optimizar consultas
invoicesPackpageCompanySchema.index({ packpageId: 1, companyId: 1 });
invoicesPackpageCompanySchema.index({ companyId: 1, brandId: 1 });
invoicesPackpageCompanySchema.index({ brandId: 1, branchId: 1 });

// Métodos estáticos
invoicesPackpageCompanySchema.statics.findByPackpageId = function (packpageId) {
    return this.findOne({ packpageId }).populate(['companyId', 'brandId', 'branchId']);
};

invoicesPackpageCompanySchema.statics.findByCompanyId = function (companyId) {
    return this.find({ companyId }).populate(['packpageId', 'brandId', 'branchId']);
};

invoicesPackpageCompanySchema.statics.findByBrandId = function (brandId) {
    return this.find({ brandId }).populate(['packpageId', 'companyId', 'branchId']);
};

invoicesPackpageCompanySchema.statics.findByBranchId = function (branchId) {
    return this.find({ branchId }).populate(['packpageId', 'companyId', 'brandId']);
};

const InvoicesPackpageCompany = mongoose.model('rs_invoices_packpages_companies', invoicesPackpageCompanySchema);

export { InvoicesPackpageCompany }; 
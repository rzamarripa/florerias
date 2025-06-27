import mongoose from 'mongoose';
const { Schema } = mongoose;

const invoicesPackageCompanySchema = new Schema({
    // Referencia al paquete de facturas
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_invoices_package',
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
    collection: 'rs_invoices_packages_companies'
});

// Índices compuestos para optimizar consultas
invoicesPackageCompanySchema.index({ packageId: 1, companyId: 1 });
invoicesPackageCompanySchema.index({ companyId: 1, brandId: 1 });
invoicesPackageCompanySchema.index({ brandId: 1, branchId: 1 });

// Métodos estáticos
invoicesPackageCompanySchema.statics.findByPackageId = function (packageId) {
    return this.findOne({ packageId }).populate(['companyId', 'brandId', 'branchId']);
};

invoicesPackageCompanySchema.statics.findByCompanyId = function (companyId) {
    return this.find({ companyId }).populate(['packageId', 'brandId', 'branchId']);
};

invoicesPackageCompanySchema.statics.findByBrandId = function (brandId) {
    return this.find({ brandId }).populate(['packageId', 'companyId', 'branchId']);
};

invoicesPackageCompanySchema.statics.findByBranchId = function (branchId) {
    return this.find({ branchId }).populate(['packageId', 'companyId', 'brandId']);
};

const InvoicesPackageCompany = mongoose.model('rs_invoices_packages_companies', invoicesPackageCompanySchema);

export { InvoicesPackageCompany }; 
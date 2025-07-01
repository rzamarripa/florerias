import mongoose from 'mongoose';
import { Counter } from "./Counter.js";
import { ImportedInvoices } from './ImportedInvoices.js';

const InvoicesPackageSchema = new mongoose.Schema({
    // Arreglo de facturas importadas
    facturas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_imported_invoices',
        required: true
    }],

    // Referencia a la relación con Company, Brand, Branch
    packageCompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rs_invoices_packages_companies',
        required: false, // Opcional para mantener compatibilidad con registros existentes
        index: true
    },

    // Estatus del paquete de facturas
    estatus: {
        type: String,
        required: true,
        enum: {
            values: ['Borrador', 'Enviado', 'Aprobado', 'Rechazado', 'Pagado', 'Cancelado'],
            message: 'El estatus debe ser uno de: Borrador, Enviado, Aprobado, Rechazado, Pagado, Cancelado'
        },
        default: 'Borrador',
        index: true
    },

    // Usuario que creó el paquete
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cs_user',
        required: true,
        index: true
    },

    // Fecha de creación del paquete
    fechaCreacion: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },

    // ID del departamento
    departamento_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_department',
        required: true,
        index: true
    },

    // Nombre del departamento
    departamento: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },

    // Total del importe a pagar de todas las facturas
    totalImporteAPagar: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
        default: 0,
        get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
        }
    },

    // Total pagado de todas las facturas
    totalPagado: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
        default: 0,
        get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
        }
    },

    // Comentario del paquete
    comentario: {
        type: String,
        trim: true,
        maxLength: 1000
    },

    // Fecha de pago programada
    fechaPago: {
        type: Date,
        required: true,
        index: true
    },

    // Folio del paquete
    folio: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },

    // Total de facturas en el paquete
    totalFacturas: {
        type: Number,
        required: true,
        min: 1,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'cc_invoices_package',

    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            if (ret.totalImporteAPagar && typeof ret.totalImporteAPagar.toString === 'function') {
                ret.totalImporteAPagar = parseFloat(ret.totalImporteAPagar.toString());
            }
            if (ret.totalPagado && typeof ret.totalPagado.toString === 'function') {
                ret.totalPagado = parseFloat(ret.totalPagado.toString());
            }
            return ret;
        }
    }
});

// Índices compuestos para optimizar consultas
InvoicesPackageSchema.index({ usuario_id: 1, estatus: 1 });
InvoicesPackageSchema.index({ departamento_id: 1, estatus: 1 });
InvoicesPackageSchema.index({ fechaPago: 1, estatus: 1 });
InvoicesPackageSchema.index({ fechaCreacion: -1, estatus: 1 });

// Métodos virtuales actualizados
InvoicesPackageSchema.virtual('estaCompleto').get(function () {
    return this.totalPagado >= this.totalImporteAPagar;
});

InvoicesPackageSchema.virtual('porcentajePagado').get(function () {
    if (this.totalImporteAPagar <= 0) return 0;
    return Math.round((this.totalPagado / this.totalImporteAPagar) * 100);
});

InvoicesPackageSchema.virtual('tieneSaldoPendiente').get(function () {
    return this.totalPagado < this.totalImporteAPagar;
});

InvoicesPackageSchema.virtual('saldo').get(function () {
    return this.totalImporteAPagar - this.totalPagado;
});

InvoicesPackageSchema.virtual('estaVencido').get(function () {
    return new Date() > this.fechaPago;
});

InvoicesPackageSchema.virtual('diasParaVencimiento').get(function () {
    const hoy = new Date();
    const vencimiento = new Date(this.fechaPago);
    const diffTime = vencimiento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Métodos de instancia actualizados
InvoicesPackageSchema.methods.actualizarTotales = async function () {
    // Obtener las facturas del paquete
    const facturas = await ImportedInvoices.find({
        _id: { $in: this.facturas }
    });

    // Calcular totales usando importeAPagar en lugar de importe
    this.totalImporteAPagar = facturas.reduce((sum, factura) => sum + factura.importeAPagar, 0);
    this.totalPagado = facturas.reduce((sum, factura) => sum + factura.importePagado, 0);
    this.totalFacturas = facturas.length;

    return this.save();
};

InvoicesPackageSchema.methods.agregarFactura = async function (facturaId) {
    if (!this.facturas.includes(facturaId)) {
        this.facturas.push(facturaId);
        await this.actualizarTotales();
    }
    return this;
};

InvoicesPackageSchema.methods.removerFactura = async function (facturaId) {
    this.facturas = this.facturas.filter(id => id.toString() !== facturaId.toString());
    await this.actualizarTotales();
    return this;
};

InvoicesPackageSchema.methods.cambiarEstatus = function (nuevoEstatus) {
    this.estatus = nuevoEstatus;
    return this.save();
};

// Métodos estáticos
InvoicesPackageSchema.statics.obtenerSiguienteFolio = async function () {
    const result = await Counter.findByIdAndUpdate(
        { _id: "invoicesPackageFolio" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return result.seq;
};

InvoicesPackageSchema.statics.buscarPorDepartamento = function (departamentoId) {
    return this.find({ departamento_id: departamentoId }).populate('facturas');
};

InvoicesPackageSchema.statics.buscarPorUsuario = function (usuarioId) {
    return this.find({ usuario_id: usuarioId }).populate('facturas');
};

InvoicesPackageSchema.statics.buscarVencidos = function () {
    return this.find({
        fechaPago: { $lt: new Date() },
        estatus: { $in: ['Borrador', 'Enviado', 'Aprobado'] }
    }).populate('facturas');
};

InvoicesPackageSchema.statics.obtenerResumen = async function (usuarioId = null) {
    const filtro = usuarioId ? { usuario_id: usuarioId } : {};

    const promesaTotal = this.countDocuments(filtro);
    const promesaBorradores = this.countDocuments({ ...filtro, estatus: 'Borrador' });
    const promesaEnviados = this.countDocuments({ ...filtro, estatus: 'Enviado' });
    const promesaAprobados = this.countDocuments({ ...filtro, estatus: 'Aprobado' });
    const promesaPagados = this.countDocuments({ ...filtro, estatus: 'Pagado' });
    const promesaVencidos = this.countDocuments({
        ...filtro,
        fechaPago: { $lt: new Date() },
        estatus: { $in: ['Borrador', 'Enviado', 'Aprobado'] }
    });

    const [total, borradores, enviados, aprobados, pagados, vencidos] = await Promise.all([
        promesaTotal,
        promesaBorradores,
        promesaEnviados,
        promesaAprobados,
        promesaPagados,
        promesaVencidos
    ]);

    return {
        total,
        borradores,
        enviados,
        aprobados,
        pagados,
        vencidos
    };
};

// Middleware pre-save para validaciones actualizado
InvoicesPackageSchema.pre('save', function (next) {
    // Validar que totalPagado no exceda totalImporteAPagar
    if (this.totalPagado > this.totalImporteAPagar) {
        this.totalPagado = this.totalImporteAPagar;
    }

    // Validar que haya al menos una factura
    if (this.facturas.length === 0) {
        return next(new Error('El paquete debe contener al menos una factura'));
    }

    // Validar que no haya facturas duplicadas
    const facturasUnicas = [...new Set(this.facturas.map(id => id.toString()))];
    if (facturasUnicas.length !== this.facturas.length) {
        return next(new Error('No se pueden agregar facturas duplicadas al mismo paquete'));
    }

    next();
});

const InvoicesPackage = mongoose.model('cc_invoices_package', InvoicesPackageSchema);

export { InvoicesPackage }; 
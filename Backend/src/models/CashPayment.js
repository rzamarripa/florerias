import mongoose from "mongoose";
const { Schema } = mongoose;

const cashPaymentSchema = new Schema({
    // Importe a pagar (monto original del pago en efectivo)
    importeAPagar: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
        get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
        }
    },

    // Importe ya pagado
    importePagado: {
        type: mongoose.Schema.Types.Decimal128,
        min: 0,
        default: 0,
        get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
        }
    },

    expenseConcept: { type: Schema.Types.ObjectId, ref: "cc_expense_concept", required: true },
    description: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },

    // Estados de autorización y pago (igual que en ImportedInvoices)
    autorizada: { type: Boolean, default: null }, // null = pendiente, true = autorizada, false = rechazada
    pagoRechazado: { type: Boolean, default: false },
    estadoPago: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    esCompleta: { type: Boolean, default: false },
    registrado: { type: Number, enum: [0, 1], default: 0 },
    pagado: { type: Number, enum: [0, 1], default: 0 },
    descripcionPago: { type: String, trim: true, maxLength: 500 },
    fechaRevision: { type: Date, default: null }
}, {
    timestamps: true,
    collection: 'cc_cash_payment',
    
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            if (ret.importeAPagar && typeof ret.importeAPagar.toString === 'function') {
                ret.importeAPagar = parseFloat(ret.importeAPagar.toString());
            }
            if (ret.importePagado && typeof ret.importePagado.toString === 'function') {
                ret.importePagado = parseFloat(ret.importePagado.toString());
            }
            return ret;
        }
    }
});

// Índices para optimizar consultas
cashPaymentSchema.index({ estadoPago: 1, estatus: 1 });
cashPaymentSchema.index({ fechaRevision: -1 });
cashPaymentSchema.index({ autorizada: 1 });
cashPaymentSchema.index({ pagoRechazado: 1 });

// Métodos virtuales (igual que ImportedInvoices)
cashPaymentSchema.virtual('estaPagada').get(function () {
    return this.estadoPago === 2;
});

cashPaymentSchema.virtual('fueEnviadaAPago').get(function () {
    return this.estadoPago === 1;
});

cashPaymentSchema.virtual('tieneSaldoPendiente').get(function () {
    return this.importeAPagar > this.importePagado;
});

cashPaymentSchema.virtual('saldo').get(function () {
    return this.importeAPagar - this.importePagado;
});

cashPaymentSchema.virtual('porcentajePagado').get(function () {
    if (this.importeAPagar <= 0) return 0;
    return Math.round((this.importePagado / this.importeAPagar) * 100);
});

cashPaymentSchema.virtual('descripcionEstadoPago').get(function () {
    const estados = {
        null: 'Pendiente de autorización',
        0: 'Pendiente',
        1: 'Enviado a pago',
        2: 'Pagado',
        3: 'Registrado'
    };
    return estados[this.estadoPago] || 'Desconocido';
});

// Métodos de instancia (igual que ImportedInvoices)
cashPaymentSchema.methods.enviarAPago = function () {
    this.estadoPago = 1;
    return this.save();
};

cashPaymentSchema.methods.marcarComoPagada = function (importePagado = null) {
    if (importePagado !== null) {
        this.importePagado = importePagado;
    } else {
        this.importePagado = this.importeAPagar;
    }
    this.estadoPago = 2;
    return this.save();
};

cashPaymentSchema.methods.marcarComoRegistrada = function () {
    this.estadoPago = 3;
    return this.save();
};

cashPaymentSchema.methods.registrarPagoParcial = function (importePagado) {
    this.importePagado = importePagado;
    if (this.importePagado >= this.importeAPagar) {
        this.estadoPago = 2; // Pagado
    } else {
        this.estadoPago = 1; // Enviado a pago (para pagos parciales)
    }
    return this.save();
};

// Middleware pre-save para validaciones
cashPaymentSchema.pre('save', function (next) {
    // Establecer importeAPagar por defecto si no está definido
    if (this.importeAPagar === undefined || this.importeAPagar === null) {
        this.importeAPagar = 0;
    }

    // Establecer importePagado por defecto si no está definido
    if (this.importePagado === undefined || this.importePagado === null) {
        this.importePagado = 0;
    }

    // Validar que importePagado no exceda el importeAPagar
    if (this.importePagado > this.importeAPagar) {
        this.importePagado = this.importeAPagar;
    }

    // Actualizar estadoPago basado en importePagado
    if (this.importePagado >= this.importeAPagar && this.importeAPagar > 0) {
        this.estadoPago = 2; // Pagado
    } else if (this.estadoPago === 2 && this.importePagado < this.importeAPagar) {
        this.estadoPago = 0; // Volver a pendiente si se reduce el pago
    }

    next();
});

const CashPayment = mongoose.model("cc_cash_payment", cashPaymentSchema);

export { CashPayment }; 
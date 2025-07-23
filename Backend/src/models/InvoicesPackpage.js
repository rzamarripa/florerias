import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const InvoicesPackageSchema = new mongoose.Schema(
  {
    facturas: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        uuid: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          match: [
            /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
            "Formato de UUID inválido",
          ],
        },
        rfcEmisor: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          match: [
            /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            "Formato de RFC inválido",
          ],
        },
        nombreEmisor: {
          type: String,
          required: true,
          trim: true,
          maxLength: 254,
        },
        razonSocial: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "cc_companies",
          required: true,
        },
        rfcReceptor: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          match: [
            /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            "Formato de RFC inválido",
          ],
        },
        nombreReceptor: {
          type: String,
          required: true,
          trim: true,
          maxLength: 254,
        },
        rfcProveedorCertificacion: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          match: [
            /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/,
            "Formato de RFC del PAC inválido",
          ],
        },
        fechaEmision: {
          type: Date,
          required: true,
        },
        fechaCertificacionSAT: {
          type: Date,
          required: true,
        },
        fechaCancelacion: {
          type: Date,
          default: null,
        },
        importeAPagar: {
          type: mongoose.Schema.Types.Decimal128,
          required: true,
          min: 0,
          get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
          },
        },
        tipoComprobante: {
          type: String,
          required: true,
          enum: {
            values: ["I", "E", "P"],
            message:
              "El tipo de comprobante debe ser I (Ingreso), E (Egreso), o P (Pago)",
          },
        },
        estatus: {
          type: Number,
          required: true,
          enum: {
            values: [0, 1],
            message: "El estatus debe ser 0 (Cancelado) o 1 (Vigente)",
          },
          default: 1,
        },
        folio: {
          type: String,
          trim: true,
          maxLength: 50,
        },
        serie: {
          type: String,
          trim: true,
          maxLength: 50,
        },
        formaPago: {
          type: String,
          trim: true,
          maxLength: 10,
        },
        metodoPago: {
          type: String,
          trim: true,
          maxLength: 10,
        },
        importePagado: {
          type: mongoose.Schema.Types.Decimal128,
          min: 0,
          default: 0,
          get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
          },
        },
        estadoPago: {
          type: Number,
          enum: {
            values: [null, 0, 1, 2, 3],
            message:
              "El estado de pago debe ser null (Pendiente de autorización), 0 (Pendiente), 1 (Enviado), 2 (Pagado), o 3 (Registrado)",
          },
          default: 0,
        },
        esCompleta: {
          type: Boolean,
          default: false,
        },
        descripcionPago: {
          type: String,
          trim: true,
          maxLength: 500,
        },
        autorizada: {
          type: Boolean,
          default: true,
        },
        pagoRechazado: {
          type: Boolean,
          default: false,
        },
        fechaRevision: {
          type: Date,
          default: null,
        },
        registrado: {
          type: Number,
          enum: {
            values: [0, 1],
            message: "El valor debe ser 0 (No) o 1 (Sí)",
          },
          default: 0,
        },
        pagado: {
          type: Number,
          enum: {
            values: [0, 1],
            message: "El valor debe ser 0 (No) o 1 (Sí)",
          },
          default: 0,
        },
        fiestatus: {
          type: String,
          trim: true,
          maxLength: 50,
          default: "Activo",
        },
        estaRegistrada: {
          type: Boolean,
          default: false,
        },
        motivoDescuento: {
          type: String,
          trim: true,
          maxLength: 500,
          default: "",
        },
        descuento: {
          type: Number,
          default: 0,
        },
        conceptoGasto: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cc_expense_concept",
            required: false,
          },
          name: {
            type: String,
            required: false,
          },
          descripcion: {
            type: String,
            required: false,
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pagosEfectivo: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        importeAPagar: {
          type: mongoose.Schema.Types.Decimal128,
          required: true,
          get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
          },
        },
        importePagado: {
          type: mongoose.Schema.Types.Decimal128,
          min: 0,
          default: 0,
          get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
          },
        },
        expenseConcept: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "cc_expense_concept",
          required: true,
        },
        description: { type: String },
        createdAt: { type: Date, default: Date.now },

        autorizada: { type: Boolean, default: null },
        pagoRechazado: { type: Boolean, default: false },
        estadoPago: { type: Number, enum: [0, 1, 2, 3], default: 0 },
        esCompleta: { type: Boolean, default: false },
        registrado: { type: Number, enum: [0, 1], default: 0 },
        pagado: { type: Number, enum: [0, 1], default: 0 },
        descripcionPago: { type: String, trim: true, maxLength: 500 },
        fechaRevision: { type: Date, default: null },
      },
    ],
    packageCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rs_invoices_packages_companies",
      required: false,
      index: true,
    },
    estatus: {
      type: String,
      required: true,
      enum: {
        values: [
          "Borrador",
          "Enviado",
          "Aprobado",
          "Rechazado",
          "Pagado",
          "Cancelado",
          "Programado",
          "PorFondear",
          "Generado",
        ],
        message:
          "El estatus debe ser uno de: Borrador, Enviado, Aprobado, Rechazado, Pagado, Cancelado, Programado, PorFondear, Generado",
      },
      default: "Borrador",
      index: true,
    },
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cs_user",
      required: true,
      index: true,
    },
    departamento_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cc_department",
      required: true,
      index: true,
    },
    departamento: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    totalImporteAPagar: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
      default: 0,
      get: function (value) {
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    totalPagado: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: 0,
      default: 0,
      get: function (value) {
        return value ? parseFloat(value.toString()) : 0;
      },
    },
    comentario: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    fechaPago: {
      type: Date,
      required: true,
      index: true,
    },
    folio: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    totalFacturas: {
      type: Number,
      required: true,
      min: 1,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "cc_invoices_package",

    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        if (
          ret.totalImporteAPagar &&
          typeof ret.totalImporteAPagar.toString === "function"
        ) {
          ret.totalImporteAPagar = parseFloat(
            ret.totalImporteAPagar.toString()
          );
        }
        if (ret.totalPagado && typeof ret.totalPagado.toString === "function") {
          ret.totalPagado = parseFloat(ret.totalPagado.toString());
        }

        if (ret.facturas && Array.isArray(ret.facturas)) {
          ret.facturas = ret.facturas.map((factura) => {
            const facturaTransformed = { ...factura };

            if (
              factura.importeAPagar &&
              typeof factura.importeAPagar.toString === "function"
            ) {
              facturaTransformed.importeAPagar = parseFloat(
                factura.importeAPagar.toString()
              );
            }
            if (
              factura.importePagado &&
              typeof factura.importePagado.toString === "function"
            ) {
              facturaTransformed.importePagado = parseFloat(
                factura.importePagado.toString()
              );
            }

            if (
              factura.razonSocial &&
              typeof factura.razonSocial === "object" &&
              factura.razonSocial._bsontype === "ObjectId"
            ) {
              facturaTransformed.razonSocial = {
                _id: factura.razonSocial.toString(),
                name: "",
                rfc: "",
              };
            }

            return facturaTransformed;
          });
        }

        if (ret.pagosEfectivo && Array.isArray(ret.pagosEfectivo)) {
          ret.pagosEfectivo = ret.pagosEfectivo.map((pago) => {
            const pagoTransformed = { ...pago };

            if (
              pago.importeAPagar &&
              typeof pago.importeAPagar.toString === "function"
            ) {
              pagoTransformed.importeAPagar = parseFloat(
                pago.importeAPagar.toString()
              );
            }
            if (
              pago.importePagado &&
              typeof pago.importePagado.toString === "function"
            ) {
              pagoTransformed.importePagado = parseFloat(
                pago.importePagado.toString()
              );
            }

            return pagoTransformed;
          });
        }

        return ret;
      },
    },
  }
);

InvoicesPackageSchema.index({ usuario_id: 1, estatus: 1 });
InvoicesPackageSchema.index({ departamento_id: 1, estatus: 1 });
InvoicesPackageSchema.index({ fechaPago: 1, estatus: 1 });
InvoicesPackageSchema.index({ fechaCreacion: -1, estatus: 1 });

InvoicesPackageSchema.virtual("estaCompleto").get(function () {
  return this.totalPagado >= this.totalImporteAPagar;
});

InvoicesPackageSchema.virtual("porcentajePagado").get(function () {
  if (this.totalImporteAPagar <= 0) return 0;
  return Math.round((this.totalPagado / this.totalImporteAPagar) * 100);
});

InvoicesPackageSchema.virtual("tieneSaldoPendiente").get(function () {
  return this.totalPagado < this.totalImporteAPagar;
});

InvoicesPackageSchema.virtual("saldo").get(function () {
  return this.totalImporteAPagar - this.totalPagado;
});

InvoicesPackageSchema.virtual("estaVencido").get(function () {
  return new Date() > this.fechaPago;
});

InvoicesPackageSchema.virtual("diasParaVencimiento").get(function () {
  const hoy = new Date();
  const vencimiento = new Date(this.fechaPago);
  const diffTime = vencimiento - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

InvoicesPackageSchema.methods.actualizarTotales = async function () {
  // CORREGIDO: Calcular totalImporteAPagar con TODAS las facturas (sin filtrar por autorizada)
  // Esto representa el "gasto comprometido" total del paquete
  const totalFacturasImporte = this.facturas.reduce((sum, factura) => {
    const importe =
      typeof factura.importeAPagar === "object" &&
        factura.importeAPagar !== null &&
        factura.importeAPagar._bsontype === "Decimal128"
        ? parseFloat(factura.importeAPagar.toString())
        : factura.importeAPagar || 0;
    return sum + importe;
  }, 0);

  const totalPagosEfectivoImporte = Array.isArray(this.pagosEfectivo)
    ? this.pagosEfectivo.reduce((sum, pago) => {
      const importe =
        typeof pago.importeAPagar === "object" &&
          pago.importeAPagar !== null &&
          pago.importeAPagar._bsontype === "Decimal128"
          ? parseFloat(pago.importeAPagar.toString())
          : pago.importeAPagar || 0;
      return sum + importe;
    }, 0)
    : 0;

  // totalImporteAPagar = suma de TODAS las facturas (gasto comprometido)
  this.totalImporteAPagar = totalFacturasImporte + totalPagosEfectivoImporte;

  // Para totalPagado, sí filtrar por autorizadas (gasto real procesado)
  const facturasAutorizadas = this.facturas.filter(
    (factura) => factura.autorizada === true
  );
  const pagosEfectivoAutorizados = Array.isArray(this.pagosEfectivo)
    ? this.pagosEfectivo.filter((pago) => pago.autorizada === true)
    : [];

  const totalPagadoFacturas = facturasAutorizadas.reduce((sum, factura) => {
    const importe =
      typeof factura.importePagado === "object" &&
        factura.importePagado !== null &&
        factura.importePagado._bsontype === "Decimal128"
        ? parseFloat(factura.importePagado.toString())
        : factura.importePagado || 0;
    return sum + importe;
  }, 0);
  const totalPagadoEfectivo = pagosEfectivoAutorizados.reduce((sum, pago) => {
    const pagado =
      typeof pago.importeAPagar === "object" &&
        pago.importeAPagar !== null &&
        pago.importeAPagar._bsontype === "Decimal128"
        ? parseFloat(pago.importeAPagar.toString())
        : pago.importeAPagar || 0;
    return sum + pagado;
  }, 0);
  this.totalPagado = totalPagadoFacturas + totalPagadoEfectivo;

  this.totalFacturas =
    this.facturas.length +
    (Array.isArray(this.pagosEfectivo) ? this.pagosEfectivo.length : 0);

  return this.save();
};

InvoicesPackageSchema.methods.agregarFactura = async function (facturaData) {
  const facturaExistente = this.facturas.find(
    (f) =>
      f.uuid === facturaData.uuid ||
      f._id.toString() === facturaData._id.toString()
  );
  if (!facturaExistente) {
    this.facturas.push(facturaData);
    await this.actualizarTotales();
  }
  return this;
};

InvoicesPackageSchema.methods.removerFactura = async function (identificador) {
  this.facturas = this.facturas.filter(
    (factura) =>
      factura.uuid !== identificador &&
      factura._id.toString() !== identificador.toString()
  );
  await this.actualizarTotales();
  return this;
};

InvoicesPackageSchema.methods.actualizarFactura = async function (
  uuid,
  datosActualizados
) {
  const index = this.facturas.findIndex((factura) => factura.uuid === uuid);
  if (index !== -1) {
    this.facturas[index] = { ...this.facturas[index], ...datosActualizados };
    await this.actualizarTotales();
  }
  return this;
};

InvoicesPackageSchema.methods.buscarFacturaPorUUID = function (uuid) {
  return this.facturas.find((factura) => factura.uuid === uuid);
};

InvoicesPackageSchema.methods.cambiarEstatus = function (nuevoEstatus) {
  this.estatus = nuevoEstatus;
  return this.save();
};

InvoicesPackageSchema.statics.obtenerSiguienteFolio = async function () {
  const result = await Counter.findByIdAndUpdate(
    { _id: "invoicesPackageFolio" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
};

InvoicesPackageSchema.statics.buscarPorDepartamento = function (
  departamentoId
) {
  return this.find({ departamento_id: departamentoId });
};

InvoicesPackageSchema.statics.buscarPorUsuario = function (usuarioId) {
  return this.find({ usuario_id: usuarioId });
};

InvoicesPackageSchema.statics.buscarVencidos = function () {
  return this.find({
    fechaPago: { $lt: new Date() },
    estatus: { $in: ["Borrador", "Enviado", "Aprobado"] },
  });
};

InvoicesPackageSchema.statics.obtenerResumen = async function (
  usuarioId = null
) {
  const filtro = usuarioId ? { usuario_id: usuarioId } : {};

  const promesaTotal = this.countDocuments(filtro);
  const promesaBorradores = this.countDocuments({
    ...filtro,
    estatus: "Borrador",
  });
  const promesaEnviados = this.countDocuments({
    ...filtro,
    estatus: "Enviado",
  });
  const promesaAprobados = this.countDocuments({
    ...filtro,
    estatus: "Aprobado",
  });
  const promesaPagados = this.countDocuments({ ...filtro, estatus: "Pagado" });
  const promesaVencidos = this.countDocuments({
    ...filtro,
    fechaPago: { $lt: new Date() },
    estatus: { $in: ["Borrador", "Enviado", "Aprobado"] },
  });

  const [total, borradores, enviados, aprobados, pagados, vencidos] =
    await Promise.all([
      promesaTotal,
      promesaBorradores,
      promesaEnviados,
      promesaAprobados,
      promesaPagados,
      promesaVencidos,
    ]);

  return {
    total,
    borradores,
    enviados,
    aprobados,
    pagados,
    vencidos,
  };
};

InvoicesPackageSchema.pre("save", function (next) {
  if (this.totalPagado > this.totalImporteAPagar) {
    this.totalPagado = this.totalImporteAPagar;
  }

  const tieneFacturas = this.facturas && this.facturas.length > 0;
  const tienePagosEfectivo =
    this.pagosEfectivo &&
    Array.isArray(this.pagosEfectivo) &&
    this.pagosEfectivo.length > 0;

  if (!tieneFacturas && !tienePagosEfectivo) {
    return next(
      new Error(
        "El paquete debe contener al menos una factura o un pago en efectivo"
      )
    );
  }

  const uuids = this.facturas.map((factura) => factura.uuid);
  const ids = this.facturas.map((factura) => factura._id.toString());
  const uuidsUnicos = [...new Set(uuids)];
  const idsUnicos = [...new Set(ids)];

  if (uuidsUnicos.length !== uuids.length) {
    return next(
      new Error(
        "No se pueden agregar facturas duplicadas al mismo paquete (UUID duplicado)"
      )
    );
  }

  if (idsUnicos.length !== ids.length) {
    return next(
      new Error(
        "No se pueden agregar facturas duplicadas al mismo paquete (ID duplicado)"
      )
    );
  }

  next();
});

const InvoicesPackage = mongoose.model(
  "cc_invoices_package",
  InvoicesPackageSchema
);

export { InvoicesPackage };

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Row, Col } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";
import { BsClipboard } from "react-icons/bs";
import { useUserSessionStore } from "@/stores/userSessionStore";
import {
  createInvoicesPackage,
  updateInvoicesPackage,
  markInvoiceAsFullyPaid,
  markInvoiceAsPartiallyPaid,
  removeInvoiceFromPackage,
  removeCashPaymentFromPackage,
} from "../services/invoicesPackpage";
import { getNextThursdayOfWeek } from "@/utils/dateUtils";
import { toast } from "react-toastify";

interface FacturaProcesada {
  _id: string;
  nombreEmisor: string;
  uuid: string;
  fechaEmision: string;
  tipoComprobante: string;
  rfcEmisor: string;
  estatus: string;
  descripcionEstatus: string;
  fechaCancelacion?: string;
  importeAPagar: number;
  saldo: number;
  importePagado: number;
  razonSocial?: { name: string };
  guardada?: boolean;
  completamentePagada?: boolean;
  autorizada?: boolean;
  estaRegistrada?: boolean;
}

interface EnviarPagoModalProps {
  show: boolean;
  onClose: () => void;
  facturas: FacturaProcesada[];
  paqueteExistente?: any;
  razonSocialName?: string;
  isNewPackage?: boolean;
  onSuccess?: (packpageId?: string) => void;
  selectedCompanyId?: string;
  selectedBrandId?: string;
  selectedBranchId?: string;
  tempPayments?: {
    [invoiceId: string]: {
      tipoPago: "completo" | "parcial";
      descripcion: string;
      monto?: number;
      originalImportePagado: number;
      originalSaldo: number;
      conceptoGasto?: string;
    };
  };
  tempCashPayments?: {
    _id: string;
    importeAPagar: number;
    expenseConcept: {
      _id: string;
      name: string;
      categoryId?: {
        _id: string;
        name: string;
      };
    };
    description?: string;
    createdAt: string;
  }[];
  onRemoveTempPayment?: (invoiceId: string) => void;
  onRemoveTempCashPayment?: (cashPaymentId: string) => void;
  onCancel?: () => void;
}

const EnviarPagoModal: React.FC<EnviarPagoModalProps> = ({
  show,
  onClose,
  facturas,
  paqueteExistente,
  razonSocialName,
  isNewPackage = true,
  onSuccess,
  selectedCompanyId,
  selectedBrandId,
  selectedBranchId,
  tempPayments,
  tempCashPayments,
  onRemoveTempPayment,
  onRemoveTempCashPayment,
  onCancel,
}) => {
  const [fechaPago, setFechaPago] = useState<string>(
    paqueteExistente?.fechaPago || ""
  );
  const [comentario, setComentario] = useState<string>(
    paqueteExistente?.comentario || ""
  );
  const [facturasLocal, setFacturasLocal] = useState<FacturaProcesada[]>([]);
  const [pagosEfectivoLocal, setPagosEfectivoLocal] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"facturas" | "pagosEfectivo">(
    "facturas"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUserSessionStore();

  // Estados para rastrear eliminaciones diferidas en modo edición
  const [facturasToRemove, setFacturasToRemove] = useState<string[]>([]);
  const [cashPaymentsToRemove, setCashPaymentsToRemove] = useState<string[]>(
    []
  );

  // Estado para controlar si el modal ya fue inicializado para evitar resets no deseados
  const [modalInitialized, setModalInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Combinar facturas del paquete existente con las facturas nuevas seleccionadas
    let facturasAMostrar = [];

    if (paqueteExistente) {
      // Empezar con las facturas del paquete existente
      facturasAMostrar = [...paqueteExistente.facturas];

      // Agregar facturas nuevas que no estén ya en el paquete
      const facturaIdsExistentes = paqueteExistente.facturas.map(
        (f: any) => f._id
      );
      const facturasNuevas = facturas.filter(
        (f) => !facturaIdsExistentes.includes(f._id)
      );
      facturasAMostrar = [...facturasAMostrar, ...facturasNuevas];
    } else {
      // Si es un nuevo paquete, mostrar solo las facturas pasadas como prop
      facturasAMostrar = facturas;
    }

    // Agrega la propiedad guardada a cada factura
    const facturasConEstado = facturasAMostrar.map((f: any) => {
      // Calcular el importe pagado considerando pagos temporales
      let importePagadoCalculado = f.importePagado;
      if (tempPayments && tempPayments[f._id]) {
        const tempPayment = tempPayments[f._id];
        if (tempPayment.tipoPago === "completo") {
          importePagadoCalculado = f.importeAPagar;
        } else if (tempPayment.tipoPago === "parcial" && tempPayment.monto) {
          importePagadoCalculado =
            tempPayment.originalImportePagado + tempPayment.monto;
        }
      }

      return {
        ...f,
        guardada: paqueteExistente ? true : false,
        completamentePagada: importePagadoCalculado >= f.importeAPagar,
        importePagado: importePagadoCalculado, // Actualizar el importe pagado con los pagos temporales
      };
    });

    // Solo actualizar si es la primera carga del modal (evitar resets cuando se eliminan facturas)
    if (!modalInitialized) {
      setFacturasLocal(facturasConEstado);
      setModalInitialized(true);
    }
  }, [facturas, paqueteExistente, tempPayments, modalInitialized]);

  // useEffect adicional para asegurar sincronización cuando se abre/cierra el modal
  useEffect(() => {
    if (show) {
      // Limpiar listas de eliminaciones diferidas al abrir el modal
      setFacturasToRemove([]);
      setCashPaymentsToRemove([]);
      // Resetear el flag de inicialización para permitir nueva carga
      setModalInitialized(false);
      // Cuando se abre el modal, sincronizar inmediatamente el estado local
      // Usar la misma lógica que en el primer useEffect para combinar facturas
      let facturasAMostrar = [];
      if (paqueteExistente) {
        // Empezar con las facturas del paquete existente
        facturasAMostrar = [...paqueteExistente.facturas];

        // Agregar facturas nuevas que no estén ya en el paquete
        const facturaIdsExistentes = paqueteExistente.facturas.map(
          (f: any) => f._id
        );
        const facturasNuevas = facturas.filter(
          (f) => !facturaIdsExistentes.includes(f._id)
        );
        facturasAMostrar = [...facturasAMostrar, ...facturasNuevas];
      } else {
        // Si es un nuevo paquete, mostrar solo las facturas pasadas como prop
        facturasAMostrar = facturas;
      }

      const facturasConEstado = facturasAMostrar.map((f: any) => {
        let importePagadoCalculado = f.importePagado;
        if (tempPayments && tempPayments[f._id]) {
          const tempPayment = tempPayments[f._id];
          if (tempPayment.tipoPago === "completo") {
            importePagadoCalculado = f.importeAPagar;
          } else if (tempPayment.tipoPago === "parcial" && tempPayment.monto) {
            importePagadoCalculado =
              tempPayment.originalImportePagado + tempPayment.monto;
          }
        }

        return {
          ...f,
          guardada: paqueteExistente ? true : false,
          completamentePagada: importePagadoCalculado >= f.importeAPagar,
          importePagado: importePagadoCalculado,
        };
      });

      setFacturasLocal(facturasConEstado);

      // También sincronizar pagos en efectivo
      const pagosEfectivoExistentes = paqueteExistente?.pagosEfectivo || [];
      const pagosEfectivoCombinados = [
        ...pagosEfectivoExistentes,
        ...(tempCashPayments || []),
      ];
      setPagosEfectivoLocal(pagosEfectivoCombinados);
    } else {
      // Cuando se cierra el modal, resetear el flag de inicialización
      setModalInitialized(false);
    }
  }, [show, facturas, paqueteExistente, tempPayments, tempCashPayments]);

  useEffect(() => {
    const pagosEfectivoExistentes = paqueteExistente?.pagosEfectivo || [];
    const pagosEfectivoCombinados = [
      ...pagosEfectivoExistentes,
      ...(tempCashPayments || []),
    ];
    setPagosEfectivoLocal(pagosEfectivoCombinados);
  }, [paqueteExistente, tempCashPayments]);

  // Nuevo useEffect para sincronizar cuando se eliminan pagos temporales
  useEffect(() => {
    if (tempPayments) {
      // Filtrar facturas que ya no están en tempPayments
      setFacturasLocal((prev) => {
        // Si no hay facturas en el estado local, no hacer nada
        if (prev.length === 0) return prev;

        return prev.filter((f) => {
          // Para paquetes existentes: mantener facturas guardadas o que están en tempPayments
          if (paqueteExistente) {
            return f.guardada || tempPayments[f._id];
          }

          // Para nuevos paquetes: mantener facturas que están en tempPayments o que no son temporales
          return tempPayments[f._id] || !f.guardada;
        });
      });
    }
  }, [tempPayments, paqueteExistente]);

  useEffect(() => {
    if (paqueteExistente?.fechaPago) {
      // Si es un paquete existente, usar la fecha guardada
      const fechaOriginal = new Date(paqueteExistente.fechaPago);
      const fechaFormateada = fechaOriginal.toISOString().split("T")[0];
      setFechaPago(fechaFormateada);
      setComentario(paqueteExistente.comentario || "");
    } else if (show && isNewPackage) {
      // Si es un nuevo paquete, precargar con la fecha calculada (jueves de la semana siguiente)
      const today = new Date();
      const fechaCalculada = getNextThursdayOfWeek(today);
      const fechaCalculadaStr = fechaCalculada.toISOString().split("T")[0];
      setFechaPago(fechaCalculadaStr);
      setComentario("");
    } else if (show && !isNewPackage && !paqueteExistente) {
      // Si está en modo edición pero no hay paquete existente, resetear
      setFechaPago("");
      setComentario("");
    }
  }, [paqueteExistente, show, isNewPackage]);

  const handleRemoveFactura = async (id: string) => {
    const factura = facturasLocal.find((f) => f._id === id);
    if (!factura) return;

    // Verificar si es un pago temporal
    const isTemporary = tempPayments && tempPayments[id];
    console.log("isTemporary for", id, ":", Boolean(isTemporary));

    if (isTemporary) {
      // Eliminar inmediatamente del estado local para eliminación visual instantánea
      setFacturasLocal((prev) => prev.filter((f) => f._id !== id));

      // Llamar al callback para eliminar el pago temporal del state principal
      if (onRemoveTempPayment) {
        onRemoveTempPayment(id);
        console.log("onRemoveTempPayment", id);
      }
    } else {
      // Para facturas guardadas, verificar si se puede eliminar
      if (canRemovePayment(false)) {
        if (paqueteExistente && paqueteExistente._id) {
          // HAY PAQUETE EXISTENTE: Usar eliminación diferida (eliminar solo del estado local hasta guardar)
          setFacturasLocal((prev) => prev.filter((f) => f._id !== id));
          setFacturasToRemove((prev) => [...prev, id]);
          console.log("Factura marcada para eliminación diferida:", id);
        } else {
          // NO HAY PAQUETE EXISTENTE: Solo eliminar del estado local
          setFacturasLocal((prev) => prev.filter((f) => f._id !== id));
          console.log("Factura eliminada del estado local:", id);
        }
      }
    }
  };

  // Función para verificar si un pago se puede eliminar
  const canRemovePayment = (isTemporary = false) => {
    // Los pagos temporales siempre se pueden eliminar
    if (isTemporary) {
      return true;
    }

    // Para facturas procesadas en paquetes existentes:
    // Solo se pueden eliminar si el paquete está en estatus "Borrador"
    const packageIsDraft = paqueteExistente?.estatus === "Borrador";

    return packageIsDraft;
  };

  const handleRemoveCashPayment = async (pagoId: string) => {
    // Verificar si es un pago temporal
    const isTemporary =
      tempCashPayments && tempCashPayments.some((p) => p._id === pagoId);

    if (isTemporary) {
      // Eliminar inmediatamente del estado local para evitar parpadeos visuales
      setPagosEfectivoLocal((prev) => prev.filter((p) => p._id !== pagoId));

      // Llamar al callback para eliminar el pago temporal del state principal
      if (onRemoveTempCashPayment) {
        onRemoveTempCashPayment(pagoId);
      }
    } else {
      // Para pagos guardados, verificar si se puede eliminar
      const pago = pagosEfectivoLocal.find((p) => p._id === pagoId);
      if (pago && canRemovePayment(false)) {
        if (paqueteExistente && paqueteExistente._id) {
          // HAY PAQUETE EXISTENTE: Usar eliminación diferida (eliminar solo del estado local hasta guardar)
          setPagosEfectivoLocal((prev) => prev.filter((p) => p._id !== pagoId));
          setCashPaymentsToRemove((prev) => [...prev, pagoId]);
          console.log(
            "Pago en efectivo marcado para eliminación diferida:",
            pagoId
          );
        } else {
          // NO HAY PAQUETE EXISTENTE: Solo eliminar del estado local
          setPagosEfectivoLocal((prev) => prev.filter((p) => p._id !== pagoId));
          console.log("Pago en efectivo eliminado del estado local:", pagoId);
        }
      }
    }
  };

  const handleCopy = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopied(uuid);
    setTimeout(() => setCopied(null), 1500);
  };

  // Calcular el total considerando pagos temporales, reales y pagos en efectivo
  const totalPagar =
    facturasLocal.reduce((sum, f) => {
      let importePagadoCalculado = f.importePagado;

      // Si hay pagos temporales para esta factura, calcular el importe total
      if (tempPayments && tempPayments[f._id]) {
        const tempPayment = tempPayments[f._id];
        if (tempPayment.tipoPago === "completo") {
          importePagadoCalculado = f.importeAPagar;
        } else if (tempPayment.tipoPago === "parcial" && tempPayment.monto) {
          importePagadoCalculado =
            tempPayment.originalImportePagado + tempPayment.monto;
        }
      }

      return sum + importePagadoCalculado;
    }, 0) +
    (pagosEfectivoLocal.reduce(
      (sum, payment) => sum + payment.importeAPagar,
      0
    ) || 0);

  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;

    if (typeof value === "object" && value !== null) {
      if (value.$numberDecimal) {
        return parseFloat(value.$numberDecimal) || 0;
      }
      if (value._bsontype === "Decimal128") {
        return parseFloat(value.toString()) || 0;
      }
    }

    return 0;
  };

  // Función para calcular totales de facturas (igual que en el detalle del paquete)
  const calcularTotalesFacturas = () => {
    if (!facturasLocal || facturasLocal.length === 0)
      return { total: 0, pagado: 0, pendiente: 0, cantidad: 0 };

    const total = facturasLocal.reduce(
      (sum, f) => sum + toNumber(f.importeAPagar),
      0
    );
    const pagado = facturasLocal.reduce((sum, f) => {
      let importePagadoCalculado = f.importePagado;
      if (tempPayments && tempPayments[f._id]) {
        const tempPayment = tempPayments[f._id];
        if (tempPayment.tipoPago === "completo") {
          importePagadoCalculado = f.importeAPagar;
        } else if (tempPayment.tipoPago === "parcial" && tempPayment.monto) {
          importePagadoCalculado =
            tempPayment.originalImportePagado + tempPayment.monto;
        }
      }
      return sum + importePagadoCalculado;
    }, 0);
    const pendiente = total - pagado;

    return {
      total,
      pagado,
      pendiente,
      cantidad: facturasLocal.length,
    };
  };

  // Función para calcular totales de pagos en efectivo (igual que en el detalle del paquete)
  const calcularTotalesPagosEfectivo = () => {
    if (!pagosEfectivoLocal || pagosEfectivoLocal.length === 0)
      return { total: 0, pagado: 0, pendiente: 0, cantidad: 0 };

    const total = pagosEfectivoLocal.reduce(
      (sum, p) => sum + toNumber(p.importeAPagar),
      0
    );
    // Para pagos temporales, el importe pagado es igual al importe a pagar (se pagan completos)
    const pagado = pagosEfectivoLocal.reduce(
      (sum, p) => sum + toNumber(p.importeAPagar),
      0
    );
    const pendiente = total - pagado;

    return {
      total,
      pagado,
      pendiente,
      cantidad: pagosEfectivoLocal.length,
    };
  };

  const handleGuardar = async () => {
    if (isSubmitting) return; // Prevenir múltiples ejecuciones

    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error("No hay usuario logueado");
        return;
      }
      if (!user._id || !user.departmentId || !user.department) {
        toast.error("Faltan datos del usuario o departamento.");
        return;
      }
      if (!fechaPago) {
        toast.error("La fecha de pago es obligatoria.");
        return;
      }

      // PASO 1: Procesar pagos temporales (PUT actualizar facturas)
      if (tempPayments && Object.keys(tempPayments).length > 0) {
        const paymentsToProcess = Object.entries(tempPayments).map(
          ([invoiceId, payment]) => ({
            invoiceId,
            ...payment,
          })
        );

        // Procesar cada pago temporal
        for (const payment of paymentsToProcess) {
          if (payment.tipoPago === "completo") {
            await markInvoiceAsFullyPaid(
              payment.invoiceId,
              payment.descripcion
            );
          } else if (payment.tipoPago === "parcial" && payment.monto) {
            await markInvoiceAsPartiallyPaid(
              payment.invoiceId,
              payment.descripcion,
              payment.monto
            );
          }
        }
      }

      // PASO 1.5: Procesar eliminaciones diferidas si hay paquete existente
      if (paqueteExistente && paqueteExistente._id) {
        // Eliminar facturas marcadas para eliminación
        for (const facturaId of facturasToRemove) {
          try {
            await removeInvoiceFromPackage(paqueteExistente._id, facturaId);
            console.log("Factura eliminada del backend (diferida):", facturaId);
          } catch (error: any) {
            console.error("Error al eliminar factura diferida:", error);
            // Si el error es 404 (no encontrada), puede ser que ya fue eliminada - continuar
            if (!error.message?.includes("no encontrada")) {
              console.error("Error inesperado:", error);
            }
          }
        }

        // Eliminar pagos en efectivo marcados para eliminación
        for (const cashPaymentId of cashPaymentsToRemove) {
          try {
            await removeCashPaymentFromPackage(
              paqueteExistente._id,
              cashPaymentId
            );
            console.log(
              "Pago en efectivo eliminado del backend (diferido):",
              cashPaymentId
            );
          } catch (error: any) {
            console.error(
              "Error al eliminar pago en efectivo diferido:",
              error
            );
            // Si el error es 404 (no encontrado), puede ser que ya fue eliminado - continuar
            if (!error.message?.includes("no encontrado")) {
              console.error("Error inesperado:", error);
            }
          }
        }

        // Limpiar las listas de eliminaciones después de procesarlas
        setFacturasToRemove([]);
        setCashPaymentsToRemove([]);
      }

      // PASO 2: Crear o actualizar paquete de facturas (POST)
      // Usar la fecha seleccionada por el usuario
      const fechaPagoParaGuardar = fechaPago;

      // Preparar conceptos de gasto para cada factura
      const conceptosGasto: { [invoiceId: string]: string } = {};
      facturasLocal.forEach((factura) => {
        if (
          tempPayments &&
          tempPayments[factura._id] &&
          tempPayments[factura._id].conceptoGasto
        ) {
          conceptosGasto[factura._id] =
            tempPayments[factura._id].conceptoGasto!;
        }
      });

      // Preparar pagos en efectivo para enviar
      const pagosEfectivoParaEnviar = pagosEfectivoLocal.map((p) => {
        if (!p._id || p._id.startsWith("temp_")) {
          // Es un pago temporal, no enviar el _id
          return {
            importeAPagar: p.importeAPagar,
            expenseConcept: p.expenseConcept,
            description: p.description,
            createdAt: p.createdAt,
          };
        }
        // Es un pago ya existente
        return p;
      });

      const dataToSend = {
        facturas: facturasLocal.map((f) => f._id),
        pagosEfectivo: pagosEfectivoParaEnviar,
        usuario_id: user._id,
        departamento_id: user.departmentId,
        departamento: user.department,
        comentario,
        fechaPago: fechaPagoParaGuardar,
        companyId: selectedCompanyId,
        brandId: selectedBrandId,
        branchId: selectedBranchId,
        conceptosGasto,
      };

      let packpageId: string | undefined = undefined;
      if (isNewPackage) {
        const response = await createInvoicesPackage(dataToSend);
        packpageId = response?.data?._id;
      } else if (paqueteExistente) {
        // Verificar si hay nuevas facturas o pagos en efectivo para agregar
        const facturasOriginales = paqueteExistente.facturas.map(
          (f: any) => f._id
        );
        const facturasActuales = facturasLocal.map((f) => f._id);
        const nuevasFacturas = facturasActuales.filter(
          (id) => !facturasOriginales.includes(id)
        );

        const pagosOriginales =
          paqueteExistente.pagosEfectivo?.map((p: any) => p._id) || [];
        const nuevosPagos = pagosEfectivoParaEnviar.filter(
          (p) =>
            !p._id ||
            p._id.startsWith("temp_") ||
            !pagosOriginales.includes(p._id)
        );

        // Solo llamar updateInvoicesPackage si hay nuevos elementos o cambios en metadatos
        const hayNuevasFacturas = nuevasFacturas.length > 0;
        const hayNuevosPagos = nuevosPagos.length > 0;
        const hayNuevosPagosTemporales = pagosEfectivoParaEnviar.some(
          (p) => !p._id || p._id.startsWith("temp_")
        );
        const hayCambiosMetadatos =
          comentario !== paqueteExistente.comentario ||
          fechaPagoParaGuardar !== paqueteExistente.fechaPago ||
          (tempPayments && Object.keys(tempPayments).length > 0);

        if (
          hayNuevasFacturas ||
          hayNuevosPagos ||
          hayNuevosPagosTemporales ||
          hayCambiosMetadatos
        ) {
          const updateData: any = {
            comentario,
            fechaPago: fechaPagoParaGuardar,
            companyId: selectedCompanyId,
            brandId: selectedBrandId,
            branchId: selectedBranchId,
          };

          // Solo enviar facturas si hay nuevas facturas
          if (hayNuevasFacturas) {
            updateData.facturas = nuevasFacturas;
            updateData.conceptosGasto = conceptosGasto;
          }

          // Solo enviar pagos en efectivo si hay nuevos pagos
          if (hayNuevosPagos || hayNuevosPagosTemporales) {
            updateData.pagosEfectivo = nuevosPagos;
          }

          const response = await updateInvoicesPackage(
            paqueteExistente._id,
            updateData
          );
          packpageId = response?.data?._id;
        } else {
          // Solo hubo eliminaciones, no es necesario llamar updateInvoicesPackage
          packpageId = paqueteExistente._id;
          console.log(
            "Solo se procesaron eliminaciones, no se requiere actualización del paquete"
          );
        }
      }

      // PASO 3: La relación InvoicesPackageCompany se crea automáticamente en el backend
      // cuando se proporcionan companyId, brandId, branchId en el paso 2

      toast.success("Paquete guardado correctamente");
      onClose();
      if (onSuccess) onSuccess(packpageId);
    } catch (error) {
      console.error("Error al guardar el paquete:", error);
      toast.error("Error al guardar el paquete");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onCancel || onClose}
      size="xl"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>
          {paqueteExistente
            ? `Editar Paquete de Facturas - Folio: ${paqueteExistente.folio}`
            : `Enviar facturas a Pago${
                razonSocialName ? ` de ${razonSocialName}` : ""
              } (Nuevo Paquete)`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Fecha Pago:</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaPago}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setFechaPago(selectedDate);
                  }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Escriba su comentario</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex flex-column align-items-end">
              <Form.Label>Total a Pagar:</Form.Label>
              <Form.Control
                type="text"
                value={totalPagar.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
                readOnly
                className="fw-bold text-end"
              />
            </Col>
          </Row>

          {/* Tabs de facturas y pagos en efectivo */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <a
                href="#facturas"
                className={`nav-link${
                  activeTab === "facturas" ? " active" : ""
                }`}
                onClick={() => setActiveTab("facturas")}
              >
                Facturas ({calcularTotalesFacturas().cantidad})
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#pagosEfectivo"
                className={`nav-link${
                  activeTab === "pagosEfectivo" ? " active" : ""
                }`}
                onClick={() => setActiveTab("pagosEfectivo")}
              >
                Pagos en efectivo ({calcularTotalesPagosEfectivo().cantidad})
              </a>
            </li>
          </ul>

          <div className="tab-content">
            <div
              className={`tab-pane${
                activeTab === "facturas" ? " show active" : ""
              }`}
              id="facturas"
            >
              <div className="table-responsive">
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>#</th>
                      <th>Estado</th>
                      <th>Proveedor</th>
                      <th>Folio</th>
                      <th>F. Emisión</th>
                      <th>Info</th>
                      <th>Emisor RFC</th>
                      <th>Estatus</th>
                      <th>Fecha Cancelación</th>
                      <th>Saldo</th>
                      <th>Importe A Pagar </th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasLocal.map((f, idx) => {
                      // Calcular importe pagado considerando pagos temporales
                      let importePagadoCalculado = f.importePagado;
                      let saldoCalculado = f.importeAPagar - f.importePagado;

                      // Si hay pagos temporales para esta factura, calcular el importe total
                      if (tempPayments && tempPayments[f._id]) {
                        const tempPayment = tempPayments[f._id];
                        if (tempPayment.tipoPago === "completo") {
                          importePagadoCalculado = f.importeAPagar;
                          saldoCalculado = 0;
                        } else if (
                          tempPayment.tipoPago === "parcial" &&
                          tempPayment.monto
                        ) {
                          importePagadoCalculado =
                            tempPayment.originalImportePagado +
                            tempPayment.monto;
                          saldoCalculado =
                            f.importeAPagar - importePagadoCalculado;
                        }
                      }

                      const estatus =
                        f.estatus === "1"
                          ? { text: "Vigente", variant: "success" }
                          : { text: "Cancelado", variant: "danger" };
                      return (
                        <tr
                          key={f._id}
                          className={
                            idx % 2 === 1 ? "bg-pink bg-opacity-25" : ""
                          }
                        >
                          <td>{idx + 1}</td>
                          {/* Estado de guardado */}
                          <td>
                            {f.completamentePagada ? (
                              <div className="d-flex flex-column gap-1">
                                {f.estaRegistrada ? (
                                  f.autorizada ? (
                                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                      <i className="bi bi-shield-check me-1"></i>
                                      Autorizada
                                    </span>
                                  ) : (
                                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                      <i className="bi bi-clock me-1"></i>
                                      Procesada
                                    </span>
                                  )
                                ) : (
                                  <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Completamente Pagada
                                  </span>
                                )}
                              </div>
                            ) : f.importePagado > 0 ? (
                              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                <i className="bi bi-clock me-1"></i>
                                Pago Parcial:{" "}
                                {Math.round(
                                  (f.importePagado / f.importeAPagar) * 100
                                )}
                                %
                              </span>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">
                                <i className="bi bi-plus-circle me-1"></i>
                                Nueva
                              </span>
                            )}
                          </td>
                          {/* Proveedor */}
                          <td>
                            <div>
                              <strong>{f.nombreEmisor}</strong>
                              <br />
                              <small className="text-muted">
                                {f.rfcEmisor}
                              </small>
                            </div>
                          </td>
                          {/* Folio */}
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              className="d-flex align-items-center fw-bold text-white"
                              onClick={() => handleCopy(f.uuid)}
                            >
                              <BsClipboard className="me-1" />
                              {copied === f.uuid ? "Copiado" : "COPIAR"}
                            </Button>
                          </td>
                          {/* Fecha Emisión */}
                          <td>
                            {f.fechaEmision
                              ? new Date(f.fechaEmision).toLocaleDateString(
                                  "es-MX"
                                )
                              : ""}
                          </td>
                          {/* Info */}
                          <td>
                            <span className="badge fs-6 bg-warning bg-opacity-10 text-warning">
                              PPD
                            </span>
                          </td>
                          {/* Emisor RFC */}
                          <td>{f.rfcEmisor}</td>
                          {/* Estatus */}
                          <td>
                            <span
                              className={`badge fs-6 ${
                                estatus.text === "Vigente"
                                  ? "bg-success bg-opacity-10 text-success"
                                  : "bg-danger bg-opacity-10 text-danger"
                              }`}
                            >
                              {estatus.text}
                            </span>
                          </td>
                          {/* Fecha Cancelación */}
                          <td>
                            {f.fechaCancelacion
                              ? new Date(f.fechaCancelacion).toLocaleDateString(
                                  "es-MX"
                                )
                              : ""}
                          </td>
                          {/* Saldo */}
                          <td>
                            <span
                              className={
                                saldoCalculado > 0
                                  ? "text-warning"
                                  : "text-success"
                              }
                            >
                              {saldoCalculado.toLocaleString("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              })}
                            </span>
                          </td>
                          {/* Importe Pagado */}
                          <td>
                            <span
                              className={
                                importePagadoCalculado > 0
                                  ? "text-success"
                                  : "text-muted"
                              }
                            >
                              {importePagadoCalculado.toLocaleString("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              })}
                            </span>
                            {tempPayments && tempPayments[f._id] && (
                              <small className="text-warning d-block">
                                <i className="bi bi-clock me-1"></i>
                                Temporal
                              </small>
                            )}
                          </td>
                          {/* Acciones */}
                          <td className="text-center align-middle">
                            {(() => {
                              const isTemporary =
                                tempPayments && tempPayments[f._id];
                              const canRemove =
                                isTemporary || canRemovePayment(false);

                              return canRemove ? (
                                <button
                                  className="btn btn-light btn-icon btn-sm rounded-circle"
                                  onClick={() => handleRemoveFactura(f._id)}
                                  title={
                                    isTemporary
                                      ? "Eliminar pago temporal"
                                      : "Eliminar pago"
                                  }
                                  type="button"
                                  tabIndex={0}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              ) : (
                                <button
                                  className="btn btn-light btn-icon btn-sm rounded-circle"
                                  disabled
                                  title="No se puede eliminar este pago"
                                  type="button"
                                  tabIndex={-1}
                                  style={{ opacity: 0.3 }}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="fw-bold text-left">
                      <td className="text-end" colSpan={9}>
                        Total a pagar
                      </td>
                      <td className="text-end">
                        {calcularTotalesFacturas().pendiente.toLocaleString(
                          "es-MX",
                          { style: "currency", currency: "MXN" }
                        )}
                      </td>
                      <td className="text-end">
                        {calcularTotalesFacturas().pagado.toLocaleString(
                          "es-MX",
                          { style: "currency", currency: "MXN" }
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
            <div
              className={`tab-pane${
                activeTab === "pagosEfectivo" ? " show active" : ""
              }`}
              id="pagosEfectivo"
            >
              <div className="table-responsive">
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>#</th>
                      <th>Concepto de Gasto</th>
                      <th>Descripción</th>
                      <th>Estatus</th>
                      <th>Importe a Pagar</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosEfectivoLocal.map((pago, idx) => (
                      <tr
                        key={pago._id}
                        className={idx % 2 === 1 ? "bg-pink bg-opacity-25" : ""}
                      >
                        <td>{idx + 1}</td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <strong>{pago.expenseConcept.name}</strong>
                            {pago.expenseConcept.categoryId && (
                              <small className="text-muted">
                                {pago.expenseConcept.categoryId.name}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          {pago.description || (
                            <span className="text-muted">Sin descripción</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                            <i className="bi bi-check-circle me-1"></i>
                            Vigente
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            {pago.importeAPagar.toLocaleString("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            })}
                          </span>
                        </td>
                        <td className="text-center align-middle">
                          {(() => {
                            const isTemporary =
                              tempCashPayments &&
                              tempCashPayments.some((p) => p._id === pago._id);
                            const canRemove =
                              isTemporary || canRemovePayment(false);

                            return canRemove ? (
                              <button
                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                onClick={() =>
                                  handleRemoveCashPayment(pago._id)
                                }
                                title={
                                  isTemporary
                                    ? "Eliminar pago temporal"
                                    : "Eliminar pago"
                                }
                                type="button"
                                tabIndex={0}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                disabled
                                title="No se puede eliminar este pago"
                                type="button"
                                tabIndex={-1}
                                style={{ opacity: 0.3 }}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                    <tr className="fw-bold text-left">
                      <td className="text-end" colSpan={4}>
                        Total a pagar
                      </td>
                      <td className="text-end">
                        {calcularTotalesPagosEfectivo().total.toLocaleString(
                          "es-MX",
                          { style: "currency", currency: "MXN" }
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="light"
          onClick={onCancel || onClose}
          disabled={isSubmitting}
        >
          Cerrar
        </Button>
        <Button
          variant="primary"
          onClick={handleGuardar}
          disabled={
            (facturasLocal.length === 0 &&
              (!tempCashPayments || tempCashPayments.length === 0) &&
              pagosEfectivoLocal.length === 0 &&
              facturasToRemove.length === 0 &&
              cashPaymentsToRemove.length === 0) ||
            isSubmitting
          }
          title={
            facturasLocal.length === 0 &&
            (!tempCashPayments || tempCashPayments.length === 0) &&
            pagosEfectivoLocal.length === 0 &&
            facturasToRemove.length === 0 &&
            cashPaymentsToRemove.length === 0
              ? "No hay cambios para guardar"
              : isSubmitting
              ? "Procesando..."
              : ""
          }
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Procesando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnviarPagoModal;

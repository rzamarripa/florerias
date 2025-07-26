import React from "react";
import { FileText, Calendar, PieChart, Info } from "lucide-react";
import BudgetStatisticCard from "./BudgetStatisticCard";
import { BudgetItem } from "../services/budget";

interface BudgetSummaryCardsProps {
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
  invoices?: any[];
  budgetData?: BudgetItem[];
  // Nuevos props para calcular presupuesto utilizado por mes
  existingPackages?: any[];
  selectedYear?: number;
  selectedMonth?: number;
}

const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({
  tempPayments = {},
  invoices = [],
  budgetData = [],
  existingPackages = [],
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth(),
}) => {
  // Card azul: Facturas en paquetes (sin filtrar por mes) + temporales, usando solo datos de invoices
  const selectedPaymentsSummary = React.useMemo(() => {
    let totalPagado = 0;
    let facturasSeleccionadas = 0;
    const facturasEnPaquetesSet = new Set<string>();

    // 1. Obtener todos los IDs de facturas en todos los paquetes
    existingPackages.forEach((paquete) => {
      if (paquete.facturas && Array.isArray(paquete.facturas)) {
        paquete.facturas.forEach((factura: any) => {
          if (factura._id) {
            facturasEnPaquetesSet.add(factura._id);
          }
        });
      }
    });

    // 2. Sumar facturas del array original que estén en algún paquete y tengan importePagado > 0
    invoices.forEach((inv) => {
      if (facturasEnPaquetesSet.has(inv._id) && inv.importePagado > 0) {
        totalPagado += inv.importePagado;
        facturasSeleccionadas += 1;
      }
    });

    // 3. Sumar pagos temporales (aunque no estén en paquetes)
    Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
      // Evitar duplicar si ya está en paquete
      if (!facturasEnPaquetesSet.has(invoiceId)) {
        if (payment.tipoPago === "completo") {
          const invoice = invoices.find((inv) => inv._id === invoiceId);
          if (invoice) {
            totalPagado += invoice.importeAPagar;
            facturasSeleccionadas += 1;
          }
        } else if (payment.tipoPago === "parcial" && payment.monto) {
          totalPagado += payment.monto;
          facturasSeleccionadas += 1;
        }
      }
    });

    return {
      totalPagado,
      facturasSeleccionadas,
    };
  }, [tempPayments, invoices, existingPackages]);

  // Calcular total del presupuesto
  const totalBudget = React.useMemo(() => {
    if (!Array.isArray(budgetData)) {
      return 0;
    }

    return budgetData.reduce((acc, budget) => {
      return acc + (budget.assignedAmount || 0);
    }, 0);
  }, [budgetData]);

  // Calcular presupuesto utilizado (suma de importePagado de facturas guardadas + pagos en efectivo + pagos temporales)
  const presupuestoUtilizado = React.useMemo(() => {
    let totalUtilizado = 0;

    // 1. Filtrar paquetes del mes específico del presupuesto
    const paquetesDelMes = existingPackages.filter((paquete) => {
      if (!paquete.fechaPago) return false;

      const fechaPago = new Date(paquete.fechaPago);
      const yearPaquete = fechaPago.getFullYear();
      const monthPaquete = fechaPago.getMonth();

      return yearPaquete === selectedYear && monthPaquete === selectedMonth;
    });

    // 2. Sumar el importePagado de todas las facturas en paquetes del mes
    paquetesDelMes.forEach((paquete) => {
      if (paquete.facturas && Array.isArray(paquete.facturas)) {
        paquete.facturas.forEach((factura: any) => {
          if (factura.importePagado > 0) {
            totalUtilizado += factura.importePagado;
          }
        });
      }
    });

    // 3. Sumar pagos en efectivo de paquetes del mes
    paquetesDelMes.forEach((paquete) => {
      if (paquete.pagosEfectivo && Array.isArray(paquete.pagosEfectivo)) {
        paquete.pagosEfectivo.forEach((pagoEfectivo: any) => {
          if (pagoEfectivo.importeAPagar > 0) {
            totalUtilizado += pagoEfectivo.importeAPagar;
          }
        });
      }
    });

    // 4. Sumar pagos temporales locales (solo si estamos viendo el mes actual)
    const mesActual = new Date().getMonth();
    const yearActual = new Date().getFullYear();

    // Solo incluir pagos temporales si estamos viendo el mes actual
    if (selectedYear === yearActual && selectedMonth === mesActual) {
      Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
        const invoice = invoices.find((inv) => inv._id === invoiceId);
        if (!invoice) return;

        if (payment.tipoPago === "completo") {
          // Para pago completo, agregar solo la diferencia no pagada
          const montoPendiente = invoice.importeAPagar - invoice.importePagado;
          totalUtilizado += Math.max(0, montoPendiente);
        } else if (payment.tipoPago === "parcial" && payment.monto) {
          // Para pago parcial, agregar solo el monto adicional
          totalUtilizado += payment.monto;
        }
      });
    }

    return totalUtilizado;
  }, [existingPackages, tempPayments, invoices, selectedYear, selectedMonth]);

  // Calcular saldo
  const saldoPresupuesto = React.useMemo(() => {
    const saldo = totalBudget - presupuestoUtilizado;

    return {
      monto: saldo,
      esAFavor: saldo >= 0,
      titulo: saldo >= 0 ? "Saldo a favor" : "Saldo en contra",
      subtitle: "Diferencia presupuestal",
    };
  }, [totalBudget, presupuestoUtilizado]);

  return (
    <div className="d-flex gap-3 mb-2 w-100 align-items-stretch">
      <div className="flex-fill" style={{ minWidth: 0 }}>
        <BudgetStatisticCard
          title={`${selectedPaymentsSummary.facturasSeleccionadas} Facturas pagadas`}
          subtitle="Pagos realizados y seleccionados"
          stats={`$${selectedPaymentsSummary.totalPagado.toLocaleString(
            "es-MX",
            { minimumFractionDigits: 2 }
          )}`}
          icon={<FileText size={16} />}
          variant="info"
        />
      </div>
      <div className="flex-fill" style={{ minWidth: 0 }}>
        <BudgetStatisticCard
          title="Presupuesto del mes"
          subtitle="Asignado para gastos"
          stats={`$${totalBudget.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}`}
          icon={<Calendar size={16} />}
          variant="primary"
        />
      </div>
      <div className="flex-fill" style={{ minWidth: 0 }}>
        <BudgetStatisticCard
          title="Presupuesto utilizado"
          subtitle="Importe pagado + pagos seleccionados"
          stats={`$${presupuestoUtilizado.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}`}
          icon={<PieChart size={16} />}
          variant="warning"
        />
      </div>
      <div className="flex-fill" style={{ minWidth: 0 }}>
        <BudgetStatisticCard
          title={saldoPresupuesto.titulo}
          subtitle={saldoPresupuesto.subtitle}
          stats={`${saldoPresupuesto.esAFavor ? "+" : ""}$${Math.abs(
            saldoPresupuesto.monto
          ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
          icon={<Info size={16} />}
          variant="secondary"
        />
      </div>
    </div>
  );
};

export default BudgetSummaryCards;

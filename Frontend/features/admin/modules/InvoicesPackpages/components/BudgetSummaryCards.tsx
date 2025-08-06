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
  const selectedPaymentsSummary = React.useMemo(() => {
    let totalPagado = 0;
    let facturasSeleccionadas = 0;

    invoices.forEach((inv) => {
      const fechaEmision = new Date(inv.fechaEmision);
      const yearFactura = fechaEmision.getFullYear();
      const monthFactura = fechaEmision.getMonth();

      if (yearFactura === selectedYear && monthFactura === selectedMonth) {
        const isInPackage = existingPackages.some((paquete) =>
          paquete.facturas?.some((factura: any) => factura._id === inv._id)
        );
        const hasTempPayment = tempPayments[inv._id];
        const isProcessed = inv.estaRegistrada && inv.autorizada !== false;
        const isAuthorized = inv.estaRegistrada && inv.autorizada === true;

        if (
          (isInPackage || isProcessed || isAuthorized || hasTempPayment) &&
          inv.importePagado > 0
        ) {
          totalPagado += inv.importePagado;
          facturasSeleccionadas += 1;
        }
      }
    });

    Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
      const invoice = invoices.find((inv) => inv._id === invoiceId);
      if (invoice) {
        const fechaEmision = new Date(invoice.fechaEmision);
        const yearFactura = fechaEmision.getFullYear();
        const monthFactura = fechaEmision.getMonth();

        if (yearFactura === selectedYear && monthFactura === selectedMonth) {
          const isInPackage = existingPackages.some((paquete) =>
            paquete.facturas?.some((factura: any) => factura._id === invoiceId)
          );

          if (!isInPackage) {
            if (payment.tipoPago === "completo") {
              totalPagado += invoice.importeAPagar;
              facturasSeleccionadas += 1;
            } else if (payment.tipoPago === "parcial" && payment.monto) {
              totalPagado += payment.monto;
              facturasSeleccionadas += 1;
            }
          }
        }
      }
    });

    return {
      totalPagado,
      facturasSeleccionadas,
    };
  }, [tempPayments, invoices, existingPackages, selectedYear, selectedMonth]);

  const totalBudget = React.useMemo(() => {
    if (!Array.isArray(budgetData)) {
      return 0;
    }

    return budgetData.reduce((acc, budget) => {
      return acc + (budget.assignedAmount || 0);
    }, 0);
  }, [budgetData]);

  const presupuestoUtilizado = React.useMemo(() => {
    let totalUtilizado = 0;

    const paquetesDelMes = existingPackages.filter((paquete) => {
      if (!paquete.fechaPago) return false;

      const fechaPago = new Date(paquete.fechaPago);
      const yearPaquete = fechaPago.getFullYear();
      const monthPaquete = fechaPago.getMonth();

      return yearPaquete === selectedYear && monthPaquete === selectedMonth;
    });

    paquetesDelMes.forEach((paquete) => {
      if (paquete.facturas && Array.isArray(paquete.facturas)) {
        paquete.facturas.forEach((factura: any) => {
          if (factura.importePagado > 0) {
            totalUtilizado += factura.importePagado;
          }
        });
      }
    });

    paquetesDelMes.forEach((paquete) => {
      if (paquete.pagosEfectivo && Array.isArray(paquete.pagosEfectivo)) {
        paquete.pagosEfectivo.forEach((pagoEfectivo: any) => {
          if (pagoEfectivo.importeAPagar > 0) {
            totalUtilizado += pagoEfectivo.importeAPagar;
          }
        });
      }
    });

    const mesActual = new Date().getMonth();
    const yearActual = new Date().getFullYear();

    if (selectedYear === yearActual && selectedMonth === mesActual) {
      Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
        const invoice = invoices.find((inv) => inv._id === invoiceId);
        if (!invoice) return;

        if (payment.tipoPago === "completo") {
          const montoPendiente = invoice.importeAPagar - invoice.importePagado;
          totalUtilizado += Math.max(0, montoPendiente);
        } else if (payment.tipoPago === "parcial" && payment.monto) {
          totalUtilizado += payment.monto;
        }
      });
    }

    return totalUtilizado;
  }, [existingPackages, tempPayments, invoices, selectedYear, selectedMonth]);

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

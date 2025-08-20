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
  invoices?: any[];
  budgetData?: BudgetItem[];
  existingPackages?: any[];
  selectedYear?: number;
  selectedMonth?: number;
  // Nueva prop para el presupuesto realmente utilizado
  realBudgetUsed?: number;
  // Fecha de pago seleccionada para facturas temporales
  selectedPaymentDate?: string;
}

const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({
  tempPayments = {},
  tempCashPayments = [],
  invoices = [],
  budgetData = [],
  existingPackages = [],
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth(),
  realBudgetUsed = 0,
  selectedPaymentDate,
}) => {
  const selectedPaymentsSummary = React.useMemo(() => {
    let totalPagado = 0;
    let facturasSeleccionadas = 0;
    let pagosEfectivoSeleccionados = 0;

    console.log(
      "🔍 BudgetSummaryCards - Calculando SOLO pagos temporales (por realizar):",
      {
        selectedYear,
        selectedMonth,
        tempPaymentsCount: Object.keys(tempPayments).length,
        tempCashPaymentsCount: tempCashPayments.length,
        invoicesCount: invoices.length,
        existingPackagesCount: existingPackages.length,
        note: "SOLO temporales - IGNORANDO paquetes existentes",
      }
    );

    // SOLO contar pagos temporales (los que estás agregando para crear el paquete)
    // NO contar pagos ya procesados o guardados

    console.log(
      "🔍 BudgetSummaryCards - Pagos en efectivo temporales disponibles:",
      tempCashPayments
    );

    // Procesar pagos temporales de facturas usando selectedPaymentDate
    Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
      const invoice = invoices.find((inv) => inv._id === invoiceId);
      if (invoice && selectedPaymentDate) {
        // Usar selectedPaymentDate para determinar si corresponde al mes seleccionado
        const fechaPago = new Date(selectedPaymentDate);
        const yearPago = fechaPago.getFullYear();
        const monthPago = fechaPago.getMonth();

        if (yearPago === selectedYear && monthPago === selectedMonth) {
          // NO verificar si está en paquete existente - solo contar temporales
          if (payment.tipoPago === "completo") {
            totalPagado += invoice.importeAPagar;
            facturasSeleccionadas += 1;
            console.log(
              "🔍 BudgetSummaryCards - Pago completo temporal agregado (usando fechaPago):",
              {
                invoiceId,
                amount: invoice.importeAPagar,
                selectedPaymentDate,
                yearPago,
                monthPago,
                totalPagado,
              }
            );
          } else if (payment.tipoPago === "parcial" && payment.monto) {
            totalPagado += payment.monto;
            facturasSeleccionadas += 1;
            console.log(
              "🔍 BudgetSummaryCards - Pago parcial temporal agregado (usando fechaPago):",
              {
                invoiceId,
                amount: payment.monto,
                selectedPaymentDate,
                yearPago,
                monthPago,
                totalPagado,
              }
            );
          }
        }
      }
    });

    // NO contar pagos de paquetes existentes - solo temporales

    // Procesar pagos en efectivo temporales usando selectedPaymentDate
    if (selectedPaymentDate) {
      const fechaPago = new Date(selectedPaymentDate);
      const yearPago = fechaPago.getFullYear();
      const monthPago = fechaPago.getMonth();

      if (yearPago === selectedYear && monthPago === selectedMonth) {
        tempCashPayments.forEach((pagoEfectivo) => {
          totalPagado += pagoEfectivo.importeAPagar;
          pagosEfectivoSeleccionados += 1;
          console.log(
            "🔍 BudgetSummaryCards - Pago en efectivo temporal agregado (usando fechaPago):",
            {
              pagoId: pagoEfectivo._id,
              amount: pagoEfectivo.importeAPagar,
              concept: pagoEfectivo.expenseConcept?.name,
              selectedPaymentDate,
              yearPago,
              monthPago,
              totalPagado,
            }
          );
        });
      }
    }

    const resultado = {
      totalPagado,
      facturasSeleccionadas,
      pagosEfectivoSeleccionados,
      totalElementos: facturasSeleccionadas + pagosEfectivoSeleccionados,
    };

    console.log(
      "🔍 BudgetSummaryCards - Resumen SOLO de pagos temporales (por realizar):",
      resultado
    );

    return resultado;
  }, [
    tempPayments,
    tempCashPayments,
    invoices,
    existingPackages,
    selectedYear,
    selectedMonth,
  ]);

  const totalBudget = React.useMemo(() => {
    if (!Array.isArray(budgetData)) {
      return 0;
    }

    return budgetData.reduce((acc, budget) => {
      return acc + (budget.assignedAmount || 0);
    }, 0);
  }, [budgetData]);

  // Presupuesto temporal (solo pagos por realizar)
  const presupuestoTemporal = React.useMemo(() => {
    return selectedPaymentsSummary.totalPagado;
  }, [selectedPaymentsSummary]);

  // Presupuesto realmente utilizado (incluye pagos ya procesados + temporales)
  const presupuestoUtilizado = React.useMemo(() => {
    return realBudgetUsed + presupuestoTemporal;
  }, [realBudgetUsed, presupuestoTemporal]);

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
          title={`${selectedPaymentsSummary.totalElementos} Pagos por Realizar`}
          subtitle={`${selectedPaymentsSummary.facturasSeleccionadas} facturas + ${selectedPaymentsSummary.pagosEfectivoSeleccionados} pagos en efectivo`}
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
          subtitle={<span>Pagos procesados y seleccionados</span>}
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

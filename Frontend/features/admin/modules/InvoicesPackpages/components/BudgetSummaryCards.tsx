import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { FileText, Calendar, PieChart, Info } from 'lucide-react';
import BudgetStatisticCard from './BudgetStatisticCard';
import { BudgetItem } from '../services/budget';

interface BudgetSummaryCardsProps {
    tempPayments?: {
        [invoiceId: string]: {
            tipoPago: 'completo' | 'parcial';
            descripcion: string;
            monto?: number;
            originalImportePagado: number;
            originalSaldo: number;
            conceptoGasto?: string;
        }
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
    selectedMonth = new Date().getMonth()
}) => {
    // Calcular resumen solo de pagos temporales locales
    const localPaymentsSummary = React.useMemo(() => {
        let totalTempPagado = 0;
        let facturasTempPagadas = 0;

        Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
            if (payment.tipoPago === 'completo') {
                // Buscar la factura original para obtener el importe a pagar
                const invoice = invoices.find(inv => inv._id === invoiceId);
                if (invoice) {
                    totalTempPagado += invoice.importeAPagar;
                    facturasTempPagadas += 1;
                }
            } else if (payment.tipoPago === 'parcial' && payment.monto) {
                totalTempPagado += payment.monto;
                // Contar todas las facturas con pagos parciales, sin importar si completan la factura
                facturasTempPagadas += 1;
            }
        });

        return {
            totalTempPagado,
            facturasTempPagadas
        };
    }, [tempPayments, invoices]);

    // Calcular total del presupuesto
    const totalBudget = React.useMemo(() => {
        if (!Array.isArray(budgetData)) {
            return 0;
        }

        return budgetData.reduce((acc, budget) => {
            return acc + (budget.assignedAmount || 0);
        }, 0);
    }, [budgetData]);

    // Calcular presupuesto utilizado (solo facturas pagadas del mes específico + pagos temporales)
    const presupuestoUtilizado = React.useMemo(() => {
        let totalUtilizado = 0;

        // 1. Filtrar paquetes del mes específico del presupuesto
        const paquetesDelMes = existingPackages.filter(paquete => {
            if (!paquete.fechaPago) return false;

            const fechaPago = new Date(paquete.fechaPago);
            const yearPaquete = fechaPago.getFullYear();
            const monthPaquete = fechaPago.getMonth(); // 0-based month

            return yearPaquete === selectedYear && monthPaquete === selectedMonth;
        });



        // 2. Sumar el gasto comprometido de paquetes del mes específico
        // Usamos totalImporteAPagar (todas las facturas) no totalPagado (solo autorizadas)
        const totalComprometidoDelMes = paquetesDelMes.reduce((acc, paquete) => {
            return acc + (paquete.totalImporteAPagar || 0);
        }, 0);

        // 3. Sumar pagos temporales locales (solo si estamos viendo el mes actual)
        let totalPagosTemporales = 0;
        const mesActual = new Date().getMonth();
        const yearActual = new Date().getFullYear();

        // Solo incluir pagos temporales si estamos viendo el mes actual
        if (selectedYear === yearActual && selectedMonth === mesActual) {
            Object.entries(tempPayments).forEach(([invoiceId, payment]) => {
                const invoice = invoices.find(inv => inv._id === invoiceId);
                if (!invoice) return;

                if (payment.tipoPago === 'completo') {
                    // Para pago completo, agregar solo la diferencia no pagada
                    const montoPendiente = invoice.importeAPagar - invoice.importePagado;
                    totalPagosTemporales += Math.max(0, montoPendiente);
                } else if (payment.tipoPago === 'parcial' && payment.monto) {
                    // Para pago parcial, agregar solo el monto adicional
                    totalPagosTemporales += payment.monto;
                }
            });
        }

        totalUtilizado = totalComprometidoDelMes + totalPagosTemporales;



        return totalUtilizado;
    }, [existingPackages, tempPayments, invoices, selectedYear, selectedMonth]);

    // Calcular saldo
    const saldoPresupuesto = React.useMemo(() => {
        const saldo = totalBudget - presupuestoUtilizado;

        return {
            monto: saldo,
            esAFavor: saldo >= 0,
            titulo: saldo >= 0 ? 'Saldo a favor' : 'Saldo en contra',
            subtitle: 'Diferencia presupuestal'
        };
    }, [totalBudget, presupuestoUtilizado]);

    return (
        <Row className="g-3">
            <Col md={3}>
                <BudgetStatisticCard
                    title={`${localPaymentsSummary.facturasTempPagadas} Facturas seleccionadas`}
                    subtitle="Seleccionadas para pago"
                    stats={`$${localPaymentsSummary.totalTempPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    icon={<FileText size={24} />}
                    variant="info"
                />
            </Col>
            <Col md={3}>
                <BudgetStatisticCard
                    title="Presupuesto del mes"
                    subtitle="Asignado para gastos"
                    stats={`$${totalBudget.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    icon={<Calendar size={24} />}
                    variant="primary"
                />
            </Col>
            <Col md={3}>
                <BudgetStatisticCard
                    title="Presupuesto utilizado"
                    subtitle="Gastado este mes"
                    stats={`$${presupuestoUtilizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    icon={<PieChart size={24} />}
                    variant="warning"
                />
            </Col>
            <Col md={3}>
                <BudgetStatisticCard
                    title={saldoPresupuesto.titulo}
                    subtitle={saldoPresupuesto.subtitle}
                    stats={`${saldoPresupuesto.esAFavor ? '+' : ''}$${Math.abs(saldoPresupuesto.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    icon={<Info size={24} />}
                    variant="secondary"
                />
            </Col>
        </Row>
    );
};

export default BudgetSummaryCards; 
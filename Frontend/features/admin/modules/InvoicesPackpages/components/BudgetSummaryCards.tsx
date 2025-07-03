import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { FileText, Calendar, PieChart, Info } from 'lucide-react';
import BudgetStatisticCard from './BudgetStatisticCard';

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
}

const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({ tempPayments = {}, invoices = [] }) => {
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
                    stats="$0"
                    icon={<Calendar size={24} />}
                    variant="primary"
                />
            </Col>
            <Col md={3}>
                <BudgetStatisticCard
                    title="Presupuesto utilizado"
                    subtitle="Gastado este mes"
                    stats="$0"
                    icon={<PieChart size={24} />}
                    variant="warning"
                />
            </Col>
            <Col md={3}>
                <BudgetStatisticCard
                    title="Sin presupuesto"
                    subtitle="No hay presupuesto asignado"
                    stats="$0"
                    icon={<Info size={24} />}
                    variant="secondary"
                />
            </Col>
        </Row>
    );
};

export default BudgetSummaryCards; 
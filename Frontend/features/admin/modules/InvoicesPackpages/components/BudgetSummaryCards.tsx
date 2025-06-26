import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { FileText, Calendar, PieChart, Info } from 'lucide-react';
import BudgetStatisticCard from './BudgetStatisticCard';

interface BudgetSummaryCardsProps {
    summary?: {
        facturasPagadas?: number;
        totalPagado?: number;
    };
}

const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({ summary }) => {
    return (
        <Row className="g-3">
            <Col md={3}>
                <BudgetStatisticCard
                    title={`${summary?.facturasPagadas ?? 0} Facturas pagadas`}
                    subtitle="Pagadas este periodo"
                    stats={`$${(summary?.totalPagado ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
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
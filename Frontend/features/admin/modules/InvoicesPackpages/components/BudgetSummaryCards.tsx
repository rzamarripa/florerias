import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { FileText, Calendar, PieChart, Info } from 'lucide-react';
import BudgetStatisticCard from './BudgetStatisticCard';

const BudgetSummaryCards: React.FC = () => {
    return (
        <Row className="g-3">
            <Col md={3}>
                <BudgetStatisticCard
                    title="0 Factura"
                    subtitle="Seleccionadas para pago"
                    stats="$0"
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
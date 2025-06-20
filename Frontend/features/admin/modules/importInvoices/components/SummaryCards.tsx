import React from 'react';
import { Card, Col, Row, Spinner } from 'react-bootstrap';
import { FileText, Users, XCircle } from 'lucide-react';
import { SummaryData } from '../types';

interface SummaryCardsProps {
  summary: SummaryData | null;
  loading: boolean;
}

const SummaryCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <Card className={`bg-${color} bg-opacity-10 border-0`}>
    <Card.Body>
      <div className="d-flex align-items-center">
        <div className="flex-shrink-0">
          <div className={`avatar-sm rounded-circle bg-${color} bg-opacity-25 text-${color} d-flex align-items-center justify-content-center`}>
            {icon}
          </div>
        </div>
        <div className="flex-grow-1 ms-3">
          <p className={`text-muted fs-14 mb-1 text-${color}`}>{title}</p>
          <h3 className="mb-0">
            <span className="counter-value">{value.toLocaleString()}</span>
          </h3>
        </div>
      </div>
    </Card.Body>
  </Card>
);

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando resumen...</p>
      </div>
    );
  }

  if (!summary) {
    return null; // Don't render anything if there's no summary data
  }

  return (
    <Row>
      <Col md={4}>
        <SummaryCard title="Total de Facturas" value={summary.totalInvoices} icon={<FileText size={24} />} color="success" />
      </Col>
      <Col md={4}>
        <SummaryCard title="Facturas Canceladas" value={summary.cancelledInvoices} icon={<XCircle size={24} />} color="danger" />
      </Col>
      <Col md={4}>
        <SummaryCard title="Proveedores Únicos" value={summary.uniqueProviders} icon={<Users size={24} />} color="info" />
      </Col>
    </Row>
  );
};

export default SummaryCards; 
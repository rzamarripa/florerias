import React from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { FileText, Users, XCircle } from 'lucide-react';
import { SummaryData } from '../types';
import StatisticCard from './StatisticCard';

const SummaryCards: React.FC<{ summary: SummaryData | null; loading: boolean; }> = ({ summary, loading }) => {
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
        <StatisticCard
          title="Total de Facturas"
          stats={summary.totalFacturas}
          icon={<FileText size={24} />}
          variant="success"
        />
      </Col>
      <Col md={4}>
        <StatisticCard
          title="Facturas Canceladas"
          stats={summary.facturasCanceladas}
          icon={<XCircle size={24} />}
          variant="danger"
        />
      </Col>
      <Col md={4}>
        <StatisticCard
          title="Proveedores Únicos"
          stats={summary.proveedoresUnicos}
          icon={<Users size={24} />}
          variant="info"
        />
      </Col>
    </Row>
  );
};

export default SummaryCards; 
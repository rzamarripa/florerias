import React from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';
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
      <Col md={3}>
        <StatisticCard
          title="Total de Proveedores"
          stats={summary.totalProviders}
          icon={<Users size={24} />}
          variant="primary"
        />
      </Col>
      <Col md={3}>
        <StatisticCard
          title="Activos"
          stats={summary.activeProviders}
          icon={<Shield size={24} />}
          variant="danger"
        />
      </Col>
      <Col md={3}>
        <StatisticCard
          title="Desvirtuados"
          stats={summary.desvirtualizedProviders}
          icon={<CheckCircle size={24} />}
          variant="success"
        />
      </Col>
      <Col md={3}>
        <StatisticCard
          title="Definitivos"
          stats={summary.definitiveProviders}
          icon={<XCircle size={24} />}
          variant="warning"
        />
      </Col>
    </Row>
  );
};

export default SummaryCards;
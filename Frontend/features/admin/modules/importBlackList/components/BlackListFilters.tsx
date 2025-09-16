import React from 'react';
import { Card, Col, Form, Row } from 'react-bootstrap';

interface BlackListFiltersProps {
  rfc: string;
  nombre: string;
  situacion: string;
  onRfcChange: (value: string) => void;
  onNombreChange: (value: string) => void;
  onSituacionChange: (value: string) => void;
  onClearFilters: () => void;
}

const BlackListFilters: React.FC<BlackListFiltersProps> = ({
  rfc,
  nombre,
  situacion,
  onRfcChange,
  onNombreChange,
  onSituacionChange,
  onClearFilters,
}) => {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>RFC</Form.Label>
              <Form.Control
                type="text"
                placeholder="Buscar por RFC..."
                value={rfc}
                onChange={(e) => onRfcChange(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre..."
                value={nombre}
                onChange={(e) => onNombreChange(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Situación</Form.Label>
              <Form.Select
                value={situacion}
                onChange={(e) => onSituacionChange(e.target.value)}
              >
                <option value="">Todas las situaciones</option>
                <option value="Presunto">Presunto</option>
                <option value="Desvirtuado">Desvirtuado</option>
                <option value="Definitivo">Definitivo</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={onClearFilters}
            >
              Limpiar
            </button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default BlackListFilters;
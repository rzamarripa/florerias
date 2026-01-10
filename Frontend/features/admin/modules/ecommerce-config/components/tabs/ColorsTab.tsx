import React from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import type { EcommerceConfigColors } from '../../types';

interface ColorsTabProps {
  colors: EcommerceConfigColors;
  setColors: (colors: EcommerceConfigColors) => void;
  saving: boolean;
  onSave: () => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({
  colors,
  setColors,
  saving,
  onSave,
}) => {
  return (
    <div>
      <h5 className="mb-4">Personaliza los colores</h5>
      <Row className="g-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Color primario <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="color"
                value={colors.primary}
                onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                className="me-3"
                style={{ width: "60px", height: "40px" }}
              />
              <Form.Control
                type="text"
                value={colors.primary}
                onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Color secundario <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="color"
                value={colors.secondary}
                onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                className="me-3"
                style={{ width: "60px", height: "40px" }}
              />
              <Form.Control
                type="text"
                value={colors.secondary}
                onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Color de fondo <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="color"
                value={colors.background}
                onChange={(e) => setColors({ ...colors, background: e.target.value })}
                className="me-3"
                style={{ width: "60px", height: "40px" }}
              />
              <Form.Control
                type="text"
                value={colors.background}
                onChange={(e) => setColors({ ...colors, background: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Color de texto <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="color"
                value={colors.text}
                onChange={(e) => setColors({ ...colors, text: e.target.value })}
                className="me-3"
                style={{ width: "60px", height: "40px" }}
              />
              <Form.Control
                type="text"
                value={colors.text}
                onChange={(e) => setColors({ ...colors, text: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </Form.Group>
        </Col>
      </Row>
      <div className="d-flex justify-content-end mt-4">
        <Button 
          variant="primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default ColorsTab;
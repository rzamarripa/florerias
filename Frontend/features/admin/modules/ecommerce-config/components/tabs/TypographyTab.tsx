import React from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import type { EcommerceConfigTypography } from '../../types';

interface TypographyTabProps {
  typography: EcommerceConfigTypography;
  setTypography: (typography: EcommerceConfigTypography) => void;
  saving: boolean;
  onSave: () => void;
}

const TypographyTab: React.FC<TypographyTabProps> = ({
  typography,
  setTypography,
  saving,
  onSave,
}) => {
  return (
    <div>
      <h5 className="mb-4">Selecciona las tipografías</h5>
      <Row className="g-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Fuente para títulos <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={typography.titleFont}
              onChange={(e) => setTypography({ ...typography, titleFont: e.target.value })}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
              <option value="Lato">Lato</option>
            </Form.Select>
            <div className="mt-2 p-3 bg-light rounded">
              <h3 className="mb-0" style={{ fontFamily: typography.titleFont, fontSize: typography.titleSize }}>
                Título de ejemplo
              </h3>
            </div>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Fuente para textos <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={typography.textFont}
              onChange={(e) => setTypography({ ...typography, textFont: e.target.value })}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Noto Sans">Noto Sans</option>
              <option value="Work Sans">Work Sans</option>
            </Form.Select>
            <div className="mt-2 p-3 bg-light rounded">
              <p className="mb-0" style={{ fontFamily: typography.textFont, fontSize: typography.normalSize }}>
                Este es un texto de ejemplo para mostrar cómo se ve la tipografía seleccionada en párrafos normales.
              </p>
            </div>
          </Form.Group>
        </Col>
      </Row>
      
      <Row className="g-4 mt-3">
        <Col md={12}>
          <Form.Group>
            <Form.Label className="fw-medium">
              Tamaños de fuente <span className="text-danger">*</span>
            </Form.Label>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label className="small text-muted">Título principal</Form.Label>
                <Form.Range 
                  min="24" 
                  max="48" 
                  value={typography.titleSize}
                  onChange={(e) => setTypography({ ...typography, titleSize: Number(e.target.value) })}
                />
                <div className="text-center small text-muted">{typography.titleSize}px</div>
              </Col>
              <Col md={4}>
                <Form.Label className="small text-muted">Subtítulos</Form.Label>
                <Form.Range 
                  min="18" 
                  max="32" 
                  value={typography.subtitleSize}
                  onChange={(e) => setTypography({ ...typography, subtitleSize: Number(e.target.value) })}
                />
                <div className="text-center small text-muted">{typography.subtitleSize}px</div>
              </Col>
              <Col md={4}>
                <Form.Label className="small text-muted">Texto normal</Form.Label>
                <Form.Range 
                  min="12" 
                  max="20" 
                  value={typography.normalSize}
                  onChange={(e) => setTypography({ ...typography, normalSize: Number(e.target.value) })}
                />
                <div className="text-center small text-muted">{typography.normalSize}px</div>
              </Col>
            </Row>
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

export default TypographyTab;
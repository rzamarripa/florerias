import React from 'react';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';

interface TemplatesTabProps {
  selectedTemplate: 'classic' | 'modern' | 'minimalist' | 'elegant';
  setSelectedTemplate: (template: 'classic' | 'modern' | 'minimalist' | 'elegant') => void;
  saving: boolean;
  onSave: () => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  saving,
  onSave,
}) => {
  const templates: Array<{ key: 'classic' | 'modern' | 'minimalist' | 'elegant'; name: string }> = [
    { key: 'classic', name: 'Clásica' },
    { key: 'modern', name: 'Moderna' },
    { key: 'minimalist', name: 'Minimalista' },
    { key: 'elegant', name: 'Elegante' }
  ];

  return (
    <div>
      <h5 className="mb-4">Selecciona una plantilla</h5>
      <Row className="g-3">
        {templates.map((template) => (
          <Col key={template.key} xs={12} sm={6} lg={3}>
            <Card 
              className={`cursor-pointer hover-shadow ${selectedTemplate === template.key ? 'border-primary' : ''}`}
              onClick={() => setSelectedTemplate(template.key)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="text-center p-3">
                <div className="bg-light rounded mb-3" style={{ height: "150px" }}>
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <span className="text-muted">{template.name}</span>
                  </div>
                </div>
                <h6 className="mb-1">{template.name}</h6>
                {selectedTemplate === template.key && (
                  <span className="badge bg-primary">Seleccionada</span>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
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

export default TemplatesTab;
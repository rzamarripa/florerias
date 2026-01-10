import React from 'react';
import { Form, Row, Col, Button, Accordion } from 'react-bootstrap';
import { TbTag, TbPlus, TbTrash, TbCalendar } from 'react-icons/tb';

interface PromotionItem {
  name: string;
  text: string;
  expirationDate: string;
  order?: number;
}

interface PromotionsSectionProps {
  promotionsEnabled: boolean;
  setPromotionsEnabled: (value: boolean) => void;
  promotions: PromotionItem[];
  setPromotions: (promotions: PromotionItem[]) => void;
}

const PromotionsSection: React.FC<PromotionsSectionProps> = ({
  promotionsEnabled,
  setPromotionsEnabled,
  promotions,
  setPromotions,
}) => {
  const addPromotion = () => {
    if (promotions.length < 5) {
      setPromotions([
        ...promotions,
        { 
          name: '', 
          text: '', 
          expirationDate: '', 
          order: promotions.length 
        }
      ]);
    }
  };

  const removePromotion = (index: number) => {
    setPromotions(promotions.filter((_, i) => i !== index));
  };

  const updatePromotion = (index: number, field: keyof PromotionItem, value: string) => {
    const updated = [...promotions];
    updated[index] = { ...updated[index], [field]: value };
    setPromotions(updated);
  };

  return (
    <Accordion.Item eventKey="promotions" className="mb-3 border-0 shadow-sm rounded overflow-hidden">
      <Accordion.Header className="bg-light">
        <div className="d-flex align-items-center w-100">
          <TbTag size={20} className="text-warning me-2" />
          <span className="fw-semibold fs-6">Promociones</span>
          <Form.Check 
            type="switch"
            id="promotions-switch"
            checked={promotionsEnabled}
            onChange={(e) => setPromotionsEnabled(e.target.checked)}
            className="ms-auto me-2"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </Accordion.Header>
      <Accordion.Body className="bg-white">
        {promotionsEnabled ? (
          <div>
            {promotions.map((promotion, index) => (
              <div key={index} className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-secondary">Promoción {index + 1}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removePromotion(index)}
                  >
                    <TbTrash size={14} />
                  </Button>
                </div>
                <Row className="g-2">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-medium">Nombre de la promoción</Form.Label>
                      <Form.Control
                        size="sm"
                        type="text"
                        placeholder="2x1 en flores"
                        value={promotion.name}
                        onChange={(e) => updatePromotion(index, 'name', e.target.value)}
                        maxLength={50}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label className="small fw-medium">Descripción</Form.Label>
                      <Form.Control
                        size="sm"
                        as="textarea"
                        rows={2}
                        placeholder="Compra una docena y lleva dos docenas"
                        value={promotion.text}
                        onChange={(e) => updatePromotion(index, 'text', e.target.value)}
                        maxLength={200}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-medium">
                        <TbCalendar size={14} className="me-1" />
                        Fecha de expiración
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="date"
                        value={promotion.expirationDate}
                        onChange={(e) => updatePromotion(index, 'expirationDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            
            {promotions.length < 5 && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addPromotion}
                className="d-flex align-items-center"
              >
                <TbPlus size={16} className="me-1" />
                Agregar promoción
              </Button>
            )}
            
            <p className="text-muted small mt-2 mb-0">
              Máximo 5 promociones. Las promociones expiradas se ocultarán automáticamente.
            </p>
          </div>
        ) : (
          <p className="text-muted text-center my-3">Promociones deshabilitadas</p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default PromotionsSection;
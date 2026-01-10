import React from 'react';
import { Form, Row, Col, Nav, Accordion } from 'react-bootstrap';
import { TbTruck } from 'react-icons/tb';

interface DeliverySectionProps {
  pickupEnabled: boolean;
  setPickupEnabled: (value: boolean) => void;
  pickupTime: string;
  setPickupTime: (value: string) => void;
  pickupFrom: string;
  setPickupFrom: (value: string) => void;
  pickupTo: string;
  setPickupTo: (value: string) => void;
  deliveryEnabled: boolean;
  setDeliveryEnabled: (value: boolean) => void;
  deliveryTime: string;
  setDeliveryTime: (value: string) => void;
  deliveryFrom: string;
  setDeliveryFrom: (value: string) => void;
  deliveryTo: string;
  setDeliveryTo: (value: string) => void;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  pickupEnabled,
  setPickupEnabled,
  pickupTime,
  setPickupTime,
  pickupFrom,
  setPickupFrom,
  pickupTo,
  setPickupTo,
  deliveryEnabled,
  setDeliveryEnabled,
  deliveryTime,
  setDeliveryTime,
  deliveryFrom,
  setDeliveryFrom,
  deliveryTo,
  setDeliveryTo,
}) => {
  return (
    <Accordion.Item eventKey="delivery" className="mb-3 border-0 shadow-sm rounded overflow-hidden">
      <Accordion.Header className="bg-light">
        <div className="d-flex align-items-center w-100">
          <TbTruck size={20} className="text-success me-2" />
          <span className="fw-semibold fs-6">Opciones de Entrega</span>
        </div>
      </Accordion.Header>
      <Accordion.Body className="bg-white">
        <Nav variant="pills" className="mb-3">
          <Nav.Item className="me-2">
            <Nav.Link active className="py-1 px-3">Retirar</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="py-1 px-3">Delivery</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Retirar */}
        <div className="mb-3 pb-3 border-bottom">
          <Form.Check 
            type="switch"
            id="pickup-switch"
            label="Habilitar retiro en tienda"
            checked={pickupEnabled}
            onChange={(e) => setPickupEnabled(e.target.checked)}
            className="mb-2"
          />
          {pickupEnabled && (
            <Row className="g-2">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Tiempo de preparación</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="text" 
                    placeholder="30 minutos"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Disponible desde</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="time"
                    value={pickupFrom}
                    onChange={(e) => setPickupFrom(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Disponible hasta</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="time"
                    value={pickupTo}
                    onChange={(e) => setPickupTo(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </div>

        {/* Delivery */}
        <div>
          <Form.Check 
            type="switch"
            id="delivery-switch"
            label="Habilitar delivery"
            checked={deliveryEnabled}
            onChange={(e) => setDeliveryEnabled(e.target.checked)}
            className="mb-2"
          />
          {deliveryEnabled && (
            <Row className="g-2">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Tiempo de entrega</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="text" 
                    placeholder="45 minutos"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Disponible desde</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="time"
                    value={deliveryFrom}
                    onChange={(e) => setDeliveryFrom(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Disponible hasta</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="time"
                    value={deliveryTo}
                    onChange={(e) => setDeliveryTo(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default DeliverySection;
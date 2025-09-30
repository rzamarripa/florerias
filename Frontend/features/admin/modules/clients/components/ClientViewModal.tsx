"use client";

import React from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";
import { User, Calendar, Phone, CreditCard, Award, ShoppingBag } from "lucide-react";
import { Client } from "../types";

interface ClientViewModalProps {
  client: Client;
  show: boolean;
  onHide: () => void;
}

const ClientViewModal: React.FC<ClientViewModalProps> = ({
  client,
  show,
  onHide,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-primary">
          Información del Cliente
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        <div className="text-center mb-4">
          <div
            className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto mb-3"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              fontSize: "32px",
            }}
          >
            {client.name.charAt(0).toUpperCase()}
          </div>
          <h4 className="mb-1">{client.fullName}</h4>
          <Badge
            bg={client.status ? "success" : "danger"}
            className="fs-6 px-3 py-2"
          >
            {client.status ? "Cliente Activo" : "Cliente Inactivo"}
          </Badge>
        </div>

        <Row className="g-4">
          <Col md={6}>
            <div className="border rounded-3 p-3 h-100">
              <div className="d-flex align-items-center mb-3">
                <User className="text-primary me-2" size={20} />
                <h6 className="mb-0 fw-semibold">Información Personal</h6>
              </div>
              <div className="mb-2">
                <small className="text-muted">Nombre</small>
                <div className="fw-medium">{client.name}</div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Apellidos</small>
                <div className="fw-medium">{client.lastName}</div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Nombre Completo</small>
                <div className="fw-medium">{client.fullName}</div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="border rounded-3 p-3 h-100">
              <div className="d-flex align-items-center mb-3">
                <CreditCard className="text-primary me-2" size={20} />
                <h6 className="mb-0 fw-semibold">Información de Cliente</h6>
              </div>
              <div className="mb-2">
                <small className="text-muted">Número de Cliente</small>
                <div className="fw-medium">
                  <Badge bg="secondary" className="fs-6">
                    {client.clientNumber}
                  </Badge>
                </div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Teléfono</small>
                <div className="fw-medium d-flex align-items-center">
                  <Phone size={16} className="me-1" />
                  {client.phoneNumber}
                </div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-50">
              <div className="d-flex align-items-center mb-3">
                <Award className="text-warning me-2" size={20} />
                <h6 className="mb-0 fw-semibold">Programa de Puntos</h6>
              </div>
              <div className="text-center">
                <div className="display-6 fw-bold text-warning mb-1">
                  {client.points}
                </div>
                <small className="text-muted">Puntos Acumulados</small>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-50">
              <div className="d-flex align-items-center mb-3">
                <ShoppingBag className="text-info me-2" size={20} />
                <h6 className="mb-0 fw-semibold">Compras</h6>
              </div>
              <div className="text-center">
                <div className="display-6 fw-bold text-info mb-1">
                  {client.purchases.length}
                </div>
                <small className="text-muted">Compras Realizadas</small>
              </div>
            </div>
          </Col>

          <Col xs={12}>
            <div className="border rounded-3 p-3">
              <div className="d-flex align-items-center mb-3">
                <Calendar className="text-primary me-2" size={20} />
                <h6 className="mb-0 fw-semibold">Fechas Importantes</h6>
              </div>
              <Row>
                <Col md={6}>
                  <div className="mb-2">
                    <small className="text-muted">Fecha de Registro</small>
                    <div className="fw-medium">{formatDate(client.createdAt)}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-2">
                    <small className="text-muted">Última Actualización</small>
                    <div className="fw-medium">{formatDate(client.updatedAt)}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClientViewModal;
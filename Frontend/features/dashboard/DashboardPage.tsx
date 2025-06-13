"use client";

import { useUserSessionStore } from "@/stores";
import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
import { HiCheckCircle, HiCog, HiDocumentText, HiUsers } from "react-icons/hi2";

const DashboardPage = () => {
  const { user } = useUserSessionStore();

  return (
    <div className="min-vh-100 bg-light py-4">
      <Container fluid className="px-4">
        <Row className="g-4">
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="h5 fw-semibold text-dark mb-4">
                  Información del Usuario
                </h2>
                <div className="mb-4">
                  <Row className="g-4">
                    <Col sm={6}>
                      <div>
                        <label className="form-label fw-medium text-muted small">
                          Usuario
                        </label>
                        <p className="small text-dark mb-0">{user?.username}</p>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div>
                        <label className="form-label fw-medium text-muted small">
                          Rol
                        </label>
                        <div>
                          <Badge bg="primary" className="mt-1">
                            {user?.role?.name || "Sin rol asignado"}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div>
                        <label className="form-label fw-medium text-muted small">
                          Departamento
                        </label>
                        <p className="small text-dark mb-0">
                          {user?.department || "No especificado"}
                        </p>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div>
                        <label className="form-label fw-medium text-muted small">
                          Estado
                        </label>
                        <div>
                          <Badge
                            bg={user?.profile?.estatus ? "success" : "danger"}
                            className="mt-1"
                          >
                            {user?.profile?.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {user?.profile?.nombreCompleto && (
                    <Row className="mt-4">
                      <Col>
                        <div>
                          <label className="form-label fw-medium text-muted small">
                            Nombre Completo
                          </label>
                          <p className="small text-dark mb-0">
                            {user?.profile.nombreCompleto}
                          </p>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm mt-4">
          <Card.Body>
            <h2 className="h5 fw-semibold text-dark mb-4">Acciones Rápidas</h2>
            <Row className="g-4">
              <Col sm={6} lg={3}>
                <Button
                  variant="outline-secondary"
                  className="w-100 p-4 border-2 h-100"
                  style={{ minHeight: "120px" }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <HiUsers className="text-primary" size={24} />
                    </div>
                    <p className="small fw-medium text-dark mb-0">Usuarios</p>
                  </div>
                </Button>
              </Col>

              <Col sm={6} lg={3}>
                <Button
                  variant="outline-secondary"
                  className="w-100 p-4 border-2 h-100"
                  style={{ minHeight: "120px" }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <HiCheckCircle className="text-success" size={24} />
                    </div>
                    <p className="small fw-medium text-dark mb-0">Roles</p>
                  </div>
                </Button>
              </Col>

              <Col sm={6} lg={3}>
                <Button
                  variant="outline-secondary"
                  className="w-100 p-4 border-2 h-100"
                  style={{ minHeight: "120px" }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <HiDocumentText className="text-info" size={24} />
                    </div>
                    <p className="small fw-medium text-dark mb-0">Páginas</p>
                  </div>
                </Button>
              </Col>

              <Col sm={6} lg={3}>
                <Button
                  variant="outline-secondary"
                  className="w-100 p-4 border-2 h-100"
                  style={{ minHeight: "120px" }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <HiCog className="text-warning" size={24} />
                    </div>
                    <p className="small fw-medium text-dark mb-0">Módulos</p>
                  </div>
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default DashboardPage;

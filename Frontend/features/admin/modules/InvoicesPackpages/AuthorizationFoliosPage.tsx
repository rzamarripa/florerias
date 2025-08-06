"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Spinner,
  Form,
  InputGroup,
  Modal,
  Alert,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  getAuthorizationFoliosWithUserInfo,
  authorizeFolio,
  rejectFolio,
  AuthorizationFolio,
} from "./services/authorizationFolios";
import AuthorizationFolioActions from "./components/AuthorizationFolioActions";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { formatDate } from "date-fns";

const AuthorizationFoliosPage: React.FC = () => {
  const [folios, setFolios] = useState<AuthorizationFolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFolio, setSelectedFolio] = useState<AuthorizationFolio | null>(
    null
  );
  const [actionType, setActionType] = useState<"authorize" | "reject" | null>(
    null
  );
  const { user } = useUserSessionStore();
  const router = useRouter();

  // Verificar si el usuario es de Tesorería
  const isTreasuryUser = user?.department?.toLowerCase() === "tesorería";

  const loadFolios = async () => {
    try {
      setLoading(true);
      console.log("🔄 Cargando folios...");
      const foliosData = await getAuthorizationFoliosWithUserInfo();
      console.log("📋 Folios obtenidos:", foliosData);
      setFolios(foliosData.data || []);
    } catch (error) {
      console.error("Error al cargar folios:", error);
      toast.error("Error al cargar los folios de autorización");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolios();
  }, []);

  const handleAuthorize = async (folio: AuthorizationFolio) => {
    setSelectedFolio(folio);
    setActionType("authorize");
    setShowConfirmModal(true);
  };

  const handleReject = async (folio: AuthorizationFolio) => {
    setSelectedFolio(folio);
    setActionType("reject");
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedFolio) return;

    try {
      if (actionType === "authorize") {
        setAuthorizingId(selectedFolio._id);
        await authorizeFolio(selectedFolio._id);
        toast.success("Folio autorizado correctamente");
      } else if (actionType === "reject") {
        setRejectingId(selectedFolio._id);
        await rejectFolio(selectedFolio._id);
        toast.success("Folio rechazado correctamente");
      }

      // Recargar la lista
      await loadFolios();
      setShowConfirmModal(false);
      setSelectedFolio(null);
      setActionType(null);
    } catch (error: any) {
      console.error("Error al procesar folio:", error);
      toast.error(error?.message || "Error al procesar el folio");
    } finally {
      setAuthorizingId(null);
      setRejectingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return (
          <span className="badge bg-warning bg-opacity-10 text-warning fw-bold py-2 px-3">
            Por Autorizar
          </span>
        );
      case "autorizado":
        return (
          <span className="badge bg-success bg-opacity-10 text-success fw-bold py-2 px-3">
            Autorizado
          </span>
        );
      case "rechazado":
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger fw-bold py-2 px-3">
            Rechazado
          </span>
        );
      default:
        return (
          <span className="badge bg-light text-dark fw-bold py-2 px-3">
            {status}
          </span>
        );
    }
  };

  const filteredFolios = folios.filter((folio) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      folio.motivo.toLowerCase().includes(searchLower) ||
      (folio.usuario?.profile.fullName &&
        folio.usuario.profile.fullName.toLowerCase().includes(searchLower)) ||
      folio.paquete_id.toLowerCase().includes(searchLower) ||
      (folio.paquete?.folio &&
        folio.paquete.folio.toString().includes(searchLower)) ||
      (folio.paquete?.departamento &&
        folio.paquete.departamento.toLowerCase().includes(searchLower))
    );
  });

  // Si el usuario no es de Tesorería, mostrar mensaje de acceso denegado
  if (!isTreasuryUser) {
    return (
      <Container fluid className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Acceso Denegado
          </Alert.Heading>
          <p>
            Solo los usuarios del departamento de Tesorería pueden acceder a
            esta página.
          </p>
          <hr />
          <p className="mb-0">
            <Button variant="outline-danger" onClick={() => router.back()}>
              Volver
            </Button>
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Filtro de búsqueda */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Buscar:</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por motivo, usuario, folio del paquete o departamento"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6} className="text-end">
              <Button
                variant="primary"
                onClick={() => router.push("/modulos/paquetes-facturas")}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Paquetes
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de folios */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light border-bottom">
          <Card.Title className="mb-0 fw-bold">
            Folios de Autorización (Pendientes y Autorizados)
            {filteredFolios.length > 0 && (
              <span className="text-muted ms-2">
                ({filteredFolios.length} folios)
              </span>
            )}
          </Card.Title>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2 text-muted">
                Cargando folios de autorización...
              </p>
            </div>
          ) : filteredFolios.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard-check display-4 text-muted"></i>
              <p className="mt-2 text-muted">
                No se encontraron folios de autorización
              </p>
              <small className="text-muted">
                {searchTerm
                  ? "No hay folios que coincidan con el filtro de búsqueda"
                  : "No hay folios pendientes o autorizados"}
              </small>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Motivo</th>
                  <th>Usuario Solicitante</th>
                  <th>Folio del Paquete</th>
                  <th>Estatus</th>
                  <th>Fecha Creación</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFolios.map((folio) => (
                  <tr key={folio._id}>
                    <td>
                      <div
                        className="text-truncate"
                        style={{ maxWidth: "300px" }}
                        title={folio.motivo}
                      >
                        {folio.motivo}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>
                          {folio.usuario?.profile.fullName ||
                            "Usuario no encontrado"}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong className="text-primary">
                          #{folio.paquete?.folio || "N/A"}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {folio.paquete?.departamento || "N/A"}
                        </small>
                      </div>
                    </td>
                    <td>{getStatusBadge(folio.estatus)}</td>
                    <td>
                      <small>
                        {formatDate(folio.createdAt, "dd/MM/yyyy HH:mm")}
                      </small>
                    </td>
                    <td>
                      <AuthorizationFolioActions
                        folioNumber={folio.folio}
                        packageId={folio.paquete_id}
                        onAuthorize={() => handleAuthorize(folio)}
                        onReject={() => handleReject(folio)}
                        loadingAuthorize={authorizingId === folio._id}
                        loadingReject={rejectingId === folio._id}
                        isTreasuryUser={isTreasuryUser}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal de confirmación */}
      <Modal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setSelectedFolio(null);
          setActionType(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === "authorize" ? "Autorizar Folio" : "Rechazar Folio"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Alert variant={actionType === "authorize" ? "success" : "warning"}>
              <i
                className={`bi ${
                  actionType === "authorize"
                    ? "bi-check-circle"
                    : "bi-exclamation-triangle"
                } me-2`}
              ></i>
              ¿Estás seguro que deseas{" "}
              {actionType === "authorize" ? "autorizar" : "rechazar"} el folio{" "}
              <strong>{selectedFolio?.folio}</strong>?
            </Alert>
          </div>
          <div className="mb-2">
            <strong>Folio:</strong> {selectedFolio?.folio}
          </div>
          <div className="mb-2">
            <strong>Motivo:</strong> {selectedFolio?.motivo}
          </div>
          <div className="mb-2">
            <strong>Solicitante:</strong>{" "}
            {selectedFolio?.usuario?.profile.fullName}
          </div>
          <div className="mb-2">
            <strong>Fecha:</strong>{" "}
            {selectedFolio?.createdAt
              ? formatDate(selectedFolio.createdAt, "dd/MM/yyyy HH:mm")
              : ""}
          </div>
          {actionType === "reject" && (
            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Al rechazar el folio, el usuario deberá solicitar uno nuevo para
                enviar el paquete a tesorería.
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedFolio(null);
              setActionType(null);
            }}
            disabled={!!authorizingId || !!rejectingId}
          >
            Cancelar
          </Button>
          <Button
            variant={actionType === "authorize" ? "success" : "danger"}
            onClick={confirmAction}
            disabled={!!authorizingId || !!rejectingId}
          >
            {authorizingId || rejectingId ? (
              <Spinner animation="border" size="sm" />
            ) : actionType === "authorize" ? (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Autorizar
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-1"></i>
                Rechazar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AuthorizationFoliosPage;

"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Badge,
  Button,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { PageProtection } from "@/components/common/PageProtection";
import { ChevronLeft, ChevronRight, FileText, Undo2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils";
import { formatDate } from "@/utils/dateUtils";
import { getBankLayouts, revertBankLayout } from "./services/bankLayouts";
import { BankLayout } from "./types";

const BankLayoutsPage: React.FC = () => {
  
  const [layouts, setLayouts] = useState<BankLayout[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [layoutToRevert, setLayoutToRevert] = useState<BankLayout | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 10,
  });

  useEffect(() => {
    loadLayouts();
  }, [pagination.page]);

  const loadLayouts = async () => {
    try {
      setLoading(true);
      const response = await getBankLayouts({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        setLayouts(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error("Error al cargar los layouts bancarios");
      }
    } catch (error) {
      console.error("Error cargando layouts:", error);
      toast.error("Error al cargar los layouts bancarios");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleRevertClick = (layout: BankLayout) => {
    setLayoutToRevert(layout);
    setShowConfirmDialog(true);
  };

  const handleConfirmRevert = async () => {
    if (!layoutToRevert) return;

    try {
      setReverting(true);
      const response = await revertBankLayout(layoutToRevert._id);

      if (response.success) {
        toast.success(response.message || "Layout revertido exitosamente");
        setShowConfirmDialog(false);
        setLayoutToRevert(null);
        // Recargar la lista de layouts
        loadLayouts();
      } else {
        // Manejar errores de validación con mejor formato
        if (response.issues && Array.isArray(response.issues)) {
          const hasPagadoIssues = response.issues.some((issue: any) => 
            issue.issue.includes('estatus "Pagado"')
          );
          const hasConciliadoIssues = response.issues.some((issue: any) => 
            issue.issue.includes('conciliadas')
          );

          let errorMessage = "No se puede revertir el layout: ";
          if (hasPagadoIssues && hasConciliadoIssues) {
            errorMessage += "contiene paquetes pagados y facturas conciliadas";
          } else if (hasPagadoIssues) {
            errorMessage += "contiene paquetes en estatus 'Pagado'";
          } else if (hasConciliadoIssues) {
            errorMessage += "contiene facturas conciliadas";
          } else {
            // Para otros tipos de issues, mostrar los detalles
            const issueMessages = response.issues.map((issue: any) => 
              `Paquete ${issue.folio}: ${issue.issue}`
            ).join(", ");
            errorMessage += issueMessages;
          }

          toast.error(errorMessage);
        } else {
          toast.error(response.message || "Error al revertir el layout");
        }
      }
    } catch (error: any) {
      console.error("Error revirtiendo layout:", error);
      
      // Extraer el mensaje de error real si viene de la respuesta del servidor
      let errorMessage = "Error al revertir el layout";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Si tiene issues, manejar igual que arriba
        if (error.response.data.issues && Array.isArray(error.response.data.issues)) {
          const hasPagadoIssues = error.response.data.issues.some((issue: any) => 
            issue.issue.includes('estatus "Pagado"')
          );
          const hasConciliadoIssues = error.response.data.issues.some((issue: any) => 
            issue.issue.includes('conciliadas')
          );

          if (hasPagadoIssues && hasConciliadoIssues) {
            errorMessage = "No se puede revertir el layout: contiene paquetes pagados y facturas conciliadas";
          } else if (hasPagadoIssues) {
            errorMessage = "No se puede revertir el layout: contiene paquetes en estatus 'Pagado'";
          } else if (hasConciliadoIssues) {
            errorMessage = "No se puede revertir el layout: contiene facturas conciliadas";
          }
        }
      } else if (error.message && !error.message.includes("Error revirtiendo layout")) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setReverting(false);
    }
  };

  const handleCancelRevert = () => {
    setShowConfirmDialog(false);
    setLayoutToRevert(null);
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Generado':
        return 'primary';
      case 'Procesado':
        return 'warning';
      case 'Conciliado':
        return 'success';
      case 'Cancelado':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getTipoLayoutColor = (tipo: string) => {
    return tipo === 'grouped' ? 'info' : 'dark';
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === pagination.page ? "primary" : "outline-primary"}
          size="sm"
          className="mx-1"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="d-flex justify-content-center align-items-center mt-3">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
          className="me-2"
        >
          <ChevronLeft size={16} />
        </Button>
        {pages}
        <Button
          variant="outline-primary"
          size="sm"
          disabled={pagination.page === pagination.pages}
          onClick={() => handlePageChange(pagination.page + 1)}
          className="ms-2"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    );
  };


  return (
    <PageProtection requiredPermission="ver">
      <Container fluid className="py-4">
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h3 mb-1 fw-bold text-dark">
                  <FileText className="me-2" size={28} />
                  Layouts Bancarios
                </h1>
                <p className="text-muted mb-0">
                  Historial de layouts bancarios generados para pagos
                </p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="text-end">
                  <div className="text-muted small">Total de layouts</div>
                  <div className="fw-bold h5 mb-0">{pagination.total}</div>
                </div>
              </div>
            </div>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-bottom-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold text-dark">
                    Historial de Layouts Generados
                  </h6>
                  <Badge bg="info" className="px-3 py-2">
                    {pagination.total} registros
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-2 text-muted">Cargando layouts...</div>
                  </div>
                ) : layouts.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="border-0 text-center">#</th>
                            <th className="border-0">Folio Layout</th>
                            <th className="border-0">Tipo</th>
                            <th className="border-0">Empresa</th>
                            <th className="border-0">Banco</th>
                            <th className="border-0 text-center">Proveedores</th>
                            <th className="border-0 text-center">Facturas</th>
                            <th className="border-0 text-center">Paquetes</th>
                            <th className="border-0 text-end">Total</th>
                            <th className="border-0 text-center">Fecha</th>
                            <th className="border-0 text-center">Estatus</th>
                            <th className="border-0 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {layouts.map((layout, index) => (
                            <tr key={layout._id}>
                              <td className="text-center text-muted">
                                {(pagination.page - 1) * pagination.limit + index + 1}
                              </td>
                              <td>
                                <div className="fw-bold text-primary">
                                  {layout.layoutFolio}
                                </div>
                                <small className="text-muted">
                                  {layout.bankAccountNumber}
                                </small>
                              </td>
                              <td>
                                <Badge
                                  bg={getTipoLayoutColor(layout.tipoLayout)}
                                  className="px-2 py-1"
                                >
                                  {layout.descripcionTipo}
                                </Badge>
                              </td>
                              <td>
                                <div className="fw-medium">{layout.companyName}</div>
                                <small className="text-muted">{layout.companyRfc}</small>
                              </td>
                              <td>
                                <div className="fw-medium">{layout.bankName}</div>
                              </td>
                              <td className="text-center">
                                <Badge bg="secondary" className="px-2">
                                  {layout.cantidadProveedores}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="info" className="px-2">
                                  {layout.cantidadFacturas}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="warning" className="px-2">
                                  {layout.cantidadPaquetes}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <div className="fw-bold text-success">
                                  {formatCurrency(layout.totalAmount)}
                                </div>
                                <small className="text-muted">
                                  {layout.totalRegistros} registros
                                </small>
                              </td>
                              <td className="text-center">
                                <div className="fw-medium">
                                  {formatDate(layout.fechaLayout, "dd/MM/yyyy")}
                                </div>
                                <small className="text-muted">
                                  {formatDate(layout.fechaLayout, "HH:mm")}
                                </small>
                              </td>
                              <td className="text-center">
                                <Badge
                                  bg={getEstatusColor(layout.estatus)}
                                  className="px-2 py-1"
                                >
                                  {layout.estatus}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleRevertClick(layout)}
                                  title="Revertir Layout"
                                  className="d-flex align-items-center justify-content-center"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  <Undo2 size={16} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    {renderPagination()}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <FileText size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No hay layouts generados</h5>
                    <p className="text-muted">
                      Los layouts bancarios aparecerán aquí cuando se generen desde la
                      funcionalidad de paquetes.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Modal de confirmación */}
        <Modal show={showConfirmDialog} onHide={handleCancelRevert} centered>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="d-flex align-items-center text-warning">
              <AlertTriangle className="me-2" size={24} />
              Confirmar Reversión
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {layoutToRevert && (
              <div>
                <div className="alert alert-warning d-flex align-items-start">
                  <AlertTriangle className="me-2 mt-1" size={20} />
                  <div>
                    <strong>¿Está seguro que desea revertir este layout?</strong>
                    <p className="mb-0 mt-2">
                      Esta acción eliminará el layout y regresará los paquetes asociados al estatus "Programado".
                    </p>
                  </div>
                </div>
                
                <div className="bg-light p-3 rounded mb-3">
                  <h6 className="fw-bold mb-2">Detalles del Layout:</h6>
                  <div className="row">
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Folio:</small>
                      <span className="fw-bold">{layoutToRevert.layoutFolio}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Tipo:</small>
                      <span>{layoutToRevert.descripcionTipo}</span>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Empresa:</small>
                      <span>{layoutToRevert.companyName}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Total:</small>
                      <span className="fw-bold text-success">
                        {formatCurrency(layoutToRevert.totalAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-sm-4">
                      <small className="text-muted d-block">Proveedores:</small>
                      <span className="badge bg-secondary">{layoutToRevert.cantidadProveedores}</span>
                    </div>
                    <div className="col-sm-4">
                      <small className="text-muted d-block">Facturas:</small>
                      <span className="badge bg-info">{layoutToRevert.cantidadFacturas}</span>
                    </div>
                    <div className="col-sm-4">
                      <small className="text-muted d-block">Paquetes:</small>
                      <span className="badge bg-warning">{layoutToRevert.cantidadPaquetes}</span>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <strong>Consecuencias de la reversión:</strong>
                  <ul className="mb-0 mt-2">
                    <li>El layout <strong>{layoutToRevert.layoutFolio}</strong> será eliminado permanentemente</li>
                    <li>Los <strong>{layoutToRevert.cantidadPaquetes}</strong> paquetes regresarán a estatus "Programado"</li>
                    {layoutToRevert.tipoLayout === 'grouped' && (
                      <li>Se eliminarán <strong>{layoutToRevert.cantidadProveedores}</strong> agrupaciones por proveedor</li>
                    )}
                    {layoutToRevert.tipoLayout === 'individual' && (
                      <li>Se limpiarán las referencias de <strong>{layoutToRevert.cantidadFacturas}</strong> facturas individuales</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={handleCancelRevert}>
              Cancelar
            </Button>
            <Button 
              variant="warning" 
              onClick={handleConfirmRevert} 
              disabled={reverting}
            >
              {reverting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Revirtiendo...
                </>
              ) : (
                <>
                  <Undo2 className="me-2" size={16} />
                  Confirmar Reversión
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PageProtection>
  );
};

export default BankLayoutsPage;
"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  InputGroup,
  Spinner,
  Row,
  Col,
  Modal,
  Table,
  Badge,
  Alert,
} from "react-bootstrap";
import { Search, Package } from "lucide-react";
import { toast } from "react-toastify";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { ordersService } from "./services/orders";
import { stageCatalogsService } from "@/features/admin/modules/stageCatalogs/services/stageCatalogs";
import { Order, KanbanColumn as KanbanColumnType, StageCatalog, StageColor } from "./types";
import KanbanColumn from "./components/KanbanColumn";

const PizarronEnvioPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Stages dinámicos
  const [shippingStages, setShippingStages] = useState<StageCatalog[]>([]);

  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const isAdministrator = role?.toLowerCase() === "administrador";

  // Cargar stages del usuario
  const loadUserStages = async () => {
    try {
      setLoadingStages(true);

      // Cargar stages de Envío
      const shippingResponse = await stageCatalogsService.getUserStages('Envio');
      setShippingStages(shippingResponse.data || []);

    } catch (error: any) {
      console.error("Error loading stages:", error);
      toast.error(error.message || "Error al cargar las etapas del pizarrón");
    } finally {
      setLoadingStages(false);
    }
  };

  // Cargar órdenes
  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await ordersService.getAllOrders({
        searchTerm,
        product: productFilter,
        ...(isAdministrator && activeBranch ? { branchId: activeBranch._id } : {})
      });

      if (response.data) {
        // Filtrar solo las órdenes no canceladas
        const validOrders = response.data.filter(
          (order) => order.status !== "cancelado"
        );
        setOrders(validOrders);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las órdenes");
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserStages();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [searchTerm, productFilter, activeBranch]);

  // Usar el hook especializado para escuchar cambios en órdenes
  useOrderSocket({
    onOrderCreated: (newOrder) => {
      console.log("📩 [PizarronEnvio] Nueva orden recibida:", newOrder);

      if (newOrder.status !== "cancelado") {
        setOrders((prevOrders) => {
          const exists = prevOrders.some((o) => o._id === newOrder._id);
          if (exists) return prevOrders;
          return [newOrder as Order, ...prevOrders];
        });
        toast.info(`Nueva orden: ${newOrder.orderNumber}`);
      }
    },
    onOrderUpdated: (updatedOrder) => {
      console.log("📝 [PizarronEnvio] Orden actualizada:", updatedOrder);
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === updatedOrder._id ? updatedOrder as Order : o
        )
      );
    },
    onOrderDeleted: (data: { orderId: string }) => {
      console.log("🗑️ [PizarronEnvio] Orden eliminada:", data.orderId);
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o._id !== data.orderId)
      );
      toast.info("Una orden ha sido eliminada");
    },
    filters: {
      status: ["pendiente", "en-proceso", "completado"],
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleProductFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setProductFilter(e.target.value);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleChangeStage = async (order: Order, newStageId: string) => {
    try {
      // Actualizar el stage de la orden
      await ordersService.updateOrder(order._id, {
        stage: newStageId,
      });

      // Actualizar el estado local
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o._id === order._id
            ? { ...o, stage: newStageId }
            : o
        )
      );

      toast.success("Orden movida correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al mover la orden");
      console.error("Error moving order:", error);
    }
  };

  // Convertir stages a columnas de kanban
  const createColumnsFromStages = (stages: StageCatalog[]): KanbanColumnType[] => {
    return stages.map(stage => ({
      id: stage._id,
      stageNumber: stage.stageNumber,
      title: stage.name,
      abreviation: stage.abreviation,
      orders: [],
      color: stage.color,
      boardType: stage.boardType,
    }));
  };

  // Obtener órdenes por stage (solo Envío)
  const getOrdersByStage = (stageId: string): Order[] => {
    return orders.filter((order) => {
      // No mostrar órdenes canceladas
      if (order.status === 'cancelado') return false;

      // Obtener el ID del stage de la orden
      const orderStageId = typeof order.stage === 'string'
        ? order.stage
        : order.stage?._id;

      // Verificar que la orden tenga el stage correcto
      if (orderStageId !== stageId) return false;

      // Envío: mostrar solo órdenes con sentToShipping = true
      return order.sentToShipping === true;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener el color RGBA como string CSS
  const getRGBAColor = (color: StageColor) => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  };

  const shippingColumns = createColumnsFromStages(shippingStages);

  return (
    <div className="container-fluid py-1">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Pizarrón de Envío</h2>
        <p className="text-muted">Gestiona las órdenes en las diferentes etapas de envío</p>
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-4">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por orden, cliente..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Filtrar por producto..."
                  value={productFilter}
                  onChange={handleProductFilterChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </Col>
          </Row>
        </div>
      </div>

      {/* Pizarrón de Envío */}
      {loadingStages ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Cargando pizarrón...</p>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Cargando órdenes...</p>
        </div>
      ) : shippingColumns.length === 0 ? (
        <Alert variant="warning" className="mt-3">
          <Package size={20} className="me-2" />
          No hay etapas configuradas para el pizarrón de Envío.
          <br />
          <small>Crea etapas en el catálogo de etapas para poder visualizar las órdenes aquí.</small>
        </Alert>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <Row className="g-4">
            {shippingColumns.map((column) => (
              <Col key={column.id} lg={3} md={4} sm={6} xs={12}>
                <KanbanColumn
                  title={column.title}
                  count={getOrdersByStage(column.id).length}
                  orders={getOrdersByStage(column.id)}
                  color={getRGBAColor(column.color)}
                  status={column.id}
                  onViewDetails={handleViewDetails}
                  onChangeStatus={handleChangeStage}
                />
              </Col>
            ))}
          </Row>
        </DndProvider>
      )}

      {/* Order Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Detalle de Orden</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          {selectedOrder && (
            <>
              {/* Order Info */}
              <div className="mb-4">
                <Row className="g-3">
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">
                        Número de Orden
                      </label>
                      <div className="fw-bold">{selectedOrder.orderNumber}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Estado</label>
                      <div className="fw-bold text-capitalize">
                        <Badge
                          bg={selectedOrder.status === 'sinAnticipo' ? 'warning' : 'primary'}
                        >
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Client Info */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Información del Cliente</h6>
                <Row className="g-3">
                  <Col md={selectedOrder.arregloUrl ? 6 : 12}>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Nombre</label>
                      <div>{selectedOrder.clientInfo.name}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small mb-1">Teléfono</label>
                      <div>{selectedOrder.clientInfo.phone || "N/A"}</div>
                    </div>
                    <div className="mb-2">
                      <label className="text-muted small mb-1">Email</label>
                      <div>{selectedOrder.clientInfo.email || "N/A"}</div>
                    </div>
                  </Col>
                  {selectedOrder.arregloUrl && (
                    <Col md={6}>
                      <div className="mb-2">
                        <label className="text-muted small mb-1">Imagen del Arreglo</label>
                        <div className="mt-2 d-flex justify-content-center">
                          <img
                            src={selectedOrder.arregloUrl}
                            alt="Arreglo"
                            className="img-fluid rounded shadow-sm"
                            style={{
                              maxHeight: "300px",
                              objectFit: "contain",
                              cursor: "pointer",
                            }}
                            onClick={() => window.open(selectedOrder.arregloUrl!, '_blank')}
                          />
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>

              {/* Delivery Info */}
              {selectedOrder.deliveryData && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Información de Entrega</h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="mb-2">
                        <label className="text-muted small mb-1">
                          Destinatario
                        </label>
                        <div>
                          {selectedOrder.deliveryData.recipientName || "N/A"}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-2">
                        <label className="text-muted small mb-1">
                          Fecha de Entrega
                        </label>
                        <div>
                          {selectedOrder.deliveryData.deliveryDateTime
                            ? formatDate(
                                selectedOrder.deliveryData.deliveryDateTime
                              )
                            : "N/A"}
                        </div>
                      </div>
                    </Col>
                    {selectedOrder.deliveryData.message && (
                      <Col md={12}>
                        <div className="mb-2">
                          <label className="text-muted small mb-1">
                            Mensaje
                          </label>
                          <div>{selectedOrder.deliveryData.message}</div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              )}

              {/* Items */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Productos</h6>
                <Table responsive bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Cantidad</th>
                      <th className="text-end">Precio Unitario</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item._id}>
                        <td>{item.productName}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-end fw-semibold">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Financial Summary */}
              <div className="bg-light p-3 rounded">
                <Row className="g-2">
                  <Col xs={6}>
                    <div className="text-muted small">Subtotal:</div>
                  </Col>
                  <Col xs={6} className="text-end">
                    <div className="fw-semibold">
                      {formatCurrency(selectedOrder.subtotal)}
                    </div>
                  </Col>
                  {selectedOrder.discount > 0 && (
                    <>
                      <Col xs={6}>
                        <div className="text-muted small">Descuento:</div>
                      </Col>
                      <Col xs={6} className="text-end">
                        <div className="text-danger">
                          -{formatCurrency(selectedOrder.discount)}
                        </div>
                      </Col>
                    </>
                  )}
                  <Col xs={6}>
                    <div className="fw-bold">Total:</div>
                  </Col>
                  <Col xs={6} className="text-end">
                    <div className="fw-bold fs-5">
                      {formatCurrency(selectedOrder.total)}
                    </div>
                  </Col>
                  {selectedOrder.advance > 0 && (
                    <>
                      <Col xs={6}>
                        <div className="text-muted small">Anticipo:</div>
                      </Col>
                      <Col xs={6} className="text-end">
                        <div className="text-success">
                          {formatCurrency(selectedOrder.advance)}
                        </div>
                      </Col>
                    </>
                  )}
                  {selectedOrder.remainingBalance > 0 && (
                    <>
                      <Col xs={6}>
                        <div className="text-danger small fw-bold">
                          Saldo Pendiente:
                        </div>
                      </Col>
                      <Col xs={6} className="text-end">
                        <div className="text-danger fw-bold">
                          {formatCurrency(selectedOrder.remainingBalance)}
                        </div>
                      </Col>
                    </>
                  )}
                </Row>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PizarronEnvioPage;

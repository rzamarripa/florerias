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
} from "react-bootstrap";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import { ordersService } from "./services/orders";
import { Order, OrderStatus, KanbanColumn as KanbanColumnType } from "./types";
import KanbanColumn from "./components/KanbanColumn";

const PizarronVentasPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Definir las columnas del Kanban
  const columns: KanbanColumnType[] = [
    {
      id: "pendiente",
      title: "Pendiente",
      orders: [],
      color: "#f0ad4e",
    },
    {
      id: "en-proceso",
      title: "En Proceso",
      orders: [],
      color: "#5bc0de",
    },
    {
      id: "completado",
      title: "Completado",
      orders: [],
      color: "#5cb85c",
    },
  ];

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await ordersService.getAllOrders({
        searchTerm,
        product: productFilter,
      });

      if (response.data) {
        // Filtrar solo las órdenes con estados válidos (excluir cancelado)
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
    loadOrders();
  }, [searchTerm, productFilter]);

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

  const handleChangeStatus = async (order: Order, newStatus: string) => {
    try {
      await ordersService.updateOrderStatus(order._id, newStatus);
      toast.success("Estado actualizado correctamente");
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el estado");
      console.error("Error updating order status:", error);
    }
  };

  // Organizar órdenes por columna
  const getOrdersByStatus = (status: OrderStatus): Order[] => {
    return orders.filter((order) => order.status === status);
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

  return (
    <div className="container-fluid py-1">
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

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando órdenes...</p>
        </div>
      ) : (
        <Row className="g-4">
          {columns.map((column) => (
            <Col key={column.id} lg={4} md={6} xs={12}>
              <KanbanColumn
                title={column.title}
                count={getOrdersByStatus(column.id).length}
                orders={getOrdersByStatus(column.id)}
                color={column.color}
                onViewDetails={handleViewDetails}
                onChangeStatus={handleChangeStatus}
              />
            </Col>
          ))}
        </Row>
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
                        {selectedOrder.status}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Client Info */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Información del Cliente</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="mb-2">
                      <label className="text-muted small mb-1">Nombre</label>
                      <div>{selectedOrder.clientInfo.name}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-2">
                      <label className="text-muted small mb-1">Teléfono</label>
                      <div>{selectedOrder.clientInfo.phone || "N/A"}</div>
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="mb-2">
                      <label className="text-muted small mb-1">Email</label>
                      <div>{selectedOrder.clientInfo.email || "N/A"}</div>
                    </div>
                  </Col>
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

export default PizarronVentasPage;

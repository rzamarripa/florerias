"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Badge, Alert } from "react-bootstrap";
import {
  User,
  Phone,
  Mail,
  Store,
  Package,
  Calendar,
  MessageSquare,
  Upload,
  CreditCard,
  Send,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { ordersService } from "./services/orders";
import {
  CreateOrderData,
  OrderItem,
  ShippingType,
} from "./types";
import ProductCatalog from "./components/ProductCatalog";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { Client } from "@/features/admin/modules/clients/types";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { toast } from "react-toastify";

const NewOrderPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const [formData, setFormData] = useState<CreateOrderData>({
    clientInfo: {
      name: "",
      phone: "",
      email: "",
    },
    salesChannel: "tienda",
    items: [],
    shippingType: "tienda",
    anonymous: false,
    quickSale: false,
    deliveryData: {
      recipientName: "",
      deliveryDateTime: "",
      message: "",
      street: "",
      neighborhood: "",
      reference: "",
    },
    paymentMethod: "",
    discount: 0,
    discountType: "porcentaje",
    subtotal: 0,
    total: 0,
    advance: 0,
    paidWith: 0,
    change: 0,
    remainingBalance: 0,
    sendToProduction: false,
  });

  const [currentItem, setCurrentItem] = useState<OrderItem>({
    isProduct: false,
    productName: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  });

  const [currentProductName, setCurrentProductName] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Cargar clientes y métodos de pago al montar el componente
  useEffect(() => {
    fetchClients();
    fetchPaymentMethods();
  }, []);

  // Actualizar fecha y hora cuando se activa "Venta Rápida"
  useEffect(() => {
    if (formData.quickSale) {
      // Obtener fecha y hora actual en formato ISO para datetime-local
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData(prev => ({
        ...prev,
        deliveryData: {
          ...prev.deliveryData,
          deliveryDateTime: currentDateTime
        }
      }));
    }
  }, [formData.quickSale]);

  // Obtener todos los clientes
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await clientsService.getAllClients({
        limit: 1000,
        status: true,
      });
      setClients(response.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Obtener todos los métodos de pago
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        limit: 1000,
        status: true,
      });
      setPaymentMethods(response.data);
      // Establecer el primer método de pago como predeterminado
      if (response.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          paymentMethod: response.data[0]._id
        }));
      }
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
      toast.error("Error al cargar los métodos de pago");
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    if (!clientId) {
      // Limpiar campos si se deselecciona
      setFormData({
        ...formData,
        clientInfo: {
          name: "",
          phone: "",
          email: "",
        },
      });
      return;
    }

    const selectedClient = clients.find((c) => c._id === clientId);
    if (selectedClient) {
      setFormData({
        ...formData,
        clientInfo: {
          clientId: selectedClient._id,
          name: `${selectedClient.name} ${selectedClient.lastName}`,
          phone: selectedClient.phoneNumber,
          email: selectedClient.email || "",
        },
      });
    }
  };

  // Calcular importe del item actual
  const calculateItemAmount = () => {
    return currentItem.quantity * currentItem.unitPrice;
  };

  // Agregar item a la lista
  const handleAddItem = () => {
    if (!currentProductName || currentItem.unitPrice <= 0) {
      setError("Por favor completa el nombre del producto y el precio");
      return;
    }

    const newItem: OrderItem = {
      ...currentItem,
      isProduct: false, // Producto manual
      productName: currentProductName,
      amount: calculateItemAmount(),
    };

    const updatedItems = [...formData.items, newItem];
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      formData.discountType === "porcentaje"
        ? (subtotal * formData.discount) / 100
        : formData.discount;
    const total = subtotal - discountAmount;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total,
      remainingBalance: total - formData.advance,
    });

    // Reset current item
    setCurrentItem({
      isProduct: false,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    });
    setCurrentProductName("");
    setError(null);
  };

  // Eliminar item
  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      formData.discountType === "porcentaje"
        ? (subtotal * formData.discount) / 100
        : formData.discount;
    const total = subtotal - discountAmount;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total,
      remainingBalance: total - formData.advance,
    });
  };

  // Manejar cambio de descuento
  const handleDiscountChange = (
    value: number,
    tipo: "porcentaje" | "cantidad"
  ) => {
    const discountAmount =
      tipo === "porcentaje" ? (formData.subtotal * value) / 100 : value;
    const total = formData.subtotal - discountAmount;

    setFormData({
      ...formData,
      discount: value,
      discountType: tipo,
      total,
      remainingBalance: total - formData.advance,
    });
  };

  // Manejar cambio de anticipo
  const handleAdvanceChange = (value: number) => {
    setFormData({
      ...formData,
      advance: value,
      remainingBalance: formData.total - value,
    });
  };

  // Manejar cambio de pago con
  const handlePaidWithChange = (value: number) => {
    const changeAmount = value - formData.total;
    setFormData({
      ...formData,
      paidWith: value,
      change: changeAmount > 0 ? changeAmount : 0,
    });
  };

  // Agregar producto desde catálogo
  const handleAddProductFromCatalog = (product: any, quantity: number) => {
    const newItem: OrderItem = {
      isProduct: true, // Producto del catálogo
      productId: product._id, // ID del producto
      productName: product.nombre, // Nombre del producto
      quantity,
      unitPrice: product.precio,
      amount: quantity * product.precio,
    };

    const updatedItems = [...formData.items, newItem];
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      formData.discountType === "porcentaje"
        ? (subtotal * formData.discount) / 100
        : formData.discount;
    const total = subtotal - discountAmount;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total,
      remainingBalance: total - formData.advance,
    });
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.items.length === 0) {
        throw new Error("Debes agregar al menos un producto");
      }

      const response = await ordersService.createOrder(formData);

      // Mostrar toast de éxito
      toast.success(
        `¡Orden ${response.data.orderNumber || ""} creada exitosamente!`
      );

      setSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          clientInfo: {
            name: "",
            phone: "",
            email: "",
          },
          salesChannel: "tienda",
          items: [],
          shippingType: "tienda",
          anonymous: false,
          quickSale: false,
          deliveryData: {
            recipientName: "",
            deliveryDateTime: "",
            message: "",
            street: "",
            neighborhood: "",
            reference: "",
          },
          paymentMethod: paymentMethods.length > 0 ? paymentMethods[0]._id : "",
          discount: 0,
          discountType: "porcentaje",
          subtotal: 0,
          total: 0,
          advance: 0,
          paidWith: 0,
          change: 0,
          remainingBalance: 0,
          sendToProduction: false,
        });
        setSelectedClientId("");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear el pedido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-order-page">
      <Row className="g-3">
        {/* Formulario - 65% izquierda */}
        <Col xs={12} lg={8} className="order-2 order-lg-1">
          {error && (
            <Alert
              variant="danger"
              onClose={() => setError(null)}
              dismissible
              className="mb-3"
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              variant="success"
              onClose={() => setSuccess(false)}
              dismissible
              className="mb-3"
            >
              ¡Pedido creado exitosamente!
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Información del Cliente */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <User size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Información del Cliente</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Search size={16} className="me-2" />
                        Buscar Cliente Existente
                      </Form.Label>
                      <Form.Select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="py-2"
                        disabled={loadingClients}
                      >
                        <option value="">
                          Seleccionar cliente o ingresar nuevo...
                        </option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.name} {client.lastName} -{" "}
                            {client.phoneNumber}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <User size={16} className="me-2" />
                        Cliente
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del cliente"
                        value={formData.clientInfo.name}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            clientInfo: {
                              ...formData.clientInfo,
                              name: e.target.value,
                            },
                          });
                          setSelectedClientId("");
                        }}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Phone size={16} className="me-2" />
                        Teléfono
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Teléfono"
                        value={formData.clientInfo.phone}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            clientInfo: {
                              ...formData.clientInfo,
                              phone: e.target.value,
                            },
                          });
                          setSelectedClientId("");
                        }}
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Mail size={16} className="me-2" />
                        Correo
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Correo electrónico"
                        value={formData.clientInfo.email}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            clientInfo: {
                              ...formData.clientInfo,
                              email: e.target.value,
                            },
                          });
                          setSelectedClientId("");
                        }}
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Store size={16} className="me-2" />
                        Canal de Venta
                      </Form.Label>
                      <Form.Select
                        value={formData.salesChannel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salesChannel: e.target.value,
                          })
                        }
                        required
                        className="py-2"
                      >
                        <option value="tienda">Tienda</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="facebook">Facebook</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Productos */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Productos</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3 mb-3 align-items-end">
                  <Col xs={6} sm={3} md={2} lg={1}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Cant.</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="py-2 mx-2 text-center"
                        style={{ minWidth: "70px" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12} sm={9} md={5} lg={5}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Nombre del Producto
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del producto"
                        value={currentProductName}
                        onChange={(e) => setCurrentProductName(e.target.value)}
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={6} sm={4} md={2} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Precio</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={currentItem.unitPrice || ""}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={6} sm={4} md={2} lg={2}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Importe</Form.Label>
                      <Form.Control
                        type="text"
                        value={`$${calculateItemAmount().toFixed(2)}`}
                        disabled
                        className="py-2 bg-light"
                      />
                    </Form.Group>
                  </Col>

                  <Col
                    xs={12}
                    sm={4}
                    md={1}
                    lg={2}
                    className="d-flex align-items-end"
                  >
                    <Button
                      variant="primary"
                      onClick={handleAddItem}
                      className="w-100 py-2"
                    >
                      <Plus size={20} />
                    </Button>
                  </Col>
                </Row>

                {/* Lista de items */}
                {formData.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th width="10%">Cantidad</th>
                          <th width="40%">Nombre del Producto</th>
                          <th width="10%">Tipo</th>
                          <th width="15%">Precio Unit.</th>
                          <th width="15%">Importe</th>
                          <th width="10%" className="text-center">
                            Quitar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.quantity}</td>
                            <td>{item.productName}</td>
                            <td>
                              <Badge
                                bg={item.isProduct ? "success" : "secondary"}
                                className="text-white"
                              >
                                {item.isProduct ? "Existente" : "Manual"}
                              </Badge>
                            </td>
                            <td>${item.unitPrice.toFixed(2)}</td>
                            <td className="fw-bold">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Tipo de Envío */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Send size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Tipo de Envío</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={12}>
                    <div className="d-flex gap-4 flex-wrap align-items-center">
                      {["envio", "tienda"].map((tipo) => (
                        <Form.Check
                          key={tipo}
                          type="radio"
                          id={`envio-${tipo}`}
                          name="envio"
                          label={
                            tipo.charAt(0).toUpperCase() + tipo.slice(1)
                          }
                          value={tipo}
                          checked={formData.shippingType === tipo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingType: e.target.value as ShippingType,
                            })
                          }
                          className="custom-radio"
                        />
                      ))}

                      <div className="border-start ps-3 d-flex gap-3">
                        <Form.Check
                          type="checkbox"
                          id="anonimo-check"
                          label="Anónimo"
                          checked={formData.anonymous}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              anonymous: e.target.checked,
                            })
                          }
                        />
                        <Form.Check
                          type="checkbox"
                          id="venta-rapida-check"
                          label="Venta Rápida"
                          checked={formData.quickSale}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quickSale: e.target.checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <User size={16} className="me-2" />
                        Nombre de quien recibe
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del receptor"
                        value={formData.deliveryData.recipientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              recipientName: e.target.value,
                            },
                          })
                        }
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Calendar size={16} className="me-2" />
                        Fecha y Hora de Entrega
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.deliveryData.deliveryDateTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              deliveryDateTime: e.target.value,
                            },
                          })
                        }
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <MessageSquare size={16} className="me-2" />
                        Mensaje / Comentario
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Escribe el mensaje en la tarjeta o algún comentario"
                        value={formData.deliveryData.message}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              message: e.target.value,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>

                  {formData.shippingType === "envio" && (
                    <>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Calle y Número
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ej: Av. Principal #123"
                            value={formData.deliveryData.street}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  street: e.target.value,
                                },
                              })
                            }
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Colonia
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nombre de la colonia"
                            value={formData.deliveryData.neighborhood}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  neighborhood: e.target.value,
                                },
                              })
                            }
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Señas o Referencias
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Ej: Casa blanca con portón negro, entre calle X y Y"
                            value={formData.deliveryData.reference}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  reference: e.target.value,
                                },
                              })
                            }
                          />
                        </Form.Group>
                      </Col>
                    </>
                  )}

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Upload size={16} className="me-2" />
                        Adjunte el comprobante
                      </Form.Label>
                      <Form.Control type="file" className="py-2" />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Upload size={16} className="me-2" />
                        Adjunte arreglo
                      </Form.Label>
                      <Form.Control type="file" className="py-2" />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Forma de Pago y Resumen */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Forma de Pago</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={12}>
                    <div className="d-flex gap-2 flex-wrap">
                      {loadingPaymentMethods ? (
                        <div className="text-muted">Cargando métodos de pago...</div>
                      ) : paymentMethods.length === 0 ? (
                        <div className="text-danger">No hay métodos de pago disponibles</div>
                      ) : (
                        paymentMethods.map((method) => (
                          <Button
                            key={method._id}
                            variant={
                              formData.paymentMethod === method._id
                                ? "primary"
                                : "outline-secondary"
                            }
                            size="sm"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paymentMethod: method._id,
                              })
                            }
                            className="px-3"
                          >
                            {method.name}
                          </Button>
                        ))
                      )}
                    </div>
                  </Col>

                  <Col md={12}>
                    <hr />
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Descuento</Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) =>
                            handleDiscountChange(
                              parseFloat(e.target.value) || 0,
                              formData.discountType
                            )
                          }
                          className="py-2"
                        />
                        <Form.Select
                          value={formData.discountType}
                          onChange={(e) =>
                            handleDiscountChange(
                              formData.discount,
                              e.target.value as "porcentaje" | "cantidad"
                            )
                          }
                          style={{ maxWidth: "100px" }}
                        >
                          <option value="porcentaje">%</option>
                          <option value="cantidad">$</option>
                        </Form.Select>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Subtotal:</span>
                      <span className="fw-bold">
                        ${formData.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Descuento:</span>
                      <span className="text-danger fw-bold">
                        -$
                        {(formData.discountType === "porcentaje"
                          ? (formData.subtotal * formData.discount) / 100
                          : formData.discount
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-2 border-top">
                      <span className="fs-5 fw-bold">Total:</span>
                      <span className="fs-4 fw-bold text-primary">
                        ${formData.total.toFixed(2)}
                      </span>
                    </div>
                  </Col>

                  <Col md={12}>
                    <hr />
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Anticipo</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.advance}
                        onChange={(e) =>
                          handleAdvanceChange(parseFloat(e.target.value) || 0)
                        }
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Pagó con</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.paidWith}
                        onChange={(e) =>
                          handlePaidWithChange(parseFloat(e.target.value) || 0)
                        }
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Cambio</Form.Label>
                      <Form.Control
                        type="text"
                        value={`$${formData.change.toFixed(2)}`}
                        disabled
                        className="py-2 bg-light"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Saldo</Form.Label>
                      <Form.Control
                        type="text"
                        value={`$${formData.remainingBalance.toFixed(2)}`}
                        disabled
                        className="py-2 bg-light fw-bold"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Check
                      type="checkbox"
                      id="enviar-produccion"
                      label="Enviar a producción"
                      checked={formData.sendToProduction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sendToProduction: e.target.checked,
                        })
                      }
                      className="mt-2"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Botón Aceptar */}
            <div className="d-flex justify-content-end gap-2 mb-4">
              <Button
                type="button"
                variant="outline-secondary"
                size="lg"
                onClick={() => window.history.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || formData.items.length === 0}
                className="px-5"
              >
                {loading ? "Procesando..." : "Aceptar"}
              </Button>
            </div>
          </Form>
        </Col>

        {/* Catálogo de Productos - 35% derecha */}
        <Col xs={12} lg={4} className="order-1 order-lg-2">
          <div
            className="position-sticky"
            style={{ top: "20px", height: "calc(100vh - 160px)" }}
          >
            <ProductCatalog onAddProduct={handleAddProductFromCatalog} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default NewOrderPage;

"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Form,
  Badge,
  Modal,
} from "react-bootstrap";
import {
  Package,
  ArrowLeft,
  Search,
  Gift,
  Star,
  Check,
  X,
  Save,
  ShoppingBag,
  Edit2,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { Storage } from "@/features/admin/modules/storage/types";
import { pointsRewardService } from "./services/pointsReward";
import { PointsReward, CreatePointsRewardData, UpdatePointsRewardData } from "./types";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import PointsRewardModal from "./components/PointsRewardModal";

interface ProductWithStock {
  _id: string;
  productId: {
    _id: string;
    nombre: string;
    imagen?: string;
    totalVenta?: number;
    descripcion?: string;
  };
  quantity: number;
}

interface SelectedProduct {
  productId: string;
  nombre: string;
  imagen?: string;
  precio: number;
  stock: number;
}

const ProductRewardsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();

  const [storage, setStorage] = useState<Storage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [existingProductRewards, setExistingProductRewards] = useState<PointsReward[]>([]);

  // Modal para crear recompensa de producto
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    pointsRequired: 100,
    productQuantity: 1,
    maxRedemptionsPerClient: 0,
    maxTotalRedemptions: 0,
    status: true,
  });

  // Modal para editar recompensa existente
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<PointsReward | null>(null);
  const [editModalLoading, setEditModalLoading] = useState(false);

  useEffect(() => {
    if (activeBranch?._id) {
      loadStorageAndRewards();
    }
  }, [activeBranch]);

  const loadStorageAndRewards = async () => {
    if (!activeBranch?._id) return;

    setLoading(true);
    try {
      // Cargar storage de la sucursal
      const storageResponse = await storageService.getStorageByBranch(activeBranch._id);
      if (storageResponse.data) {
        setStorage(storageResponse.data);
      }

      // Cargar recompensas existentes de tipo producto (isProducto = true)
      const rewardsResponse = await pointsRewardService.getPointsRewardsByBranch(activeBranch._id);
      const productRewards = rewardsResponse.data.filter(
        (reward) => reward.isProducto === true
      );
      setExistingProductRewards(productRewards);
    } catch (error: any) {
      console.error("Error loading data:", error);
      if (!error.message?.includes("no encontr")) {
        toast.error("Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: ProductWithStock) => {
    // Verificar si ya existe una recompensa para este producto
    const existingReward = existingProductRewards.find((reward) => {
      const productId = typeof reward.productId === "string"
        ? reward.productId
        : reward.productId?._id;
      return productId === product.productId._id;
    });

    if (existingReward) {
      toast.info("Este producto ya tiene una recompensa configurada");
      return;
    }

    setSelectedProduct({
      productId: product.productId._id,
      nombre: product.productId.nombre,
      imagen: product.productId.imagen,
      precio: product.productId.totalVenta || 0,
      stock: product.quantity,
    });
    setFormData({
      pointsRequired: 100,
      productQuantity: 1,
      maxRedemptionsPerClient: 0,
      maxTotalRedemptions: 0,
      status: true,
    });
    setShowModal(true);
  };

  const handleCreateReward = async () => {
    if (!selectedProduct || !activeBranch?._id) return;

    if (formData.pointsRequired < 1) {
      toast.error("Los puntos requeridos deben ser al menos 1");
      return;
    }

    if (formData.productQuantity < 1) {
      toast.error("La cantidad debe ser al menos 1");
      return;
    }

    setModalLoading(true);
    try {
      const rewardData: CreatePointsRewardData = {
        name: `${selectedProduct.nombre} (x${formData.productQuantity})`,
        description: `Canjea ${formData.pointsRequired} puntos por ${formData.productQuantity} ${selectedProduct.nombre}`,
        pointsRequired: formData.pointsRequired,
        rewardType: "product",
        rewardValue: selectedProduct.precio * formData.productQuantity,
        isProducto: true,
        productId: selectedProduct.productId,
        productQuantity: formData.productQuantity,
        isPercentage: false,
        maxRedemptionsPerClient: formData.maxRedemptionsPerClient,
        maxTotalRedemptions: formData.maxTotalRedemptions,
        branch: activeBranch._id,
        status: formData.status,
      };

      await pointsRewardService.createPointsReward(rewardData);
      toast.success("Recompensa de producto creada exitosamente");
      setShowModal(false);
      loadStorageAndRewards();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la recompensa");
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditReward = (reward: PointsReward) => {
    setSelectedReward(reward);
    setShowEditModal(true);
  };

  const handleSaveReward = async (data: CreatePointsRewardData | UpdatePointsRewardData) => {
    if (!selectedReward) return;

    setEditModalLoading(true);
    try {
      await pointsRewardService.updatePointsReward(selectedReward._id, data);
      toast.success("Recompensa actualizada exitosamente");
      setShowEditModal(false);
      loadStorageAndRewards();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la recompensa");
    } finally {
      setEditModalLoading(false);
    }
  };

  const isProductAlreadyReward = (productId: string): boolean => {
    return existingProductRewards.some((reward) => {
      const rewardProductId = typeof reward.productId === "string"
        ? reward.productId
        : reward.productId?._id;
      return rewardProductId === productId;
    });
  };

  const getProductReward = (productId: string): PointsReward | undefined => {
    return existingProductRewards.find((reward) => {
      const rewardProductId = typeof reward.productId === "string"
        ? reward.productId
        : reward.productId?._id;
      return rewardProductId === productId;
    });
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  const products = storage?.products || [];
  const filteredProducts = products.filter((item: any) =>
    item.productId?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizar card de recompensa de producto existente
  const renderProductRewardCard = (reward: PointsReward) => {
    const product = typeof reward.productId === "object" ? reward.productId : null;

    return (
      <Col key={reward._id}>
        <Card className="border-0 shadow-sm h-100 overflow-hidden">
          {/* Product Image */}
          <div className="position-relative" style={{ height: "140px" }}>
            {product?.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="bg-light d-flex align-items-center justify-content-center h-100">
                <Package size={32} className="text-muted opacity-50" />
              </div>
            )}
            {/* Points Badge */}
            <div
              className="position-absolute"
              style={{ top: "8px", left: "8px" }}
            >
              <span
                className="badge bg-primary px-2 py-1"
                style={{ fontSize: "0.75rem" }}
              >
                {reward.pointsRequired} pts
              </span>
            </div>
            {/* Status Badge */}
            <div
              className="position-absolute"
              style={{ top: "8px", right: "8px" }}
            >
              <span
                className={`badge ${reward.status ? "bg-success" : "bg-secondary"} px-2 py-1`}
                style={{ fontSize: "0.65rem" }}
              >
                {reward.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <Card.Body className="p-3">
            <h6
              className="fw-semibold mb-1 text-truncate"
              style={{ fontSize: "0.85rem" }}
              title={product?.nombre || reward.name}
            >
              {product?.nombre || reward.name}
            </h6>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                x{reward.productQuantity || 1} unidad(es)
              </small>
              <Button
                variant="link"
                size="sm"
                className="p-0 text-muted"
                onClick={() => handleEditReward(reward)}
                title="Editar"
              >
                <Edit2 size={14} />
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="product-rewards-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => router.push("/panel/config-puntos")}
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver
          </Button>
          <div>
            <h5 className="mb-0">Productos como Recompensa</h5>
            <small className="text-muted">
              {activeBranch?.branchName || "Sucursal"}
            </small>
          </div>
        </div>
      </div>

      {/* Seccion: Recompensas de Productos Configuradas */}
      <div className="mb-5">
        <div className="d-flex align-items-center gap-2 mb-3">
          <ShoppingBag size={20} className="text-primary" />
          <h6 className="mb-0 text-uppercase text-muted fw-semibold" style={{ letterSpacing: "0.5px" }}>
            Recompensas Configuradas
          </h6>
          <Badge bg="secondary" className="ms-2">
            {existingProductRewards.length}
          </Badge>
        </div>

        {existingProductRewards.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-4">
              <ShoppingBag size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No hay productos configurados como recompensa</h6>
              <p className="text-muted small mb-0">
                Selecciona productos del catalogo de abajo para agregarlos como recompensa
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3">
            {existingProductRewards.map((reward) => renderProductRewardCard(reward))}
          </Row>
        )}
      </div>

      {/* Seccion: Seleccionar Productos del Almacen */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <Package size={20} className="text-primary" />
            <h6 className="mb-0 text-uppercase text-muted fw-semibold" style={{ letterSpacing: "0.5px" }}>
              Catalogo de Productos
            </h6>
          </div>
          <Badge bg="primary" className="px-3 py-2">
            {filteredProducts.length} disponibles
          </Badge>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="py-3">
            <div className="position-relative" style={{ maxWidth: "400px" }}>
              <Search
                size={18}
                className="position-absolute text-muted"
                style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <Form.Control
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
              />
            </div>
          </Card.Body>
        </Card>

        {/* Products Grid */}
        {!storage ? (
          <Alert variant="warning">
            <Package size={20} className="me-2" />
            No hay almacen asignado a esta sucursal. Configura un almacen primero.
          </Alert>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <Package size={64} className="text-muted opacity-50 mb-3" />
              <h5 className="text-muted">No hay productos disponibles</h5>
              <p className="text-muted mb-0">
                {searchTerm
                  ? "No se encontraron productos con ese nombre"
                  : "Agrega productos al almacen de esta sucursal"}
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {filteredProducts.map((item: any) => {
              const product = item.productId;
              const isReward = isProductAlreadyReward(product._id);
              const reward = getProductReward(product._id);

              return (
                <Col key={item._id}>
                  <Card
                    className={`product-card border-0 shadow-sm h-100 overflow-hidden ${
                      isReward ? "reward-configured" : ""
                    }`}
                    style={{ cursor: isReward ? "default" : "pointer" }}
                    onClick={() => !isReward && handleProductClick(item)}
                  >
                    {/* Product Image */}
                    <div className="position-relative">
                      {product.imagen ? (
                        <div
                          className="product-image-wrapper"
                          style={{ height: "180px", overflow: "hidden" }}
                        >
                          <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div
                          className="bg-light d-flex align-items-center justify-content-center"
                          style={{ height: "180px" }}
                        >
                          <Package size={48} className="text-muted opacity-50" />
                        </div>
                      )}

                      {/* Badges */}
                      {isReward && (
                        <div
                          className="position-absolute"
                          style={{ top: "10px", left: "10px" }}
                        >
                          <Badge
                            bg="success"
                            className="d-flex align-items-center gap-1 px-2 py-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <Check size={12} />
                            {reward?.pointsRequired} pts
                          </Badge>
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div
                        className="position-absolute"
                        style={{ top: "10px", right: "10px" }}
                      >
                        <Badge
                          bg={item.quantity > 0 ? "primary" : "danger"}
                          className="px-2 py-1"
                          style={{ fontSize: "0.7rem" }}
                        >
                          Stock: {item.quantity}
                        </Badge>
                      </div>

                      {/* Quick Add Button */}
                      {!isReward && (
                        <div
                          className="add-reward-btn position-absolute d-flex align-items-center justify-content-center"
                          style={{
                            bottom: "10px",
                            right: "10px",
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "#6366f1",
                            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.4)",
                            transition: "transform 0.2s",
                          }}
                        >
                          <Plus size={18} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <Card.Body className="p-3">
                      <h6
                        className="product-title fw-semibold mb-2 text-dark"
                        style={{
                          fontSize: "0.9rem",
                          lineHeight: "1.3",
                          height: "2.6em",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {product.nombre}
                      </h6>

                      {/* Rating placeholder (estilo Inspinia) */}
                      <div className="d-flex align-items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= 4 ? "text-warning" : "text-muted"}
                            fill={star <= 4 ? "#ffc107" : "none"}
                          />
                        ))}
                        <span className="text-muted small ms-1">(--)</span>
                      </div>

                      {/* Price */}
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="text-danger fw-bold" style={{ fontSize: "1.1rem" }}>
                            {formatPrice(product.totalVenta || 0)}
                          </span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Modal para crear recompensa de producto */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <Gift size={20} className="text-primary" />
            Configurar Recompensa
          </Modal.Title>
          <Button
            variant="link"
            onClick={() => setShowModal(false)}
            className="text-muted p-0"
          >
            <X size={20} />
          </Button>
        </Modal.Header>

        <Modal.Body>
          {selectedProduct && (
            <>
              {/* Product Preview */}
              <Card className="mb-4 border">
                <Card.Body className="d-flex align-items-center gap-3">
                  {selectedProduct.imagen ? (
                    <img
                      src={selectedProduct.imagen}
                      alt={selectedProduct.nombre}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                      }}
                    >
                      <Package size={24} className="text-muted" />
                    </div>
                  )}
                  <div>
                    <h6 className="mb-1">{selectedProduct.nombre}</h6>
                    <small className="text-muted">
                      Precio: {formatPrice(selectedProduct.precio)} | Stock: {selectedProduct.stock}
                    </small>
                  </div>
                </Card.Body>
              </Card>

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Puntos Requeridos <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.pointsRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsRequired: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                      <Form.Text className="text-muted">
                        Puntos que el cliente debe canjear
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Cantidad del Producto <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max={selectedProduct.stock}
                        value={formData.productQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            productQuantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                      <Form.Text className="text-muted">
                        Unidades a entregar por canje
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max. canjes por cliente</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        placeholder="0 = ilimitado"
                        value={formData.maxRedemptionsPerClient}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxRedemptionsPerClient: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max. canjes totales</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        placeholder="0 = ilimitado"
                        value={formData.maxTotalRedemptions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxTotalRedemptions: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Recompensa Activa"
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked })
                    }
                  />
                </Form.Group>
              </Form>

              {/* Preview de la recompensa */}
              <Alert variant="info" className="mb-0">
                <small>
                  <strong>Vista previa:</strong> Los clientes podran canjear{" "}
                  <strong>{formData.pointsRequired} puntos</strong> por{" "}
                  <strong>{formData.productQuantity} {selectedProduct.nombre}</strong>
                  {" "}(valor: {formatPrice(selectedProduct.precio * formData.productQuantity)})
                </small>
              </Alert>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            disabled={modalLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateReward}
            disabled={modalLoading}
            className="d-flex align-items-center gap-2"
          >
            {modalLoading ? (
              <>
                <Spinner size="sm" animation="border" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Crear Recompensa
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar recompensa existente */}
      <PointsRewardModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        reward={selectedReward}
        onSave={handleSaveReward}
        loading={editModalLoading}
      />

      <style jsx>{`
        .product-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .product-card.reward-configured {
          opacity: 0.85;
        }

        .product-card:hover .add-reward-btn {
          transform: scale(1.1);
        }

        .product-image-wrapper::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to bottom,
            transparent 60%,
            rgba(0, 0, 0, 0.1)
          );
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default ProductRewardsPage;

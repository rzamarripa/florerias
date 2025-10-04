"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Badge, Button, Spinner } from "react-bootstrap";
import { ArrowLeft, Edit, Trash2, Star, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { productsService } from "./services/products";
import { Product } from "./types";

interface ProductDetailsPageProps {
  productId: string;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
}) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [stats, setStats] = useState<{ orderCount: number; totalQuantitySold: number; totalRevenue: number } | null>(null);

  useEffect(() => {
    loadProduct();
    loadStats();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsService.getProductById(productId);
      setProduct(response.data);
      if (response.data.imagen) {
        setSelectedImage(response.data.imagen);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el producto");
      router.push("/catalogos/productos");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await productsService.getProductStats(productId);
      setStats(response.data);
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const handleEdit = () => {
    router.push(`/catalogos/productos/${productId}`);
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await productsService.deleteProduct(productId);
        toast.success("Producto eliminado exitosamente");
        router.push("/catalogos/productos");
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar el producto");
      }
    }
  };

  const handleBack = () => {
    router.push("/catalogos/productos");
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const totalCosto =
    product.insumos?.reduce(
      (sum, insumo) => sum + (insumo.importeCosto || 0),
      0
    ) || 0;
  const totalVenta =
    product.insumos?.reduce(
      (sum, insumo) => sum + (insumo.importeVenta || 0),
      0
    ) || 0;
  const discount =
    totalCosto > 0
      ? Math.round(((totalCosto - totalVenta) / totalCosto) * 100)
      : 0;

  return (
    <div className="product-details-page">
      {/* Back Button */}
      <Button
        variant="link"
        onClick={handleBack}
        className="mb-3 text-decoration-none d-flex align-items-center gap-2"
      >
        <ArrowLeft size={18} />
        Volver a productos
      </Button>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row>
            {/* Product Images */}
            <Col lg={5}>
              <div className="mb-3">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.nombre}
                    className="w-100 rounded border"
                    style={{ height: "400px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="w-100 rounded border bg-light d-flex align-items-center justify-content-center"
                    style={{ height: "400px" }}
                  >
                    <Package size={80} className="text-muted" />
                  </div>
                )}
              </div>

              {/* Thumbnail (single image) */}
              {product.imagen && (
                <div className="d-flex gap-2">
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="rounded border"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      cursor: "pointer",
                      opacity: selectedImage === product.imagen ? 1 : 0.6,
                    }}
                    onClick={() => setSelectedImage(product.imagen)}
                  />
                </div>
              )}
            </Col>

            {/* Product Info */}
            <Col lg={7}>
              {/* Stock Badge */}
              <Badge
                bg={product.estatus ? "success" : "danger"}
                className="mb-3"
              >
                {product.estatus ? "In Stock" : "Out of Stock"}
              </Badge>

              {/* Product Title */}
              <h2 className="mb-3">{product.nombre}</h2>

              {/* Product Details Grid */}
              <Row className="mb-4">
                <Col md={6} className="mb-3">
                  <div className="text-muted small">UUID:</div>
                  <div className="fw-semibold">
                    {product._id}
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small">UNIDAD DE MEDIDA:</div>
                  <div className="fw-semibold">{product.unidad}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small">STOCK:</div>
                  <div className="fw-semibold">
                    {product.insumos?.length || 0}
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small">PUBLISHED:</div>
                  <div className="fw-semibold">
                    {new Date(product.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {new Date(product.createdAt).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small">VENTAS:</div>
                  <div className="fw-semibold">
                    {stats?.orderCount || 0} órdenes ({stats?.totalQuantitySold || 0} unidades)
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="text-muted small">INGRESOS:</div>
                  <div className="fw-semibold">
                    $
                    {(stats?.totalRevenue || 0).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </Col>
              </Row>

              {/* Price */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-3">
                  <span
                    className="text-danger fw-bold"
                    style={{ fontSize: "2rem" }}
                  >
                    ${totalVenta.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <Badge bg="danger" className="fs-6">
                      {discount}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Product Info Section */}
              {product.descripcion && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">PRODUCT INFO:</h5>
                  <p className="text-muted">{product.descripcion}</p>
                </div>
              )}

              {/* Insumos Section */}
              {product.insumos && product.insumos.length > 0 && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">INSUMOS:</h5>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Cantidad</th>
                          <th>Unidad</th>
                          <th>Costo</th>
                          <th>Venta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.insumos.map((insumo, index) => (
                          <tr key={index}>
                            <td>{insumo.nombre}</td>
                            <td>{insumo.cantidad}</td>
                            <td>{insumo.unidad}</td>
                            <td className="text-success">
                              ${insumo.importeCosto.toFixed(2)}
                            </td>
                            <td className="text-primary">
                              ${insumo.importeVenta.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2"
                  onClick={handleEdit}
                >
                  <Edit size={18} />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="d-flex align-items-center gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  Delisting
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProductDetailsPage;

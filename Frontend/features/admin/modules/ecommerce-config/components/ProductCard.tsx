import { useState } from "react";
import { Card, Badge, Button, InputGroup, Form } from "react-bootstrap";
import { TbShoppingCart, TbStar, TbStarFilled, TbPackage, TbPlus, TbMinus } from "react-icons/tb";
import Image from "next/image";
import { useCartStore } from "../store/cartStore";
import { toast } from "react-toastify";

interface ProductWithStock {
  _id: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl?: string;
  imagen?: string;
  productCategory?: any;
}

interface ProductCardProps {
  product: ProductWithStock;
  viewMode: "grid" | "list";
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((state) => state.addToCart);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= product.stock) {
      addToCart({
        _id: product._id,
        nombre: product.nombre || "Sin nombre",
        precio: product.precio || 0,
        stock: product.stock,
        imagen: product.imagen || product.imageUrl
      }, quantity);
      toast.success(`${quantity} ${product.nombre} agregado(s) al carrito`);
      setQuantity(1);
    } else {
      toast.error("Cantidad inválida");
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const getStockBadgeColor = (stock: number) => {
    if (stock > 20) return "success";
    if (stock > 10) return "warning";
    return "danger";
  };

  const renderRating = (rating: number = 4) => {
    return (
      <div className="d-flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? 
            <TbStarFilled key={star} size={14} className="text-warning" /> :
            <TbStar key={star} size={14} className="text-muted" />
        ))}
        <small className="text-muted ms-1">({Math.floor(Math.random() * 50) + 10})</small>
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <Card className="border-0 shadow-sm h-100 product-card-list">
        <Card.Body>
          <div className="d-flex">
            {/* Image */}
            <div className="flex-shrink-0 me-3" style={{ width: "120px", height: "120px" }}>
              <div className="bg-light rounded d-flex align-items-center justify-content-center h-100">
                {product.imageUrl ? (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.nombre || "Producto"}
                    width={100}
                    height={100}
                    className="img-fluid"
                  />
                ) : (
                  <TbPackage size={48} className="text-muted" />
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{product.nombre || "Sin nombre"}</h6>
                  <p className="text-muted small mb-2">
                    {product.descripcion || "Sin descripción"}
                  </p>
                  {renderRating()}
                </div>
                <div className="text-end">
                  {product.discountPercentage && (
                    <Badge bg="danger" className="mb-2">
                      -{product.discountPercentage}% OFF
                    </Badge>
                  )}
                  <div>
                    {product.originalPrice && (
                      <div className="text-muted text-decoration-line-through small">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                    <h5 className="text-primary mb-0">
                      {formatPrice(product.precio || 0)}
                    </h5>
                  </div>
                  <Badge 
                    bg={getStockBadgeColor(product.stock)} 
                    className="mt-2 mb-2"
                  >
                    Stock: {product.stock}
                  </Badge>
                  <div className="d-flex gap-2 mt-2">
                    <div className="d-flex align-items-center border rounded" style={{ padding: "2px" }}>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-1 text-secondary"
                        style={{ border: "none", background: "none" }}
                      >
                        <TbMinus size={16} />
                      </Button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= product.stock) {
                            setQuantity(val);
                          }
                        }}
                        className="text-center border-0"
                        style={{ 
                          width: "40px", 
                          outline: "none",
                          appearance: "textfield"
                        }}
                      />
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stock}
                        className="p-1 text-secondary"
                        style={{ border: "none", background: "none" }}
                      >
                        <TbPlus size={16} />
                      </Button>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={handleAddToCart}
                    >
                      <TbShoppingCart size={14} /> Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Grid View
  return (
    <Card className="border-0 shadow-sm h-100 product-card">
      {/* Discount Badge */}
      {product.discountPercentage && (
        <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 1 }}>
          <Badge bg="danger">-{product.discountPercentage}% OFF</Badge>
        </div>
      )}

      {/* Product Image */}
      <div className="position-relative" style={{ height: "200px", backgroundColor: "#f8f9fa" }}>
        {product.imageUrl ? (
          <Image 
            src={product.imageUrl} 
            alt={product.nombre || "Producto"}
            fill
            className="object-fit-contain p-3"
          />
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <TbPackage size={64} className="text-muted" />
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        {/* Product Name */}
        <h6 className="mb-2 text-truncate" title={product.nombre}>
          {product.nombre || "Sin nombre"}
        </h6>

        {/* Rating */}
        {renderRating()}

        {/* Description */}
        <p className="text-muted small mb-3 flex-grow-1" style={{ 
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {product.descripcion || "Sin descripción disponible"}
        </p>

        {/* Price */}
        <div className="mb-2">
          {product.originalPrice && (
            <span className="text-muted text-decoration-line-through small me-2">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <h5 className="text-primary mb-0">
            {formatPrice(product.precio || 0)}
          </h5>
        </div>

        {/* Stock Badge and Cart Actions */}
        <div className="mb-2">
          <Badge 
            bg={getStockBadgeColor(product.stock)}
            className="px-2 py-1 mb-2"
          >
            <TbPackage size={12} className="me-1" />
            Stock: {product.stock}
          </Badge>
        </div>
        
        {/* Quantity and Add to Cart */}
        <div className="d-flex gap-2">
          <div className="d-flex align-items-center border rounded" style={{ padding: "2px" }}>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="p-1 text-secondary"
              style={{ border: "none", background: "none" }}
            >
              <TbMinus size={16} />
            </Button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= product.stock) {
                  setQuantity(val);
                }
              }}
              className="text-center border-0"
              style={{ 
                width: "40px", 
                outline: "none",
                appearance: "textfield"
              }}
            />
            <Button 
              variant="link" 
              size="sm"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.stock}
              className="p-1 text-secondary"
              style={{ border: "none", background: "none" }}
            >
              <TbPlus size={16} />
            </Button>
          </div>
          <Button 
            variant="primary" 
            size="sm"
            className="flex-grow-1"
            onClick={handleAddToCart}
          >
            <TbShoppingCart size={16} />
          </Button>
        </div>
      </Card.Body>

      <style jsx>{`
        .product-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
        }
        .product-card-list {
          transition: box-shadow 0.2s;
        }
        .product-card-list:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
        }
        /* Ocultar flechas del input number */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </Card>
  );
};

export default ProductCard;
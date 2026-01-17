import { useState, useEffect } from "react";
import { ShoppingCart, Star, Package, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "../store/cartStore";
import { toast } from "react-toastify";
import { ecommerceConfigService } from "../services/ecommerceConfig";

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
  const [stockInEcommerce, setStockInEcommerce] = useState(0);
  const [availableStock, setAvailableStock] = useState(product.stock);

  const addToCart = useCartStore((state) => state.addToCart);
  const items = useCartStore((state) => state.items);
  const getAvailableStock = useCartStore((state) => state.getAvailableStock);

  // Obtener stock comprometido en itemsStock
  useEffect(() => {
    const getStockInEcommerce = async () => {
      try {
        const response = await ecommerceConfigService.getManagerConfig();
        const itemsStock = response.data.config?.itemsStock || [];
        const productInEcommerce = itemsStock.find((item: any) =>
          item.productId === product._id || item._id === product._id
        );
        const ecommerceStock = productInEcommerce?.stock || 0;
        setStockInEcommerce(ecommerceStock);

        // Calcular stock disponible real
        const stockInCart = items.find(item => item._id === product._id)?.quantity || 0;
        const realAvailable = product.stock - ecommerceStock - stockInCart;
        setAvailableStock(Math.max(0, realAvailable));
      } catch (error) {
        console.error("Error obteniendo stock del e-commerce:", error);
        // Si hay error, usar solo el stock del carrito
        const stockInCart = items.find(item => item._id === product._id)?.quantity || 0;
        setAvailableStock(Math.max(0, product.stock - stockInCart));
      }
    };

    getStockInEcommerce();
  }, [product._id, product.stock, items]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const handleAddToCart = () => {
    // Validar contra el stock disponible real
    if (quantity > availableStock) {
      toast.error(`No se puede tener mas stock en el e-commerce que en el storage. Storage: ${product.stock}, En e-commerce: ${stockInEcommerce}, En carrito: ${items.find(item => item._id === product._id)?.quantity || 0}, Disponible: ${availableStock}`);
      return;
    }

    if (quantity > 0) {
      addToCart({
        _id: product._id,
        nombre: product.nombre || "Sin nombre",
        precio: product.precio || 0,
        stock: product.stock, // Mantener el stock total para referencia
        imagen: product.imagen || product.imageUrl,
        descripcion: product.descripcion,
        productCategory: product.productCategory
      }, quantity);
      toast.success(`${quantity} ${product.nombre} agregado(s) al carrito`);
      setQuantity(1);

      // Actualizar stock disponible despues de agregar
      setAvailableStock(prev => Math.max(0, prev - quantity));
    } else {
      toast.error("Cantidad invalida");
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  const getStockBadgeVariant = (stock: number): "default" | "secondary" | "destructive" => {
    if (stock > 20) return "default";
    if (stock > 10) return "secondary";
    return "destructive";
  };

  const renderRating = (rating: number = 4) => {
    return (
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
        <small className="text-muted-foreground ml-1">({Math.floor(Math.random() * 50) + 10})</small>
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <Card className="border-0 shadow-sm h-full hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="flex-shrink-0 w-[120px] h-[120px]">
              <div className="bg-muted rounded-lg flex items-center justify-center h-full">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.nombre || "Producto"}
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h6 className="font-medium mb-1">{product.nombre || "Sin nombre"}</h6>
                  <p className="text-muted-foreground text-sm mb-2">
                    {product.descripcion || "Sin descripcion"}
                  </p>
                  {renderRating()}
                </div>
                <div className="text-right">
                  {product.discountPercentage && (
                    <Badge variant="destructive" className="mb-2">
                      -{product.discountPercentage}% OFF
                    </Badge>
                  )}
                  <div>
                    {product.originalPrice && (
                      <div className="text-muted-foreground line-through text-sm">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                    <h5 className="text-primary font-bold text-lg">
                      {formatPrice(product.precio || 0)}
                    </h5>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <Badge
                      variant={getStockBadgeVariant(product.stock)}
                    >
                      Storage: {product.stock}
                    </Badge>
                    {stockInEcommerce > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        E-commerce: {stockInEcommerce}
                      </Badge>
                    )}
                    <Badge
                      variant={availableStock > 0 ? "default" : "destructive"}
                      className={availableStock > 0 ? "bg-green-600" : ""}
                    >
                      Disponible: {availableStock}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= availableStock) {
                            setQuantity(val);
                          }
                        }}
                        className="w-10 h-8 text-center border-0 p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= availableStock}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddToCart}
                      className="h-8"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" /> Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid View
  return (
    <Card className="border-0 shadow-sm h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Discount Badge */}
      {product.discountPercentage && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="destructive">-{product.discountPercentage}% OFF</Badge>
        </div>
      )}

      {/* Product Image */}
      <div className="relative h-[200px] bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.nombre || "Producto"}
            fill
            className="object-contain p-3"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col p-4">
        {/* Product Name */}
        <h6 className="font-medium mb-2 truncate" title={product.nombre}>
          {product.nombre || "Sin nombre"}
        </h6>

        {/* Rating */}
        {renderRating()}

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-3 flex-grow line-clamp-2">
          {product.descripcion || "Sin descripcion disponible"}
        </p>

        {/* Price */}
        <div className="mb-2">
          {product.originalPrice && (
            <span className="text-muted-foreground line-through text-sm mr-2">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <h5 className="text-primary font-bold text-lg inline">
            {formatPrice(product.precio || 0)}
          </h5>
        </div>

        {/* Stock Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge
            variant={getStockBadgeVariant(product.stock)}
            className="px-2 py-0.5 text-xs"
          >
            <Package className="h-3 w-3 mr-1" />
            Storage: {product.stock}
          </Badge>
          {stockInEcommerce > 0 && (
            <Badge
              variant="secondary"
              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800"
            >
              E-com: {stockInEcommerce}
            </Badge>
          )}
          <Badge
            variant={availableStock > 0 ? "default" : "destructive"}
            className={`px-2 py-0.5 text-xs ${availableStock > 0 ? "bg-green-600" : ""}`}
          >
            Disp: {availableStock}
          </Badge>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="flex gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= availableStock) {
                  setQuantity(val);
                }
              }}
              className="w-10 h-8 text-center border-0 p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= availableStock}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            className="flex-grow h-8"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

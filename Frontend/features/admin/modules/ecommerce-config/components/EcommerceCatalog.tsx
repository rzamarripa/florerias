import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Package,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "../store/cartStore";
import type { StockItem } from "../types";
import { toast } from "react-toastify";

interface EcommerceCatalogProps {
  itemsStock: StockItem[] | undefined;
  colors: any;
  typography: any;
  onClose: () => void;
}

const EcommerceCatalog: React.FC<EcommerceCatalogProps> = ({
  itemsStock = [],
  colors,
  typography,
  onClose,
}) => {
  const [filteredProducts, setFilteredProducts] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");
  const [showFilters, setShowFilters] = useState(false);

  const { addToCart, getTotalItems, openCart, initializeStock, getAvailableStock } = useCartStore();
  const totalItemsInCart = getTotalItems();

  // Initialize stock on mount
  useEffect(() => {
    if (itemsStock && itemsStock.length > 0) {
      initializeStock(itemsStock.map(p => ({ _id: p._id, stock: p.stock })));
    }
  }, [itemsStock]);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...itemsStock];

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search) ||
          p.descripcion?.toLowerCase().includes(search)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        break;
      case "price-asc":
        filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
        break;
    }

    setFilteredProducts(filtered);
  }, [itemsStock, searchTerm, sortBy]);

  const handleAddToCart = (product: StockItem) => {
    const availableStock = getAvailableStock(product._id);
    
    if (availableStock <= 0) {
      toast.error("No hay stock disponible");
      return;
    }

    addToCart({
      _id: product._id,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      imagen: product.imagen,
      productCategory: product.productCategory,
    }, 1);
    
    toast.success(`${product.nombre} agregado al carrito`);
  };

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 z-30 bg-white overflow-hidden">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 bg-white border-b shadow-sm"
        style={{ borderColor: colors?.primary || '#6366f1' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  fontFamily: typography?.titleFont || 'Inter',
                  color: colors?.primary || '#6366f1'
                }}
              >
                Catálogo de Productos
              </h1>
              <Badge variant="secondary" className="text-sm">
                {filteredProducts.length} productos disponibles
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="price-asc">Precio ↑</SelectItem>
                  <SelectItem value="price-desc">Precio ↓</SelectItem>
                </SelectContent>
              </Select>

              {/* Cart Button */}
              <Button
                variant="default"
                onClick={openCart}
                className="relative"
                style={{ backgroundColor: colors?.secondary || '#8b5cf6' }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrito
                {totalItemsInCart > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {totalItemsInCart}
                  </Badge>
                )}
              </Button>

              {/* Close Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto p-4 overflow-auto" style={{ height: 'calc(100vh - 73px)' }}>
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground">Intenta ajustar tu búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const availableStock = getAvailableStock(product._id);
              const isOutOfStock = availableStock <= 0;
              
              return (
                <div
                  key={product._id}
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.imagen ? (
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">Agotado</span>
                      </div>
                    )}
                    {/* Stock Badge */}
                    <Badge
                      variant={availableStock > 5 ? "default" : availableStock > 0 ? "secondary" : "destructive"}
                      className="absolute top-2 right-2"
                    >
                      Stock: {availableStock}
                    </Badge>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {product.nombre}
                    </h3>
                    {product.descripcion && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {product.descripcion}
                      </p>
                    )}
                    
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: colors?.primary || '#6366f1' }}
                        >
                          ${product.precio.toFixed(2)}
                        </span>
                      </div>
                      
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        style={{ 
                          backgroundColor: isOutOfStock ? '#9ca3af' : (colors?.primary || '#6366f1'),
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EcommerceCatalog;
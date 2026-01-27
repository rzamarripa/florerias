import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Package,
  Loader2,
  Grid,
  List,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "../store/cartStore";
import ClientCartModal from "./ClientCartModal";
import { ecommerceConfigService } from "../services/ecommerceConfig";
import type { StockItem, EcommerceConfig } from "../types";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

// Categorías y marcas simuladas para los filtros
const categories = [
  { name: "Electronics", count: 8 },
  { name: "Computers", count: 6 },
  { name: "Home & Office", count: 8 },
  { name: "Accessories", count: 0 },
  { name: "Gaming", count: 9 },
  { name: "Mobile Phones", count: 12 },
  { name: "Appliances", count: 0 },
];

const brands = [
  { name: "Apple", count: 14 },
  { name: "Samsung", count: 38 },
  { name: "Sony", count: 0 },
  { name: "Dell", count: 7 },
  { name: "HP", count: 0 },
];

export default function EcommerceCatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EcommerceConfig | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Estados para filtros
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);

  const { 
    addToCart, 
    getTotalItems, 
    openCart, 
    initializeStock, 
    getAvailableStock 
  } = useCartStore();
  const totalItemsInCart = getTotalItems();

  // Load configuration and products
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await ecommerceConfigService.getManagerConfig();
      const { config: configData, branch } = response.data;

      const fullConfig = {
        ...configData,
        header: configData?.header || {
          pageTitle: branch?.branchName || "Mi Tienda Online",
          logoUrl: "",
          logoPath: "",
          topbar: [],
        },
        colors: configData?.colors || {
          primary: "#6366f1",
          secondary: "#10b981",
          background: "#ffffff",
          text: "#1f2937",
        },
        typography: configData?.typography || {
          titleFont: "Inter",
          titleSize: 36,
          textFont: "Inter",
          subtitleSize: 24,
          normalSize: 16,
        },
      };

      // Agregar propiedades simuladas a los productos para el diseño mejorado
      if (fullConfig.itemsStock && fullConfig.itemsStock.length > 0) {
        fullConfig.itemsStock = fullConfig.itemsStock.map(p => ({
          ...p,
          discount: Math.floor(Math.random() * 30 + 10), // Descuento entre 10-40%
          originalPrice: p.precio * (1 + Math.random() * 0.5), // Precio original simulado
          rating: 3 + Math.random() * 2, // Rating entre 3-5
          reviews: Math.floor(Math.random() * 100), // Reviews entre 0-100
        }));
      }

      setConfig(fullConfig);
      
      // Initialize stock
      if (fullConfig.itemsStock && fullConfig.itemsStock.length > 0) {
        initializeStock(fullConfig.itemsStock.map(p => ({ _id: p._id, stock: p.stock })));
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
      toast.error("Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  useEffect(() => {
    if (!config?.itemsStock) return;
    
    let filtered = [...config.itemsStock];

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search) ||
          p.descripcion?.toLowerCase().includes(search)
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]
    );

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
  }, [config?.itemsStock, searchTerm, sortBy, priceRange]);

  // Helper functions para filtros
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    setMinPrice(values[0]);
    setMaxPrice(values[1]);
  };

  // Helper function para renderizar estrellas
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={cn(
              i < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">No se pudo cargar el catálogo</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const totalProducts = config?.itemsStock?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {totalProducts} Productos
            </h1>
          </div>

          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 bg-gray-50 border-gray-200"
              />
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="flex rounded-lg border border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-r-none px-3",
                    viewMode === "grid" && "bg-gray-100"
                  )}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-l-none px-3",
                    viewMode === "list" && "bg-gray-100"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Cart Button */}
              <Button
                variant="default"
                onClick={openCart}
                className="relative bg-indigo-600 hover:bg-indigo-700"
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
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Sidebar Filters */}
        <div className="w-64 p-6 border-r bg-white">
          {/* Categories */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Categoría:</h3>
              <button className="text-xs text-indigo-600 hover:underline">Ver Todo</button>
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <label
                  key={category.name}
                  className="flex items-center justify-between cursor-pointer hover:text-gray-700"
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedCategories.includes(category.name)}
                      onCheckedChange={() => toggleCategory(category.name)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">{category.name}</span>
                  </div>
                  {category.count > 0 && (
                    <span className="text-xs text-gray-400">({category.count})</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Marcas:</h3>
              <button className="text-xs text-indigo-600 hover:underline">Ver Todo</button>
            </div>
            <div className="space-y-3">
              {brands.map((brand) => (
                <label
                  key={brand.name}
                  className="flex items-center justify-between cursor-pointer hover:text-gray-700"
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedBrands.includes(brand.name)}
                      onCheckedChange={() => toggleBrand(brand.name)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">{brand.name}</span>
                  </div>
                  {brand.count > 0 && (
                    <span className="text-xs text-gray-400">({brand.count})</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Precio:</h3>
            <div className="space-y-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                min={0}
                max={5000}
                step={100}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinPrice(val);
                      setPriceRange([val, maxPrice]);
                    }}
                    className="h-8 text-xs"
                    placeholder="Min"
                  />
                </div>
                <span className="text-gray-400 text-xs">a</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxPrice(val);
                      setPriceRange([minPrice, val]);
                    }}
                    className="h-8 text-xs"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-6">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Package className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product: any) => {
                const availableStock = getAvailableStock(product._id);
                const isOutOfStock = availableStock <= 0;
                const discount = product.discount || 15;
                const originalPrice = product.originalPrice || product.precio * 1.3;
                const rating = product.rating || 4;
                const reviews = product.reviews || 45;
                
                return (
                  <div
                    key={product._id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group"
                  >
                    {/* Product Image con Badge de descuento */}
                    <div className="relative aspect-square bg-gray-50">
                      {/* Discount Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-xs">
                          {discount}% OFF
                        </Badge>
                      </div>

                      {/* Stock Badge en esquina superior derecha */}
                      {availableStock <= 5 && (
                        <Badge
                          variant={availableStock > 0 ? "secondary" : "destructive"}
                          className="absolute top-2 right-2 z-10 text-xs"
                        >
                          Stock: {availableStock}
                        </Badge>
                      )}

                      {product.imagen ? (
                        <img
                          src={product.imagen}
                          alt={product.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">Agotado</span>
                        </div>
                      )}

                      {/* Botón de carrito en hover */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={isOutOfStock}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Product Info con ratings */}
                    <div className="p-4">
                      <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.nombre}
                      </h3>
                      
                      {/* Rating y Reviews */}
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating)}
                        <span className="text-xs text-gray-500">({reviews})</span>
                      </div>
                      
                      {/* Precios */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through text-sm">
                          ${originalPrice.toFixed(2)}
                        </span>
                        <span className="text-lg font-semibold text-indigo-600">
                          ${product.precio.toFixed(2)}
                        </span>
                      </div>

                      {/* Botón agregar al carrito (mantener el existente también) */}
                      <Button
                        className="w-full text-xs mt-3"
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        style={{ 
                          backgroundColor: isOutOfStock ? '#9ca3af' : '#6366f1'
                        }}
                      >
                        {isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Modal */}
      <ClientCartModal
        colors={config.colors}
        typography={config.typography}
      />
    </div>
  );
}
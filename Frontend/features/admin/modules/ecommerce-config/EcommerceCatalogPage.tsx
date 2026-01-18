"use client";

import { useState, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  List,
  ShoppingCart,
  Package,
  CloudUpload,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productListsService } from "@/features/admin/modules/product-lists/services/productLists";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { productCategoriesService } from "@/features/admin/modules/productCategories/services/productCategories";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import { toast } from "react-toastify";
import ProductCard from "./components/ProductCard";
import CategoryFilter from "./components/CategoryFilter";
import PriceRangeFilter from "./components/PriceRangeFilter";
import CartModal from "./components/CartModal";
import { useCartStore } from "./store/cartStore";
import type { Product } from "@/features/admin/modules/products/types";
import type { ProductCategory } from "@/features/admin/modules/productCategories/types";
import type { Storage } from "@/features/admin/modules/storage/types";

interface ProductWithStock extends Product {
  stock: number;
  originalPrice?: number;
  discountPercentage?: number;
}

export default function EcommerceCatalogPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>(
    []
  );
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState<
    "name" | "price-asc" | "price-desc" | "stock"
  >("name");
  const [branchId, setBranchId] = useState<string>("");
  const [hasNoStorage, setHasNoStorage] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {}
  );
  const [syncingToEcommerce, setSyncingToEcommerce] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const { openCart, getTotalItems, initializeStock } = useCartStore();
  const totalItemsInCart = getTotalItems();

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Obtener la configuracion del gerente para obtener el branchId
      const configResponse = await ecommerceConfigService.getManagerConfig();
      const branch = configResponse.data.branch;
      const config = configResponse.data.config;

      if (!branch?._id) {
        toast.error("No se pudo obtener la informacion de la sucursal");
        return;
      }

      setBranchId(branch._id);
      if (config?._id) {
        setConfigId(config._id);
      }

      // Cargar productos, storage y categorias en paralelo
      const [productListResponse, storageResponse, categoriesResponse] =
        await Promise.all([
          productListsService.getProductListByBranch(branch._id),
          storageService.getStorageByBranch(branch._id),
          productCategoriesService.getAllProductCategories({
            limit: 100,
            isActive: true,
          }),
        ]);

      // Procesar productos con stock
      if (productListResponse.success && productListResponse.data) {
        console.log("ProductList Response:", productListResponse.data);
        const productList = productListResponse.data.products || [];
        const storage: Storage | null = storageResponse.success
          ? storageResponse.data
          : null;

        if (!storage) {
          setHasNoStorage(true);
          setProducts([]);
          setFilteredProducts([]);
        } else {
          console.log("Storage products:", storage.products);
          // Combinar productos con stock del storage
          const productsWithStock = productList
            .map((product: any) => {
              // Los productos vienen embebidos con productId, nombre, totalVenta, etc.
              const productId = product.productId || product._id;
              const stockItem = storage.products?.find((p: any) => {
                const storageProductId =
                  typeof p.productId === "string"
                    ? p.productId
                    : p.productId?._id;
                return storageProductId === productId;
              });

              console.log(`Product ${product.nombre}:`, {
                productId,
                stockFound: !!stockItem,
                quantity: stockItem?.quantity,
              });

              return {
                _id: productId, // Usar productId como _id
                nombre: product.nombre,
                descripcion: product.descripcion,
                precio: product.totalVenta || product.precio || 0, // totalVenta es el precio
                stock: stockItem?.quantity || 0,
                productCategory: product.productCategory,
                imagen: product.imagen,
              };
            })
            .filter((p: ProductWithStock) => p.stock > 0); // Filtrar productos sin stock

          console.log("Products with stock:", productsWithStock);

          // Calcular precio maximo
          const max = Math.max(
            ...productsWithStock.map((p) => p.precio || 0),
            10000
          );
          setMaxPrice(max);
          setPriceRange([0, max]);

          // Calcular conteo de productos por categoria
          const counts: Record<string, number> = {};
          productsWithStock.forEach((product) => {
            const categoryId =
              typeof product.productCategory === "string"
                ? product.productCategory
                : product.productCategory?._id;
            if (categoryId) {
              counts[categoryId] = (counts[categoryId] || 0) + 1;
            }
          });
          setProductCounts(counts);
          console.log("Product counts by category:", counts);

          setProducts(productsWithStock);
          setFilteredProducts(productsWithStock);

          // Inicializar el stock disponible en el store
          initializeStock(productsWithStock.map(p => ({ _id: p._id, stock: p.stock })));
        }
      }

      // Establecer categorias
      if (categoriesResponse.success) {
        console.log("Categories Response:", categoriesResponse.data);
        setCategories(categoriesResponse.data);
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar el catalogo de productos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar productos
  useEffect(() => {
    let filtered = [...products];

    // Filtrar por busqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search) ||
          p.descripcion?.toLowerCase().includes(search)
      );
    }

    // Filtrar por categorias
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.productCategory &&
          selectedCategories.includes(
            p.productCategory._id || p.productCategory
          )
      );
    }

    // Filtrar por rango de precio
    filtered = filtered.filter((p) => {
      const price = p.precio || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Ordenar
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
      case "stock":
        filtered.sort((a, b) => b.stock - a.stock);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategories, priceRange, sortBy]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSearchTerm("");
    setSortBy("name");
  };

  // Sincronizar productos con la configuracion del e-commerce
  const syncProductsToEcommerce = async () => {
    if (!configId) {
      toast.error("No se ha configurado el e-commerce para esta sucursal");
      return;
    }

    try {
      setSyncingToEcommerce(true);

      // Obtener la configuracion actual para sumar al stock existente
      const configResponse = await ecommerceConfigService.getManagerConfig();
      const currentItemsStock = configResponse.data.config?.itemsStock || [];

      // Crear mapa de items existentes
      const existingItemsMap = new Map(
        currentItemsStock.map((item: any) => [item.productId || item._id, item])
      );

      // Preparar los productos para sincronizar
      const itemsStock = products.map(product => {
        const existingItem = existingItemsMap.get(product._id);

        return {
          _id: product._id,
          productId: product._id,
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: product.precio,
          // Si ya existe, sumar el stock del storage al existente
          stock: existingItem ? (existingItem.stock + product.stock) : product.stock,
          imagen: product.imagen,
          productCategory: typeof product.productCategory === 'string'
            ? product.productCategory
            : product.productCategory?._id,
          originalPrice: product.originalPrice,
          discountPercentage: product.discountPercentage
        };
      });

      // Mantener productos que ya estaban pero no estan en el storage actual
      currentItemsStock.forEach((existingItem: any) => {
        const productId = existingItem.productId || existingItem._id;
        if (!products.find(p => p._id === productId)) {
          itemsStock.push(existingItem);
        }
      });

      // Actualizar la configuracion y vaciar el storage
      await ecommerceConfigService.updateItemsStock(configId, itemsStock, true, true); // deductFromStorage=true, transferAll=true

      toast.success(`Stock transferido completamente al e-commerce. Storage vaciado.`);

      // Recargar los datos para reflejar el storage vacio
      await loadInitialData();
    } catch (error) {
      console.error("Error al sincronizar productos:", error);
      toast.error("Error al sincronizar productos con el e-commerce");
    } finally {
      setSyncingToEcommerce(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasNoStorage) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          No hay almacen configurado
        </AlertTitle>
        <AlertDescription>
          Esta sucursal no tiene un almacen configurado. Por favor, configure un
          almacen para ver los productos disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="ecommerce-catalog-page">
      {/* Cart Modal */}
      <CartModal branchId={branchId} onProductsSaved={loadInitialData} />

      {/* Header */}
      <div className="bg-background border-b px-4 py-3 mb-4">
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12 md:col-span-2">
            <h6 className="text-sm text-muted-foreground mb-0">
              {filteredProducts.length} Productos
            </h6>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="price-asc">Precio ↑</SelectItem>
                  <SelectItem value="price-desc">Precio ↓</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Buttons */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none h-9"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none h-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sync to Ecommerce Button */}
              <Button
                variant="default"
                size="sm"
                onClick={syncProductsToEcommerce}
                disabled={syncingToEcommerce || products.length === 0}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 h-9"
                title="Transfiere TODO el stock del almacen al e-commerce"
              >
                {syncingToEcommerce ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {syncingToEcommerce ? "Transfiriendo..." : "Transferir Todo"}
                </span>
              </Button>

              {/* Cart Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={openCart}
                className="relative bg-yellow-500 hover:bg-yellow-600 text-white h-9"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItemsInCart > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                  >
                    {totalItemsInCart}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-4 px-3">
        {/* Sidebar Filters */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="shadow-sm mb-3">
            <CardHeader className="bg-muted/50 py-3">
              <div className="flex justify-between items-center">
                <h6 className="text-sm font-medium mb-0">Filtros</h6>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={clearFilters}
                >
                  Limpiar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Categorias */}
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                productCounts={productCounts}
              />

              {/* Rango de Precio */}
              <PriceRangeFilter
                min={0}
                max={maxPrice}
                value={priceRange}
                onChange={handlePriceRangeChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Products Grid/List */}
        <div className="col-span-12 lg:col-span-9">
          {filteredProducts.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                <h5 className="text-lg font-medium">No se encontraron productos</h5>
                <p className="text-muted-foreground">
                  Intenta ajustar los filtros o terminos de busqueda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
